const mongoose = require("mongoose");

const { formatAnswer } = require("../utils");

const errorCodes = require("../error-codes");

const S3Service = require("./s3-service");

const QuoteSauce = require("../models/quote-sauce");
const ImageSauce = require("../models/image-sauce");

/**
 * Wrapper around MongoDB-related actions
 */
class MongoDBService {
	/**
	 * Get a `QuoteSauce` from an incoming `express.Request`
	 * @param {express.Request} req Incoming request
	 * @throws An error when `req.body`, `req.body.quote` or `req.body.answer` have falsy value 
	 */
	static getQuoteSauceFromRequest (req) {
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

	/**
	 * Get an `ImageSauce` from an incoming `express.Request`
	 * 
	 * This function attempts to store the image contained in the request into the configured S3 bucket,
	 * but will throw an error if unable to get a HTTP link to the image.
	 * @param {express.Request} req Incoming
	 */
	static async getImageSauceFromRequest (req) {
		if (!req.body || !req.body.answer || !req.files || !req.files.image) {
			throw new Error({
				errorCode: errorCodes.E_BAD_ARGUMENT,
				message: "Request is missing required data"
			});
		}

		// Upload image to S3 bucket and gather the public URL of the image
		const { fileUrl } = await S3Service.uploadImage(req.files.image);

		// Convert answer to a usable format
		const answer = formatAnswer(req.body.answer);

		return new ImageSauce({
			answer,
			_id: new mongoose.Types.ObjectId(),
			imageUrl: fileUrl
		});
	}
};

module.exports = MongoDBService;
