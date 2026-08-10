import { Queue } from "bullmq";
import { producerConnection } from "../config/queue.config.js";

// Same pattern as the email/sms queues: delivery is async and retried by
// BullMQ so the OTP request response never waits on the WhatsApp gateway.
const whatsappQueue = new Queue("whatsapp-queue", {
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

export default whatsappQueue;
