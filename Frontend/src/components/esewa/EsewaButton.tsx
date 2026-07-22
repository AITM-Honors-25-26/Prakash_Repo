import React from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../constants/constants';

interface EsewaButtonProps {
  amount: string;
  orderId: string;
}

const EsewaButton: React.FC<EsewaButtonProps> = ({ amount, orderId }) => {

  const handlePay = async (): Promise<void> => {
    try {

      const { data } = await axios.post<{ signature: string, product_code: string }>(
        API_ENDPOINTS.ESEWA_INIT,
        { amount, transaction_uuid: orderId }
      );

      const form = document.createElement("form");
      form.action = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
      form.method = "POST";

      const fields: Record<string, string> = {
        amount: amount,
        tax_amount: "0",
        total_amount: amount,
        transaction_uuid: orderId,
        product_code: data.product_code,
        signature: data.signature,
        success_url: `${window.location.origin}/payment/success`,
        failure_url: `${window.location.origin}/payment/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code"
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("Payment initiation failed", err);
    }
  };

  return (
    <button
      onClick={handlePay}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Pay with eSewa
    </button>
  );
};

export default EsewaButton;