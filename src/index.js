require('dotenv').config();

const express = require('express');

const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const serverConfig = require('./server.config');


/** *******************************************************
 *											DATABASE
 ******************************************************* */

mongoose.connect(serverConfig.mongoConnectionString, { 
	useNewUrlParser: true,
	user: process.env.MONGO_INITDB_ROOT_USERNAME,
	pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
})
	.then(() => console.info('MongoDB connection succeeded'))
	.catch(() => console.error("Can't connect to MongoDB container"));

/** *******************************************************
 *										MIDDLEWARES
 ******************************************************* */

const app = express();

app.use(require('morgan')('dev'));
app.use(require('cors')());
app.use(require('express-fileupload')({
	limits: {
		fileSize: serverConfig.maximumImageSizeAllowed,
	},
	abortOnLimit: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/** *******************************************************
 *											ROUTES
 ******************************************************* */

app.use('/', require('./routes/index.route'));
app.use('/sauce', require('./routes/sauce.route'));


const port = process.env.EXPRESS_LISTENING_PORT || 4242;
app.listen(port, () => {
	console.info(`Listening on port ${port}`);
});
