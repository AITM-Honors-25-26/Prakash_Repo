
import crypto from 'crypto';

export const initiateEsewa = async (req, res) => {
    try {
        const { amount, transaction_uuid } = req.body;
        const secretKey = process.env.ESEWA_SECRET_KEY; // Keep this in .env!
        
        // Data format required by eSewa v2
        const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=EPAYTEST`;
        
        const signature = crypto
            .createHmac("sha256", secretKey)
            .update(data)
            .digest("base64");

        res.json({ signature, product_code: "EPAYTEST" });
    } catch (error) {
        res.status(500).json({ error: "Signature generation failed" });
    }
};