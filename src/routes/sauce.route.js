const router = require("express").Router();

const errorCodes = require("../error-codes");

const S3Service = require("../services/s3-service");
const MongoDBService = require("../services/mongodb-service");

/**
 * Describes the route endpoints
 * @param {*} req Incoming request
 * @param {*} res Outgoing response
 */
function describe (req, res) {
	return res.status(404).json({
		description: "To add a new quote sauce: POST /sauce/quote\nTo add a new image sauce: POST /sauce/image"
	});
}

/**
 * ? GET /sauce
 * 
 * Describes the sub endpoints of the /sauce route
 */
router.get("/", describe);

/**
 * ? POST /sauce
 * 
 * Describes the sub endpoints of the /sauce route
 */
router.post("/", describe);

/**
 * ? GET /sauce/random
 * 
 * Returns a random `QuoteSauce` or `ImageSauce` with specified type
 */
router.get("/random", async (req, res) => {
	return res.status(500).json({ message: "Endpoint not implemented yet" });
});

/**
 * ? POST /sauce/quote
 * 
 * Registers a new `QuoteSauce` and saves it to the database
 * 
 * @param {String} req.body.quote Quote to save
 * @param {String} req.body.answer Answer for this sauce
 */
router.post("/quote", async (req, res) => {
	if (req.body.quote === undefined || req.body.quote === "") {  // If no quote or empty quote
		return res.status(400).json({
			message: "Empty or missing \"quote\" field"
		});
	}

	if (req.body.answer === undefined || req.body.answer === "") {  // If no answer or empty answer
		return res.status(400).json({
			message: "Empty or missing \"answer\" field"
		});
	}

	try {
		// Gather and save quote to database
		const quote = MongoDBService.getQuoteSauceFromRequest(req);
		quote.save();

		return res.status(201).json({
			message: "Quote record saved"
		});
	} catch (err) {
		if (err.errorCode === errorCodes.E_BAD_ARGUMENT) {
			return res.status(400).json(err);
		} else {
			return res.status(500).json({
				message: "An error occured, unable to save quote"
			});
		}
	}
});

/**
 * ? POST /sauce/image
 * 
 * Registers a new `ImageSauce` and saves it to the database
 * 
 * @param {Object} req.files.image Image to save
 * @param {String} req.files.image.mimetype MIME type of the uploaded file (should be "image/jpeg" or "image/png")
 * @param {String} req.files.image.name Name of the image
 * @param {Buffer} req.files.image.data Non-empty buffer of bytes representing the image
 * @param {String} req.body.answer Answer for this sauce
 */
router.post("/image", async (req, res) => {
	if (req.files === undefined || req.files.image === undefined) {  // Image type request, no images passed in
		return res.status(400).json({
			message: "Empty or missing \"image\" field"
		});
	}

	if (req.body.answer === undefined || req.body.answer === "") {  // If no answer or empty answer
		return res.status(400).json({
			message: "Empty or missing \"answer\" field"
		});
	}

	// Attempt to store the image in the S3 Bucket
	try {
		// Upload image to online storage, gather its url and save new sauce to database
		const imageSauce = await MongoDBService.getImageSauceFromRequest(req);
		imageSauce.save();

		return res.status(201).json({
			message: "Image sauce saved"
		});
	} catch (err) {
		return res.status(400).json({
			errorCode: err.errorCode,
			message: 'Unable to upload file',
		});
	}
});

module.exports = router;
