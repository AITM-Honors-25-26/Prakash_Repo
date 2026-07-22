import crypto from 'crypto';
import { generateQR } from '../../QrGenerator/qrGenerator.js';
import { AppConfig, PaymentStatus } from '../constants.js';
import * as OrderService from '../../modules/order/order.service.js';

// Falls back to eSewa's public sandbox code when MERCHANT_ID isn't set, so
// the app still works out of the box in dev - set MERCHANT_ID in .env to
// switch to your real eSewa merchant code for production.
const DEFAULT_PRODUCT_CODE = 'EPAYTEST';

const buildSignature = (secretKey, { total_amount, transaction_uuid, product_code }) => {
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto.createHmac('sha256', secretKey).update(data).digest('base64');
};

// Existing endpoint - used when the same device that placed the order pays
// directly (desktop "Pay Now" without the QR step).
export const initiateEsewa = async (req, res) => {
    try {
        const { amount, transaction_uuid } = req.body;
        const secretKey = process.env.ESEWA_SECRET_KEY; // Keep this in .env!
        const productCode = process.env.MERCHANT_ID || DEFAULT_PRODUCT_CODE;

        if (!secretKey) {
            return res.status(500).json({ error: "ESEWA_SECRET_KEY is not set in the backend .env file" });
        }
        if (!amount || !transaction_uuid) {
            return res.status(400).json({ error: "amount and transaction_uuid are required" });
        }

        const signature = buildSignature(secretKey, {
            total_amount: amount,
            transaction_uuid,
            product_code: productCode,
        });

        res.json({ signature, product_code: productCode });
    } catch (error) {
        res.status(500).json({ error: "Signature generation failed" });
    }
};

// New: called from CheckoutPage when the customer picks "Pay Now" and wants
// a QR to scan with their phone instead of paying on the current device.
// The QR encodes a link to our own frontend "pay" page for this order -
// scanning it opens that page on the phone, which then auto-submits the
// eSewa form itself (see /payment/pay/:orderId on the frontend).
export const generateEsewaQr = async (req, res) => {
    try {
        const { amount, transaction_uuid } = req.body;

        if (!amount || !transaction_uuid) {
            return res.status(400).json({ success: false, message: "amount and transaction_uuid are required" });
        }

        const order = await OrderService.getOrderById(transaction_uuid);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (!AppConfig.frontend_Url) {
            return res.status(500).json({ success: false, message: "FRONTEND_URL is not set in the backend .env file" });
        }

        const payUrl = `${AppConfig.frontend_Url}/payment/pay/${transaction_uuid}`;
        const qrImage = await generateQR(payUrl);

        await OrderService.setPaymentStatus(transaction_uuid, PaymentStatus.PENDING, { paymentMethod: 'Esewa' });

        return res.status(200).json({
            success: true,
            data: { qrImage, transaction_uuid, payUrl },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "QR generation failed" });
    }
};

// eSewa v2 redirects the browser here after a payment attempt, with a
// base64-encoded JSON payload in ?data=. We decode it, re-derive the
// signature the same way we generated it, and only mark the order Paid if
// it matches (otherwise someone could just hit this URL directly).
export const esewaSuccess = async (req, res) => {
    const frontendUrl = AppConfig.frontend_Url || '';

    try {
        const { data } = req.query;
        const secretKey = process.env.ESEWA_SECRET_KEY;

        if (!data || !secretKey) {
            return res.redirect(`${frontendUrl}/payment/failure`);
        }

        const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        const {
            transaction_uuid,
            total_amount,
            status,
            transaction_code,
            signed_field_names,
            signature,
        } = decoded;

        // Rebuild the signed string using whatever field order eSewa signed,
        // pulling each value out of the decoded payload.
        const signedString = signed_field_names
            .split(',')
            .map((field) => `${field}=${decoded[field]}`)
            .join(',');

        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(signedString)
            .digest('base64');

        if (expectedSignature !== signature || status !== 'COMPLETE') {
            await OrderService.setPaymentStatus(transaction_uuid, PaymentStatus.FAILED);
            return res.redirect(`${frontendUrl}/payment/failure?orderId=${transaction_uuid}`);
        }

        await OrderService.setPaymentStatus(transaction_uuid, PaymentStatus.PAID, {
            esewaTransactionCode: transaction_code,
        });

        return res.redirect(`${frontendUrl}/payment/success?orderId=${transaction_uuid}&amount=${total_amount}`);
    } catch (error) {
        return res.redirect(`${frontendUrl}/payment/failure`);
    }
};

export const esewaFailure = async (req, res) => {
    const frontendUrl = AppConfig.frontend_Url || '';
    try {
        const { transaction_uuid } = req.query;
        if (transaction_uuid) {
            await OrderService.setPaymentStatus(transaction_uuid, PaymentStatus.FAILED);
        }
    } catch (error) {
        // swallow - we're redirecting either way
    }
    return res.redirect(`${frontendUrl}/payment/failure`);
};