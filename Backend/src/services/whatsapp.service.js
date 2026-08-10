import { WhatsAppConfig } from "../config/constants.js";
import { toInternational } from "../utils/phone.util.js";

// Meta WhatsApp Business Platform - Cloud API. Primary OTP delivery channel for
// phone numbers (replaces SMS). Business-initiated messages must use an
// approved template, so the OTP goes out as a template message containing a
// {{1}} variable (e.g. "Your Melina's Bakery membership code is {{1}}. Valid
// for 5 minutes. Do not share it.").
//
// Configured via env: WHATSAPP_TOKEN (system-user access token),
// WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_TEMPLATE_NAME. Free in practice while
// a 24h customer-service window is open (the customer messaged the business
// first); cold authentication-template deliveries are billed per message.

const isConfigured = () =>
    Boolean(WhatsAppConfig.token && WhatsAppConfig.phoneNumberId && WhatsAppConfig.templateName);

class WhatsAppService {
    // Sends the 6-digit OTP as a WhatsApp template message. Never throws for
    // delivery/gateway failures - resolves to { delivered: false, reason }
    // instead, so the caller can fall back to another channel (Sparrow SMS).
    sendOtp = async ({ to, otp }) => {
        const recipient = toInternational(to);
        if (!recipient || recipient.length < 10) {
            console.warn(`[WhatsApp] Skipping invalid number: "${to}"`);
            return { delivered: false, reason: "invalid-number" };
        }

        // No gateway credentials yet - log a preview instead of failing the job.
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
