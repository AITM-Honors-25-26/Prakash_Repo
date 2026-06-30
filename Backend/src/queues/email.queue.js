
import { Queue } from "bullmq";
import { redisConnection } from "../config/queue.config.js";


const emailQueue = new Queue("email-queue", {
    connection: redisConnection,
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

export default emailQueue;
