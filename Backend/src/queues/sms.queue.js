import { Queue } from "bullmq";
import { producerConnection } from "../config/queue.config.js";

// Same pattern as the email queue: delivery is async and retried by BullMQ so
// the OTP request response never waits on the SMS gateway.
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
