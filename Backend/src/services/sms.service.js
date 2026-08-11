import { SMSConfig } from "../config/constants.js";
import { toInternational } from "../utils/phone.util.js";

const SPARROW_OK_CODE = 200;

const isConfigured = () => Boolean(SMSConfig.sparrow.token && SMSConfig.sparrow.from);

class SmsService {
    sendSms = async ({ to, message }) => {
        if (!to || !message) {
            throw { message: "SMS requires a recipient number and a message.", status: "SMS_INVALID_REQUEST" };
        }

        const recipient = toInternational(to);
        if (!recipient || recipient.length < 10) {
            throw { message: "SMS recipient number is invalid.", status: "SMS_INVALID_NUMBER" };
        }

        if (!isConfigured()) {
            console.log(`[SMS-PREVIEW] To ${recipient}: ${message}`);
            return { delivered: false, provider: "none" };
        }

        const body = new URLSearchParams({
            token: SMSConfig.sparrow.token,
            from: SMSConfig.sparrow.from,
            to: recipient,
            text: message,
        });

        let response;
        try {
            response = await fetch(SMSConfig.sparrow.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body.toString(),
            });
        } catch (exception) {
            throw { message: `Sparrow SMS request failed: ${exception.message}`, status: "SMS_SEND_FAILED" };
        }

        const data = await response.json().catch(() => null);
        const code = Number(data?.code);

        if (!response.ok || code !== SPARROW_OK_CODE) {
            const detail = data?.response ? ` ${data.response}` : "";
            throw {
                message: `Sparrow SMS rejected the message (code ${code || response.status}).${detail}`,
                status: "SMS_SEND_FAILED",
            };
        }

        console.log(`[SMS] ✅ Sent OTP to ${recipient} (${data?.count ?? 1} credit(s)).`);
        return { delivered: true, provider: "sparrow" };
    }
}

const smsSvc = new SmsService();
export default smsSvc;
