const router = require("express").Router();

const ow = require("ow");

const S3Service = require("../services/s3-service");

/**
 * POST /sauce/quote
 * 
 * Request parameters:
 * quote {string}: Quote to save
 * answer {string}: Answer for this sauce
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

	// TODO: store quote and answer in database record with service
});

/**
 * POST /sauce/image
 * 
 * Request parameters:
 * image {file}: File to save
 * answer {string}: Awaited answer
 */
router.post("/image", async (req, res) => {

	if (req.files === undefined || req.files.image === undefined) {  // Image type request, no images passed in
		return res.status(400).json({
			message: "Empty or missing \"image\" field"
		});
	}

	try {
		const s3Response = await S3Service.uploadFileToS3(req.files.image);
		return res.status(200).json({
			message: 'File uploaded',
			url: s3Response.fileUrl
		});

		// TODO: store image url and answer in database record with service
	} catch (err) {
		return res.status(400).json({
			message: 'Unable to upload file'
		});
	}
});

module.exports = router;
