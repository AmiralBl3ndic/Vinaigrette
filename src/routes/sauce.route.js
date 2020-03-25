const router = require("express").Router();

const S3Service = require("../services/s3-service");

/**
 * POST /sauce
 * 
 * Request parameters:
 * type {string (text|image)}: Type of sauce
 * answer {string}: Awaited answer
 * image {file}: File to save
 */
router.post("/", async (req, res) => {
	// TODO: req content check (at least type)
	// TODO: automatic type switching

	if (req.files && req.files.image) {
		try {
			const s3Response = await S3Service.uploadFileToS3(req.files.image);
			return res.status(200).json({
				message: 'File uploaded',
				url: s3Response.fileUrl
			});
		} catch (err) {
			return res.status(400).json({
				message: 'Unable to upload file'
			});
		}
	} else {
		res.status(400).json({
			message: 'No file to upload'
		});
	}
});

module.exports = router;
