import { Queue } from "bullmq";
import { producerConnection } from "../config/queue.config.js";

const smsQueue = new Queue("sms-queue", {
    connection: producerConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export default smsQueue;
