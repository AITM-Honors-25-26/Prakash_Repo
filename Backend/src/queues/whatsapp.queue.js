import { Queue } from "bullmq";
import { producerConnection } from "../config/queue.config.js";

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
