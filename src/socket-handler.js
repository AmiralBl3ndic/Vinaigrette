/* eslint-disable no-param-reassign */

const Room = require('./models/room');

/**
 * Handle a client disconnection
 * @param {SocketIO.Socket} socket Socket concerned by the operation
 */
function handleDisconnect (socket) {
	console.info(`Client disconnected (${socket.id})`);
}

/**
 * Handles creation of a room by a client
 * 
 * This will attempt to create a room and join it if succeeds
 * @param {SocketIO.Socket} socket Socket to perform the operation with
 * @param {String} roomName Name of the room to create
 */
function handleCreateRoom (socket, roomName) {
	console.info(`Received request from client ${socket.id} to create room "${roomName}"`);

	if (!Room.isNameAvailable(roomName)) {
		socket.emit('create_room_error');
	}

	const room = new Room(roomName);
	socket.join(room.name);
	room.playersSockets.push(socket);

	// TODO: emit socket event to notify client of room creation success
}

/**
 * Init a socket with custom parameters and bind events to it.
 * @param {SocketIO.Socket} socket Socket to init
 */
function initSocket (socket) {
	socket.score = undefined;
	socket.username = undefined;

	socket.on('disconnect', () => handleDisconnect(socket));
	socket.on('create_room', ({ roomName }) => { handleCreateRoom(socket, roomName); });
}


module.exports = {
	initSocket,
};
