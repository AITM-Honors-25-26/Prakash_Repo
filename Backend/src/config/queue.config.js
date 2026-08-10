import net from "node:net";

export const redisConnection = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
};

// Bounded connection for queue producers (emailQueue.add / whatsappQueue.add /
// smsQueue.add). When Redis is unavailable these fail fast instead of retrying
// forever. Workers keep using `redisConnection` (BullMQ manages their
// reconnection).
export const producerConnection = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => (times <= 2 ? Math.min(times * 200, 1000) : null),
};

// Fast TCP ping to the Redis port. BullMQ's ioredis client keeps an offline
// command queue that can buffer `queue.add()` for a long time while Redis is
// down, so callers check this BEFORE enqueueing and fall back to a direct
// delivery when Redis is unreachable. Returns true within `timeoutMs` (default
// 800ms) if Redis accepts connections.
export const isRedisReachable = (timeoutMs = 800) =>
    new Promise((resolve) => {
        const socket = new net.Socket();
        let settled = false;
        const done = (ok) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            resolve(ok);
        };
        socket.setTimeout(timeoutMs);
        socket.once("connect", () => done(true));
        socket.once("timeout", () => done(false));
        socket.once("error", () => done(false));
        socket.connect(
            Number(process.env.REDIS_PORT || 6379),
            process.env.REDIS_HOST || "127.0.0.1"
        );
    });