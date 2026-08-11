import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.config.js";

import whatsappSvc from "../services/whatsapp.service.js";
import smsQueue from "./sms.queue.js";
import { SMS_JOBS } from "./sms.worker.js";

export const WHATSAPP_JOBS = {
    MEMBERSHIP_OTP: "membership-otp-whatsapp",
};

const whatsappWorker = new Worker(
    "whatsapp-queue",
    async (job) => {
        console.log(`[WhatsAppWorker] Processing: ${job.name}`, job.data);

        if (job.name === WHATSAPP_JOBS.MEMBERSHIP_OTP) {
            const { to, otp } = job.data;
            const result = await whatsappSvc.sendOtp({ to, otp });

            if (!result.delivered) {
                console.log(`[WhatsAppWorker] WhatsApp unavailable (${result.reason}) → falling back to SMS.`);
                try {
                    await smsQueue.add(SMS_JOBS.MEMBERSHIP_OTP, { to, otp });
                } catch (exception) {
                    console.error(`[WhatsAppWorker] SMS fallback enqueue failed: ${exception.message}`);
                }
            }
        }
    },
    { connection: redisConnection }
);

whatsappWorker.on("completed", (job) => {
    console.log(`[WhatsAppWorker] ✅ Done: ${job.name} (id: ${job.id})`);
});

whatsappWorker.on("failed", (job, err) => {
    console.error(`[WhatsAppWorker] ❌ Failed: ${job.name} (id: ${job.id}) — ${err.message}`);
});

export default whatsappWorker;
