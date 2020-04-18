/* eslint-disable no-param-reassign */

const socketEvents = require('./socket-event-names');

const Room = require('./models/room');

/**
 * Send the list of rooms to user
 * @param {SocketIO.Socket} socket Socket to use
 */
function sendRoomsList (socket) {
	const roomNames = Room.rooms.map((room) => room.name);

	if (socket) {
		socket.emit(socketEvents.responses.ROOMS_LIST_UPDATE, { roomNames });
	} else {
		Room.io.emit(socketEvents.responses.ROOMS_LIST_UPDATE, { roomNames });
	}
}

/**
 * Handle a client disconnection
 * @param {SocketIO.Socket} socket Socket concerned by the operation
 */
function handleDisconnect (socket) {
	console.info(`[SOCKET] [Socket ${socket.id}] Client disconnected`);
}

/**
 * Sets the username for a given socket
 * @param {SocketIO.Socket} socket Socket to perform the actions on
 * @param {String} username Name to set
 */
function handleSetUsername (socket, username) {
	console.info(`[SOCKET] [Socket ${socket.id}] set_username ("${username}")`);

	socket.username = username;
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

	// Check that user has set its username
	if (!socket.username) {
		socket.emit(socketEvents.responses.CREATE_ROOM_ERROR, { roomName, error: 'You must have a username to create a room' });
		return;
	}

	if (!Room.isNameAvailable(roomName)) {
		socket.emit(socketEvents.responses.CREATE_ROOM_ERROR, { roomName, error: 'Room already exists' });
		return;
	}

	const room = new Room(roomName);
	socket.join(room.name);
	socket.score = 0;  // Initialize player score to 0
	socket.found = false;  // Initialize player found status to false (not found)
	room.playersSockets.push(socket);

	const scoreboard = room.getScoreboard();

	socket.emit(socketEvents.responses.CREATE_ROOM_SUCCESS, { roomName });
	socket.emit(socketEvents.responses.SCOREBOARD_UPDATE, { scoreboard });

	sendRoomsList();
}

/**
 * Handles join of a room by a client
 * @param {SocketIO.Socket} socket Socket to perform the operation with
 * @param {String} roomName Name of the room to join
 */
function handleJoinRoom (socket, roomName) {
	console.info(`[SOCKET] [Socket ${socket.id}] join_room ("${roomName}")`);

	// Check that user has set its username
	if (!socket.username) {
		socket.emit(socketEvents.responses.JOIN_ROOM_ERROR, { roomName, error: 'You must have a username to join a room' });
		return;
	}

	const room = Room.findRoom(roomName);

	if (!room) {
		socket.emit(socketEvents.responses.JOIN_ROOM_ERROR, { roomName, error: 'Room not found' });
		return;
	}

	socket.join(room.name);
	socket.score = 0;  // Initialize player score to 0
	socket.found = false;  // Initialize player found status to false (not found)
	room.playersSockets.push(socket);

	const scoreboard = room.getScoreboard();

	socket.emit(socketEvents.responses.JOIN_ROOM_SUCCESS, { roomName });
	socket.emit(socketEvents.responses.SCOREBOARD_UPDATE, { scoreboard });
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
		socket.emit(socketEvents.responses.LEAVE_ROOM_ERROR, { roomName, error: 'Room not found' });
		return;
	}
	
	// Check if client has joined the room
	if (!room.playersSockets.some((client) => client.id === socket.id)) {
		socket.emit(socketEvents.responses.LEAVE_ROOM_ERROR, { roomName, error: 'Room not joined' });
		return;
	}

	// Actually leave room
	socket.leave(roomName);
	room.playersSockets = room.playersSockets.filter(({ id }) => id !== socket.id);

	socket.emit(socketEvents.responses.LEAVE_ROOM_SUCCESS, { roomName });

	// Check if room still has players in it (otherwise, delete it)
	if (room.playersSockets.length === 0) {
		Room.rooms = Room.rooms.filter(({ name }) => name !== roomName);
		sendRoomsList();
	}
}

/**
 * Handle starting a game in given room
 * @param {SocketIO.Socket} socket 
 * @param {String} roomName 
 */
function handleStartGame (socket, roomName) {
	console.info(`[SOCKET] [Socket ${socket.id}] start_game ("${roomName}")`);

	// Check that user has set its username
	if (!socket.username) {
		socket.emit(socketEvents.responses.START_GAME_ERROR, { roomName, error: 'You must have a username to start a game' });
		return;
	}

	const room = Room.findRoom(roomName);

	// Check if room exists
	if (!room) {
		socket.emit(socketEvents.responses.START_GAME_ERROR, { roomName, error: 'Room not found' });
		return;
	}
	
	// Check if client has joined the room
	if (!room.playersSockets.some((client) => client.id === socket.id)) {
		socket.emit(socketEvents.responses.START_GAME_ERROR, { roomName, error: 'Room not joined' });
		return;
	}

	// Check if a game has already started in room
	if (room.started) {
		socket.emit(socketEvents.responses.START_GAME_ERROR, { roomName, error: 'A game already started in that room' });
		return;
	}

	// Start the game in the room
	socket.emit(socketEvents.responses.START_GAME_SUCCESS, { roomName });
	room.start();
}

/**
 * Init a socket with custom parameters and bind events to it.
 * @param {SocketIO.Socket} socket Socket to init
 */
function initSocket (socket) {
	socket.score = undefined;
	socket.username = undefined;

	sendRoomsList(socket);

	socket.on('disconnect', () => handleDisconnect(socket));
	socket.on(socketEvents.requests.SET_USERNAME, ({ username }) => handleSetUsername(socket, username));
	socket.on(socketEvents.requests.CREATE_ROOM, ({ roomName }) => handleCreateRoom(socket, roomName));
	socket.on(socketEvents.requests.JOIN_ROOM, ({ roomName }) => handleJoinRoom(socket, roomName));
	socket.on(socketEvents.requests.LEAVE_ROOM, ({ roomName }) => handleLeaveRoom(socket, roomName));
	socket.on(socketEvents.requests.START_GAME, ({ roomName }) => handleStartGame(socket, roomName));
}

module.exports = {
	initSocket,
};
