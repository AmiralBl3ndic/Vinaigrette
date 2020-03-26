const mongoose = require("mongoose");

const { formatAnswer } = require("../utils");

const errorCodes = require("../error-codes");

const QuoteSauce = require("../models/quote-sauce");
const ImageSauce = require("../models/image-sauce");

/**
 * Wrapper around MongoDB-related actions
 */
class MongoDBService {
	/**
	 * Get a `QuoteSauce` from an incoming `express.Request`
	 * @param {express.Request} Incoming request
	 * @throws An error when `req.body`, `req.body.quote` or `req.body.answer` have falsy value 
	 */
	static getQuoteSauceFromRequest(req) {
		if (!req.body || !req.body.quote || !req.body.answer) {
			throw new Error({
				errorCode: errorCodes.E_BAD_ARGUMENT,
				message: "Request is missing required data"
			});
		}

		// Convert answer to a usable format
		const answer = formatAnswer(req.body.answer);

		return new QuoteSauce({
			answer,
			_id: new mongoose.Types.ObjectId(),
			quote: req.body.quote
		});
	}
};

module.exports = MongoDBService;
