require("dotenv").config()  // Configure dotenv

const serverConfig = require("./server.config");

const express = require("express");
const app = express();
const http = require("http").Server(app);

const mongoose = require("mongoose");

/*********************************************************
 *											DATABASE
 ********************************************************/

mongoose.connect(serverConfig.mongoConnectionString, { 
		useNewUrlParser: true,
		user: process.env.MONGO_INITDB_ROOT_USERNAME,
		pass: process.env.MONGO_INITDB_ROOT_PASSWORD
	})
	.then(() => console.log("MongoDB connection succeeded"))
	.catch((err) => console.error("Can't connect to MongoDB container"));

/*********************************************************
 *										MIDDLEWARES
 ********************************************************/

app.use(require("morgan")("dev"));
app.use(require("cors")());
app.use(require("express-fileupload")({
	limits: {
		fileSize: serverConfig.maximumImageSizeAllowed
	},
	abortOnLimit: true
}));
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({ extended: true }));

/*********************************************************
 *											ROUTES
 ********************************************************/

app.use("/", require("./routes/index.route"));
app.use("/sauce", require("./routes/sauce.route"));


const port = process.env.EXPRESS_LISTENING_PORT || 4242;
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
