const router = require('express').Router();

const { postRateLimiter, randomRateLimiter } = require('../server.config');

const errorCodes = require('../error-codes');

const MongoDBService = require('../services/mongodb-service');

/**
 * ? GET /sauce/random
 * 
 * Returns a random `QuoteSauce` or `ImageSauce` with specified type
 */
router.get('/random', randomRateLimiter, async (req, res) => {
	// Determine if getting an ImageSauce or a QuoteSauce (50% odds)
	if (Math.random() >= 0.5) {
		// Getting an ImageSauce

		let sauce = await MongoDBService.getRandomImageSauce();

		if (sauce == null) {  // If no ImageSauce found, try to get a random QuoteSauce
			sauce = await MongoDBService.getRandomQuoteSauce();

			if (sauce == null) {  // If no QuoteSauce found either
				return res.status(404).json({
					errorCode: errorCodes.E_NO_DATA,
					message: 'Unable to retrieve any sauce',
				});
			}

			return res.status(200).json({
				type: 'quote',
				quote: sauce.quote,
				answer: sauce.answer,
			});
		}

		return res.status(200).json({
			type: 'image',
			imageUrl: sauce.imageUrl,
			answer: sauce.answer,
		});
	} 
	// Getting a QuoteSauce

	let sauce = await MongoDBService.getRandomQuoteSauce();

	if (sauce == null) {  // If no QuoteSauce found, try to get a random ImageSauce
		sauce = await MongoDBService.getRandomImageSauce();

		if (sauce == null) {
			return res.status(404).json({
				errorCode: errorCodes.E_NO_DATA,
				message: 'Unable to retrieve any sauce',
			});
		}

		return res.status(200).json({
			type: 'image',
			imageUrl: sauce.imageUrl,
			answer: sauce.answer,
		});
	}

	return res.status(200).json({
		type: 'quote',
		quote: sauce.quote,
		answer: sauce.answer,
	});
});

/**
 * ? GET /sauce/random/quote
 * 
 * Returns a random `QuoteSauce` from the database
 */
router.get('/random/quote', randomRateLimiter, async (req, res) => {
	const sauce = await MongoDBService.getRandomQuoteSauce();

	if (sauce == null) {  // If no QuoteSauce found
		return res.status(404).json({
			errorCode: errorCodes.E_NO_DATA,
			message: 'Unable to retrieve any quote sauce',
		});
	}

	return res.status(200).json({
		quote: sauce.quote,
		answer: sauce.answer,
	});
});

/**
 * ? GET /sauce/random/image
 * 
 * Returns a random `ImageSauce` from the database
 */
router.get('/random/image', randomRateLimiter, async (req, res) => {
	const sauce = await MongoDBService.getRandomImageSauce();

	if (sauce == null) {  // If no ImageSauce found
		return res.status(404).json({
			errorCode: errorCodes.E_NO_DATA,
			message: 'Unable to retrieve any image sauce',
		});
	}

	return res.status(200).json({
		imageUrl: sauce.imageUrl,
		answer: sauce.answer,
	});
});

/**
 * ? POST /sauce/quote
 * 
 * Registers a new `QuoteSauce` and saves it to the database
 * 
 * @param {String} req.body.quote Quote to save
 * @param {String} req.body.answer Answer for this sauce
 */
router.post('/quote', postRateLimiter, async (req, res) => {
	if (req.body.quote === undefined || req.body.quote === '') {  // If no quote or empty quote
		return res.status(400).json({
			message: 'Empty or missing "quote" field',
		});
	}

	if (req.body.answer === undefined || req.body.answer === '') {  // If no answer or empty answer
		return res.status(400).json({
			message: 'Empty or missing "answer" field',
		});
	}

	try {
		// Gather and save quote to database
		const quote = MongoDBService.getQuoteSauceFromRequest(req);
		quote.save();

		return res.status(201).json({
			message: 'Quote record saved',
		});
	} catch (err) {
		if (err.errorCode === errorCodes.E_BAD_ARGUMENT) {
			return res.status(400).json(err);
		} 
		return res.status(500).json({
			message: 'An error occured, unable to save quote',
		});
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
router.post('/image', postRateLimiter, async (req, res) => {
	if (req.files === undefined || req.files.image === undefined) {  // Image type request, no images passed in
		return res.status(400).json({
			message: 'Empty or missing "image" field',
		});
	}

	if (req.body.answer === undefined || req.body.answer === '') {  // If no answer or empty answer
		return res.status(400).json({
			message: 'Empty or missing "answer" field',
		});
	}

	// Attempt to store the image in the S3 Bucket
	try {
		// Upload image to online storage, gather its url and save new sauce to database
		const imageSauce = await MongoDBService.getImageSauceFromRequest(req);
		imageSauce.save();

		return res.status(201).json({
			message: 'Image sauce saved',
		});
	} catch (err) {
		return res.status(400).json({
			errorCode: err.errorCode,
			message: 'Unable to upload file',
		});
	}
});

module.exports = router;
