import crypto from 'crypto';
import { generateQR } from '../../QrGenerator/qrGenerator.js';
import { AppConfig, PaymentStatus } from '../constants.js';
import * as OrderService from '../../modules/order/order.service.js';
import tableSvc from '../../modules/table/table.service.js';

const DEFAULT_PRODUCT_CODE = 'EPAYTEST';

const buildSignature = (secretKey, { total_amount, transaction_uuid, product_code }) => {
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto.createHmac('sha256', secretKey).update(data).digest('base64');
};

export const initiateEsewa = async (req, res) => {
    try {
        const { amount, transaction_uuid } = req.body;
        const secretKey = process.env.ESEWA_SECRET_KEY;
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

        const paidOrder = await OrderService.getOrderById(transaction_uuid);
        if (paidOrder?.tableNumber) {
            const io = req.app.get('io');
            if (io) {
                const updatedTable = await tableSvc.refreshTableBilling(paidOrder.tableNumber);
                io.emit('table_billing_updated', updatedTable);
            }
        }

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
    }
    return res.redirect(`${frontendUrl}/payment/failure`);
};
