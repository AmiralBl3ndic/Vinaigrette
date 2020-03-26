const aws = require("aws-sdk");

aws.config.update({
	region: process.env.AWS_REGION_CODE,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new aws.S3();

const s3BucketName = process.env.AWS_S3_BUCKET_NAME;

class S3Service {
	static uploadImage(image) {
		return new Promise(async (resolve, reject) => {
			// TODO: type checking for [image] 

			const uploadData = {
				Bucket: s3BucketName,
				Key: Date.now() + image.name,
				Body: image.data
			};

			s3.upload(uploadData, (err, s3Data) => {
				if (err) {
					reject(err);
				} else {
					resolve({
						fileUrl: s3Data.Location
					});
				}
			});
		});
	}
};

module.exports = S3Service;
