const rateLimit = require("express-rate-limit");

/**
 * The maximum number of requests a single IP will be able to make to
 * endpoints protected by the rate limiter 
 */
const maximumAPIRequestsByHourAndByIp = 60;

module.exports = {
	mongoConnectionString: process.env.CONTAINERIZED === "true" ? "mongodb://mongo:27017/" : "mongodb://localhost:27017/",

	rateLimiter: rateLimit({
		windowMs: 1000 * 60 * 60,  // 1 hours time window
		max: maximumAPIRequestsByHourAndByIp
	})
};
