const rateLimit = require('express-rate-limit');

/**
 * Maximum image size allowed for uploads (in bytes)
 */
const maximumImageSizeAllowed = 15 * 1024 * 1024;  // Default = 15 MB

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

/**
 * Maximum allowed reports before a sauce is getting banned
 */
const maximumReportsBeforeSauceBan = 20;

/**
 * Default score goal for a room
 */
const defaultWinningScore = 100;

/**
 * Number of seconds a game round should last
 */
const gameRoundDurationSeconds = 25;

/**
 * Number of seconds to wait between two rounds
 */
const gameRoundTimeoutDurationSeconds = 4;

/**
 * List of forbidden usernames
 */
const restrictedUsernames = [
	'me',
	'system',
	'root',
	'hitler',  // Because obvious
];

module.exports = {
	mongoConnectionString: process.env.CONTAINERIZED === 'true' ? 'mongodb://mongo:27017/' : 'mongodb://localhost:27017/',

	maximumImageSizeAllowed,

	maximumReportsBeforeSauceBan,

	postRateLimiter: rateLimit({
		windowMs: 1000 * 60 * 60,  // 1 hour time window
		max: maximumAPIPostRequestsByHourAndByIp,
		message: `You have exceeded the maximum number of requests (${maximumAPIPostRequestsByHourAndByIp}) in an hour`,
	}),

	randomRateLimiter: rateLimit({
		windowMs: 1000 * 60 * 60,  // 1 hour time window
		max: maximumAPIRandomGetRequestsByHourAndByIp,
		message: `You have exceeded the maximum number of requests (${maximumAPIRandomGetRequestsByHourAndByIp}) in an hour`,
	}),

	defaultWinningScore,

	gameRoundDurationSeconds,

	gameRoundTimeoutDurationSeconds,

	restrictedUsernames,
};
