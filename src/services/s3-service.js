const aws = require("aws-sdk");
const { promisify } = require("util");
const Minio = require("minio");
const errorCodes = require("../error-codes");

const ImageService = require("./image-service");

const s3 = new aws.S3({
  accessKeyId: process.env.MINIO_ACCESS_KEY,
  secretAccessKey: process.env.MINIO_SECRET_KEY,
  endpoint: "http://minio:9000",
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const minioClient = new Minio.Client({
  endPoint: "vinaigrette-s3",
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const s3BucketName = process.env.S3_BUCKET_NAME;

const s3Policy = {
  Version: "2012-10-17",
  Id: "public-read-only-policy",
  Statement: [
    {
      Action: ["s3:GetObject"],
      Effect: "Allow",
      Principal: {
        AWS: ["*"],
      },
      Resource: [`arn:aws:s3:::${s3BucketName}/*`],
    },
  ],
};

const allowedMimeTypes = ["image/jpeg", "image/png"];

/**
 * Wrapper class for Amazon Web Services Simple Storage Service (AWS S3) related actions
 */
class S3Service {
  static async initialize() {
    return new Promise((resolve, reject) => {
      console.log("Checking if bucket exists");
      minioClient.bucketExists(s3BucketName, (err, exists) => {
        if (err) return reject(err);
        if (exists) return resolve();

        console.log("[Minio] Creating bucket " + s3BucketName + "...");

        minioClient.makeBucket(s3BucketName, "us-east-1", (err) => {
          if (err) reject(err);

          minioClient.setBucketPolicy(
            s3BucketName,
            JSON.stringify(s3Policy),
            (err) => {
              if (err) reject(err);

              resolve();
            }
          );
        });
      });
    });
  }

  /**
   * Upload an image to the configured S3 bucket.
   *
   * The image will be converted to JPEG and compressed to optimize storage space.
   *
   * @param {Object} image Image to upload to S3
   */
  static async uploadImage(image) {
    return new Promise(async (resolve, reject) => {
      // Check if MIME type of file is supported
      if (
        image.mimetype === undefined ||
        !allowedMimeTypes.includes(image.mimetype)
      ) {
        return reject({
          errorCode:
            image.mimetype === undefined
              ? errorCodes.E_BAD_ARGUMENT
              : errorCodes.E_UNSUPPORTED_TYPE,
          error: "Missing attribute or wrong value",
          message:
            '"mimetype" attribute of parameter must be set to a valid image format (JPEG or PNG)',
        });
      }

      // Check if the bytes buffer of the image is not empty
      if (image.data === undefined || !image.data.length) {
        return reject({
          errorCode:
            image.data === undefined
              ? errorCodes.E_BAD_ARGUMENT
              : errorCodes.E_WRONG_VALUE,
          error: "Missing attribute or wrong value",
          message: '"data" attribute of parameter should be a non-empty buffer',
        });
      }

      // Prepare data: rename image (with date addition to avoid collision), convert it to JPEG and compress it
      const uploadData = {
        Bucket: s3BucketName,
        Key: Date.now() + image.name.replace(".png", ".jpg"),
        Body: await ImageService.convertToJPEG(image.data),
      };

      return s3.upload(uploadData, (err, s3Data) => {
        if (err) {
          // If an error occurs while uploading the file to the S3 bucket
          return reject({
            ...err,
            errorCode: errorCodes.E_AWS_S3_ERROR,
          });
        }

        return resolve({
          // Success, gather the URL of the newly uploaded image
          fileUrl: `${process.env.S3_PUBLIC_URL}/${s3BucketName}/${s3Data.Key}`,
        });
      });
    });
  }

  /**
   * Delete an image from a public S3 Bucket given its URL
   * @param {String} imageUrl URL to access the image
   */
  static async deleteImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const urlParts = imageUrl.split("/");
      const objectKey = urlParts[urlParts.length - 1];

      s3.deleteObject(
        {
          Bucket: s3BucketName,
          Key: objectKey,
        },
        (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        }
      );
    });
  }
}

module.exports = S3Service;
