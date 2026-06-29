// src/queues/email.queue.js

import { Queue } from "bullmq";
import { redisConnection } from "../config/queue.config.js";

const emailQueue = new Queue("email-queue", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,        // retries at 3s → 6s → 12s
        },
        removeOnComplete: true,
        removeOnFail: false,    // keep failed jobs visible for debugging
    },
});

export default emailQueue;
