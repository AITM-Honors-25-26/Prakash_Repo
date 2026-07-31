import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.config.js";

import emailSvc from "../services/email.service.js";
import { AppConfig } from "../config/constants.js";

export const EMAIL_JOBS = {
    ACTIVATION:      "activation-email",
    FORGOT_PASSWORD: "forgot-password-email",
    STAFF_WELCOME:   "staff-welcome-email",
};

const buildEmail = (jobName, data) => {
    switch (jobName) {

        case EMAIL_JOBS.ACTIVATION:
            console.log("i am here")
            return {
                to:      data.email,
                sub:     "Activate Your Account",
                message: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                        <h2>Hi ${data.fullName},</h2>
                        <p>Thank you for registering with <strong>Melina's Bakery</strong>!</p>
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
                sub:     "Reset Your Password",
                message: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                        <h2>Hi ${data.fullName},</h2>
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

        case EMAIL_JOBS.STAFF_WELCOME:
            return {
                to:      data.email,
                sub:     "Your Staff Account Has Been Created",
                message: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                        <h2>Hi ${data.fullName},</h2>
                        <p>An administrator has created a staff account for you at <strong>Melina's Bakery</strong> with the role of <strong>${data.role}</strong>.</p>
                        <p>You can log in using:</p>
                        <p><strong>Email:</strong> ${data.email}<br/>
                           <strong>Temporary Password:</strong> ${data.tempPassword}</p>
                        <p>Please log in and change your password from your profile settings as soon as possible.</p>
                    </div>
                `,
            };

        default:
            throw new Error(`Unknown email job type: ${jobName}`);
    }
};

const emailWorker = new Worker(
    "email-queue",
    async (job) => {
        console.log(`[EmailWorker] Processing: ${job.fullName}`, job.data);
        const payload = buildEmail(job.fullName, job.data);
        await emailSvc.sendEmail(payload);
        console.log(`[EmailWorker] ✅ Sent: ${job.fullName} → ${job.data.email}`);
    },
    { connection: redisConnection }
);

emailWorker.on("completed", (job) => {
    console.log(`[EmailWorker] ✅ Done: ${job.fullName} (id: ${job.id})`);
});

emailWorker.on("failed", (job, err) => {
    console.error(`[EmailWorker] ❌ Failed: ${job.fullName} (id: ${job.id}) — ${err.message}`);
});

export default emailWorker;