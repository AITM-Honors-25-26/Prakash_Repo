// server/utils/esewa.js
import crypto from 'crypto';

export const createEsewaSignature = ({ total_amount, transaction_uuid, product_code, secret_key }) => {
    const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    
    return crypto
        .createHmac("sha256", secret_key)
        .update(data)
        .digest("base64");
};