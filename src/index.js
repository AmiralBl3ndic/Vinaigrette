require('dotenv').config();

const mongoose = require('mongoose');

const express = require('express');

const app = express();

const socketio = require('socket.io');

const bodyParser = require('body-parser');
const serverConfig = require('./server.config');

const SocketHandler = require('./socket-handler');
const Room = require('./models/room');

/** *******************************************************
 *										MIDDLEWARES
 ******************************************************* */


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


/** *******************************************************
 *							DATABASE & SERVER STARTUP
 ******************************************************* */

console.info('Attempting to connect to MongoDB database...');
mongoose.connect(serverConfig.mongoConnectionString, { 
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverSelectionTimeoutMS: 8 * 1000,  // Attempt to connect for 8 seconds before failure
	user: process.env.MONGO_INITDB_ROOT_USERNAME,
	pass: process.env.MONGO_INITDB_ROOT_PASSWORD,
})
	.then(() => {
		console.info('Connected to MongoDB database.\nStarting server...');

		// Determine port to listen on and start Express app
		const port = process.env.EXPRESS_LISTENING_PORT || 4242;
		const server = app.listen(port, () => console.info(`Vinaigrette server started on port ${port}.`));

		/** *******************************************************
		 *											SOCKETS
		 ******************************************************* */
		const io = socketio.listen(server);
		Room.io = io;

		io.on('connection', (socket) => new SocketHandler(socket).handle());
	})
	.catch((err) => {
		console.error("Can't connect to MongoDB database:", err);
		process.exit(1);
	});
