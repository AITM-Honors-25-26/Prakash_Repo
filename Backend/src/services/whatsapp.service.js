import { WhatsAppConfig } from "../config/constants.js";
import { toInternational } from "../utils/phone.util.js";

const isConfigured = () =>
    Boolean(WhatsAppConfig.token && WhatsAppConfig.phoneNumberId && WhatsAppConfig.templateName);

class WhatsAppService {
    sendOtp = async ({ to, otp }) => {
        const recipient = toInternational(to);
        if (!recipient || recipient.length < 10) {
            console.warn(`[WhatsApp] Skipping invalid number: "${to}"`);
            return { delivered: false, reason: "invalid-number" };
        }

        if (!isConfigured()) {
            console.log(`[WHATSAPP-PREVIEW] To ${recipient}: OTP ${otp} (expires in 5 minutes)`);
            return { delivered: false, reason: "not-configured" };
        }

        const url = `${WhatsAppConfig.apiUrl}${WhatsAppConfig.phoneNumberId}/messages`;
        const body = {
            messaging_product: "whatsapp",
            to: recipient,
            type: "template",
            template: {
                name: WhatsAppConfig.templateName,
                language: { code: WhatsAppConfig.templateLanguage },
                components: [
                    { type: "body", parameters: [{ type: "text", text: otp }] }
                ]
            }
        };

        let response;
        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${WhatsAppConfig.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body),
            });
        } catch (exception) {
            console.error(`[WhatsApp] Request failed: ${exception.message}`);
            return { delivered: false, reason: "request-failed" };
        }

        const data = await response.json().catch(() => null);
        const error = data?.error;

        if (!response.ok || error) {
            console.error(`[WhatsApp] Gateway error: ${error?.message ?? response.status}`);
            return { delivered: false, reason: "gateway-error", error: error ?? null };
        }

        console.log(`[WhatsApp] ✅ Sent OTP to ${recipient} (message id ${data?.messages?.[0]?.id ?? "n/a"}).`);
        return { delivered: true, provider: "whatsapp" };
    }
}

const whatsappSvc = new WhatsAppService();
export default whatsappSvc;
