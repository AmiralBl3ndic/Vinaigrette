const router = require("express").Router();

const S3Service = require("../services/s3-service");

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

router.get("/", describe);
router.post("/", describe);

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

	return res.status(500).json({
		message: "This endpoint has not been implemented yet"
	});

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

	if (req.body.answer === undefined || req.body.answer === "") {  // If no answer or empty answer
		return res.status(400).json({
			message: "Empty or missing \"answer\" field"
		});
	}

	let s3Response;

	// Attempt to store the image in the S3 Bucket
	try {
		s3Response = await S3Service.uploadImage(req.files.image);
	} catch (err) {
		return res.status(400).json({
			message: 'Unable to upload file'
		});
	}

	// TODO: store image url and answer in database record with service

	return res.status(500).json({
		message: "This endpoint has not been implemented yet"
	});

	return res.status(201).json({
		message: "Sauce created",
		url: s3Response.fileUrl
	});
});

module.exports = router;
