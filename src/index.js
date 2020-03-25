require("dotenv").config()  // Configure dotenv

const express = require("express");
const app = express();
const http = require("http").Server(app);

/*********************************************************
 *										MIDDLEWARES
 ********************************************************/

app.use(require("cors")());
app.use(require("express-fileupload")());
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
