const aws = require("aws-sdk");
const errorCodes = require("../error-codes");

aws.config.update({
	region: process.env.AWS_REGION_CODE,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new aws.S3();

const s3BucketName = process.env.AWS_S3_BUCKET_NAME;

const allowedMimeTypes = [
	"image/jpeg",
	"image/png"
];

class S3Service {
	static uploadImage(image) {
		return new Promise(async (resolve, reject) => {
			if (image.mimetype === undefined || !allowedMimeTypes.includes(image.mimetype)) {
				return reject({
					errorCode: image.mimetype === undefined ? errorCodes.E_BAD_ARGUMENT : errorCodes.E_UNSUPPORTED_TYPE,
					error: "Missing attribute or wrong value",
					message: "\"mimetype\" attribute of parameter must be set to a valid image format (JPEG or PNG)"
				});
			}

			if (image.data === undefined || !image.data.length) {
				return reject({
					errorCode: image.data === undefined ? errorCodes.E_BAD_ARGUMENT : errorCodes.E_WRONG_VALUE,
					error: "Missing attribute or wrong value",
					message: "\"data\" attribute of parameter should be a non-empty buffer"
				});
			}

			const uploadData = {
				Bucket: s3BucketName,
				Key: Date.now() + image.name,
				Body: image.data
			};

			s3.upload(uploadData, (err, s3Data) => {
				if (err) {
					return reject({
						...err,
						errorCode: errorCodes.E_AWS_S3_ERROR
					});
				} else {
					return resolve({
						fileUrl: s3Data.Location
					});
				}
			});
		});
	}
};

module.exports = S3Service;
