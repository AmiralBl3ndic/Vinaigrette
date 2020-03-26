const rateLimit = require("express-rate-limit");

/**
 * The maximum number of POST requests a single IP will be able to make to
 * endpoints protected by the rate limiter 
 */
const maximumAPIPostRequestsByHourAndByIp = 60;  // Default = 60/hour (1/min)

/**
 * The maximum number of GET requests a single IP will be able to make to
 * random endpoints protected by the rate limiter
 */
const maximumAPIRandomGetRequestsByHourAndByIp = 3600;  // Default = 3600/hour (1/s)

module.exports = {
	mongoConnectionString: process.env.CONTAINERIZED === "true" ? "mongodb://mongo:27017/" : "mongodb://localhost:27017/",

	postRateLimiter: rateLimit({
		windowMs: 1000 * 60 * 60,  // 1 hour time window
		max: maximumAPIPostRequestsByHourAndByIp,
		message: `You have exceeded the maximum number of requests (${maximumAPIPostRequestsByHourAndByIp}) in an hour`
	}),

	randomRateLimiter: rateLimit({
		windowMs: 1000 * 60 * 60,  // 1 hour time window
		max: maximumAPIRandomGetRequestsByHourAndByIp,
		message: `You have exceeded the maximum number of requests (${maximumAPIRandomGetRequestsByHourAndByIp}) in an hour`
	})
};
