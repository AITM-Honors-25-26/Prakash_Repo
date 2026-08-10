import { SMSConfig } from "../config/constants.js";
import { toInternational } from "../utils/phone.util.js";

// Sparrow SMS v2 gateway (https://sparrowsms.com) - the most widely used bulk
// SMS / OTP gateway in Nepal. Sends an application/x-www-form-urlencoded POST
// to api.sparrowsms.com/v2/sms/ with: token, from (registered sender ID, max 6
// characters), to (recipient in international format, e.g. 97798XXXXXXXX) and
// text (max 160 chars per credit).
//
// The endpoint and credentials are read from env (SPARROW_API_URL / SPARROW_TOKEN
// / SPARROW_FROM). When no token/from are configured the service falls back to a
// console preview so development keeps working before an account is set up.

const SPARROW_OK_CODE = 200;

const isConfigured = () => Boolean(SMSConfig.sparrow.token && SMSConfig.sparrow.from);

class SmsService {
    // Sends a transactional SMS. Resolves to { delivered: true, provider } when
    // the gateway accepted it, or { delivered: false, provider: "none" } when no
    // credentials are configured (dev preview). Throws a tagged error object on
    // gateway/validation failures so the BullMQ worker logs and retries it.
    sendSms = async ({ to, message }) => {
        if (!to || !message) {
            throw { message: "SMS requires a recipient number and a message.", status: "SMS_INVALID_REQUEST" };
        }

        const recipient = toInternational(to);
        if (!recipient || recipient.length < 10) {
            throw { message: "SMS recipient number is invalid.", status: "SMS_INVALID_NUMBER" };
        }

        // No gateway credentials yet - log a preview instead of failing the job.
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
