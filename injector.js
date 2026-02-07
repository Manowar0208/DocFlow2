// injector.js
const Redis = require('ioredis');

// Connect to Redis (Standard Port 6379)
// ioredis connects automatically. No "await connect" needed!
const redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryStrategy: times => Math.min(times * 50, 2000) // Keep trying if it fails
});

redis.on('connect', () => console.log('[REDIS] Connected! 🟢'));
redis.on('error', (err) => console.log('[REDIS ERROR] 🔴', err.message));

module.exports = {
    pushToQueue: async function(queueName, data) {
        try {
            // Redis needs a string, not an object
            const stringData = JSON.stringify(data);
            
            // "lpush" adds to the list
            await redis.lpush(`queue:${queueName}`, stringData);
            
            console.log(`[INJECTOR] 🚀 Pushed to ${queueName}`);
        } catch (error) {
            console.error(`[INJECTOR ERROR]`, error);
        }
    }
};