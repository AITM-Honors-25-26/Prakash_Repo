import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.config.js";

import emailSvc from "../services/email.service.js";
import { AppConfig } from "../config/constants.js";

export const EMAIL_JOBS = {
    ACTIVATION:      "activation-email",
    FORGOT_PASSWORD: "forgot-password-email",
    STAFF_WELCOME:   "staff-welcome-email",
    MEMBERSHIP_OTP:  "membership-otp-email",
};

const buildEmail = (jobName, data) => {
    switch (jobName) {
        case EMAIL_JOBS.ACTIVATION: {
            const staffIntro = data.isStaff
                ? `An administrator has created a staff account for you at <strong>Melina's Bakery</strong> with the role of <strong>${data.role}</strong>.`
                : `Thank you for registering with <strong>Melina's Bakery</strong>!`;
            const credentialsBlock = data.isStaff
                ? `
                    <p>You can log in with the following credentials after activating your account:</p>
                    <p><strong>Email:</strong> ${data.email}<br/>
                       <strong>Temporary Password:</strong> ${data.tempPassword}</p>
                    <p>Please change your password from your profile settings after your first login.</p>
                `
                : ``;
            return {
                to:      data.email,
                sub:     data.isStaff ? "Your Staff Account Activation" : "Activate Your Account",
                message: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                        <h2>Hi ${data.fullName},</h2>
                        <p>${staffIntro}</p>
                        <p>Please click the button below to activate your account:</p>
                        <a href="${AppConfig.backend_Url}/auth/activate/${data.activationToken}"
                           style="display:inline-block;background:#000;color:#fff;padding:12px 24px;
                                  text-decoration:none;border-radius:4px;margin:16px 0">
                            Activate Account
                        </a>
                        ${credentialsBlock}
                        <p>If you did not create an account, please ignore this email.</p>
                    </div>
                `,
            };
        }

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

        case EMAIL_JOBS.MEMBERSHIP_OTP:
            return {
                to:      data.email,
                sub:     "Your Melina's Bakery Membership Code",
                message: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
                        <h2>Hi ${data.fullName},</h2>
                        <p>Use the one-time code below to verify your membership. It expires in <strong>5 minutes</strong>.</p>
                        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f4f1ea;
                                    padding:16px;text-align:center;border-radius:6px;margin:16px 0">
                            ${data.otp}
                        </div>
                        <p>If you didn't request this code, you can safely ignore this email.</p>
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
        // Changed job.fullName to job.name here
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