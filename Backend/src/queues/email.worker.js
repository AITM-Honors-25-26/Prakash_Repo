// src/queues/email.worker.js

import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.config.js";
import emailSvc from "../services/email.service.js";
import { AppConfig } from "../config/constants.js";

// ── Job name constants ─────────────────────────────────────
export const EMAIL_JOBS = {
    ACTIVATION:      "activation-email",
    FORGOT_PASSWORD: "forgot-password-email",
};

// ── Email templates ────────────────────────────────────────
const buildEmail = (jobName, data) => {
    switch (jobName) {

        case EMAIL_JOBS.ACTIVATION:
            return {
                to:      data.email,
                sub:     "Activate Your Nebuds Bliss Account",
                message: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                        <h2>Hi ${data.name},</h2>
                        <p>Thank you for registering with <strong>Nebuds Bliss</strong>!</p>
                        <p>Please click the button below to activate your account:</p>
                        <a href="${AppConfig.backend_Url}/auth/activate/${data.activationToken}"
                           style="display:inline-block;background:#000;color:#fff;padding:12px 24px;
                                  text-decoration:none;border-radius:4px;margin:16px 0">
                            Activate Account
                        </a>
                        <p>If you did not create an account, please ignore this email.</p>
                    </div>
                `,
            };

        case EMAIL_JOBS.FORGOT_PASSWORD:
            return {
                to:      data.email,
                sub:     "Reset Your Nebuds Bliss Password",
                message: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                        <h2>Hi ${data.name},</h2>
                        <p>We received a request to reset your password.</p>
                        <p>Click the button below to reset it. This link expires in <strong>1 hour</strong>.</p>
                        <a href="${AppConfig.backend_Url}/auth/forgot-password/${data.resetToken}"
                           style="display:inline-block;background:#000;color:#fff;padding:12px 24px;
                                  text-decoration:none;border-radius:4px;margin:16px 0">
                            Reset Password
                        </a>
                        <p>If you didn't request this, you can safely ignore this email.</p>
                    </div>
                `,
            };

        default:
            throw new Error(`Unknown email job type: ${jobName}`);
    }
};

// ── Worker ─────────────────────────────────────────────────
const emailWorker = new Worker(
    "email-queue",
    async (job) => {
        console.log(`[EmailWorker] Processing: ${job.name}`, job.data);
        const payload = buildEmail(job.name, job.data);
        await emailSvc.sendEmail(payload);
        console.log(`[EmailWorker] ✅ Sent: ${job.name} → ${job.data.email}`);
    },
    { connection: redisConnection }
);

emailWorker.on("completed", (job) => {
    console.log(`[EmailWorker] ✅ Done: ${job.name} (id: ${job.id})`);
});

emailWorker.on("failed", (job, err) => {
    console.error(`[EmailWorker] ❌ Failed: ${job.name} (id: ${job.id}) — ${err.message}`);
});

export default emailWorker;
