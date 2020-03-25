require("dotenv").config()  // Configure dotenv

const path = require("path");

const aws = require("aws-sdk");
aws.config.update({ 
	region: process.env.AWS_REGION_CODE,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const s3 = new aws.S3();

const express = require("express");
const router = express.Router();
const app = express();
const http = require("http").Server(app);

app.use(require("cors")());
app.use(require("express-fileupload")());
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.status(200).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.post("/", async (req, res) => {
	if (req.files && req.files.filetoupload) {
		try {
			const file = req.files.filetoupload;

			const s3UploadConfig = {
				Bucket: process.env.AWS_S3_BUCKET_NAME,
				Key: file.name,
				Body: file.data
			};

			s3.upload(s3UploadConfig, (err, data) => {
				if (err) return console.error(err);

				console.log("S3 Data:", data);
			});
		} catch (err) {
			console.error(err)
			return res.status(400).json({
				message: 'Unable to upload file'
			});
		}

		return res.status(200).json({
			message: 'Uploading file'
		});
	} else {
		res.status(400).json({
			message: 'No file to upload'
		});
	}
});


app.listen(process.env.EXPRESS_LISTENING_PORT, () => {
	console.log(`Listening on port ${process.env.EXPRESS_LISTENING_PORT}`);
});
