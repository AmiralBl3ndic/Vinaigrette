require("dotenv").config()  // Configure dotenv

const path = require("path");

const express = require("express");
const router = express.Router();
const app = express();
const http = require("http").Server(app);

const uploadFileToS3 = require("./s3-config");

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
			const s3Response = await uploadFileToS3(req.files.filetoupload);
			return res.status(200).json({
				message: 'File uploaded'
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


const port = process.env.EXPRESS_LISTENING_PORT || 4242;
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
