import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.config.js";

import smsSvc from "../services/sms.service.js";

export const SMS_JOBS = {
    MEMBERSHIP_OTP: "membership-otp-sms",
};

export const buildSms = (jobName, data) => {
    switch (jobName) {
        case SMS_JOBS.MEMBERSHIP_OTP:
            return {
                to: data.to,
                message: `Melina's Bakery: Your membership verification code is ${data.otp}. Valid for 5 minutes. Do not share it.`,
            };

        default:
            throw new Error(`Unknown SMS job type: ${jobName}`);
    }
};

const smsWorker = new Worker(
    "sms-queue",
    async (job) => {
        console.log(`[SmsWorker] Processing: ${job.name}`, job.data);
        const payload = buildSms(job.name, job.data);
        const result = await smsSvc.sendSms(payload);
        console.log(`[SmsWorker] ✅ Sent: ${job.name} → ${payload.to} (delivered: ${result.delivered})`);
    },
    { connection: redisConnection }
);

smsWorker.on("completed", (job) => {
    console.log(`[SmsWorker] ✅ Done: ${job.name} (id: ${job.id})`);
});

smsWorker.on("failed", (job, err) => {
    console.error(`[SmsWorker] ❌ Failed: ${job.name} (id: ${job.id}) — ${err.message}`);
});

export default smsWorker;
