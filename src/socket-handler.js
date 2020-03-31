/* eslint-disable no-param-reassign */

const Room = require('./models/room');

/**
 * Handle a client disconnection
 * @param {SocketIO.Socket} socket Socket concerned by the operation
 */
function handleDisconnect (socket) {
	console.info(`[SOCKET] [Socket ${socket.id}] Client disconnected`);
}

/**
 * Handles creation of a room by a client
 * 
 * This will attempt to create a room and join it if succeeds
 * @param {SocketIO.Socket} socket Socket to perform the operation with
 * @param {String} roomName Name of the room to create
 */
function handleCreateRoom (socket, roomName) {
	console.info(`[SOCKET] [Socket ${socket.id}] create_room ("${roomName}")`);

	if (!Room.isNameAvailable(roomName)) {
		socket.emit('create_room_error', { roomName, error: 'Room already exists' });
	}

	const room = new Room(roomName);
	socket.join(room.name);
	room.playersSockets.push(socket);

	socket.emit('create_room_success', { roomName });
}

/**
 * Handles join of a room by a client
 * @param {SocketIO.Socket} socket Socket to perform the operation with
 * @param {String} roomName Name of the room to join
 */
function handleJoinRoom (socket, roomName) {
	console.info(`[SOCKET] [Socket ${socket.id}] join_room ("${roomName}")`);

	const room = Room.findRoom(roomName);

	if (!room) {
		socket.emit('join_room_error', { roomName, error: 'Room not found' });
		return;
	}

	socket.join(room.name);
	socket.score = 0;  // Initialize player score to 0
	room.playersSockets.push(socket);

	socket.emit('join_room_success', { roomName });
}

/**
 * Handles leaving a room by a client
 * 
 * If the room is not joined, nothing will be done
 * @param {SocketIO.Socket} socket Socket to perform the operation on
 * @param {String} roomName Name of the room to leave
 */
function handleLeaveRoom (socket, roomName) {
	console.info(`[SOCKET] [Socket ${socket.id}] leave_room ("${roomName}")`);

	const room = Room.findRoom(roomName);
	
	if (!room) {  // If room does not exist
		socket.emit('leave_room_error', { roomName, error: 'Room not found' });
		return;
	}
	
	// Check if client has joined the room
	if (!room.playersSockets.some((client) => client.id === socket.id)) {
		socket.emit('leave_room_error', { roomName, error: 'Room not joined' });
		return;
	}

	// Actually leave room
	socket.leave(roomName);
	room.playersSockets = room.playersSockets.filter(({ id }) => id !== socket.id);

	socket.emit('leave_room_success', { roomName });

	// Check if room still has players in it (otherwise, delete it)
	if (room.playersSockets.length === 0) {
		Room.rooms = Room.rooms.filter(({ name }) => name !== roomName);
	}
}

/**
 * Init a socket with custom parameters and bind events to it.
 * @param {SocketIO.Socket} socket Socket to init
 */
function initSocket (socket) {
	socket.score = undefined;
	socket.username = undefined;

	socket.on('disconnect', () => handleDisconnect(socket));
	socket.on('create_room', ({ roomName }) => handleCreateRoom(socket, roomName));
	socket.on('join_room', ({ roomName }) => handleJoinRoom(socket, roomName));
	socket.on('leave_room', ({ roomName }) => handleLeaveRoom(socket, roomName));
}

module.exports = {
	initSocket,
};
