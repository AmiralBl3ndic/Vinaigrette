const Room = require('./models/room');

/**
 * Handler for socket-related actions
 */
class SocketHandler {
	/**
	 * Create a SocketHandler
	 * @param {SocketIO.Socket} socket Client socket
	 */
	constructor (socket) {
		console.info(`Client connected (${socket.id})`);

		this.socket = socket;
		this.id = socket.id;

		this.name = undefined;
		this.score = undefined;
	}

	/**
	 * Binds socket events to actions
	 */
	handle () {
		this.socket.on('disconnect', this.handleDisconnect);
		this.socket.on('create_room', this.handleCreateRoom);
	}

	/**
	 * Handles disconnection of a client
	 */
	handleDisconnect () {
		console.info(`Client disconnected (${this.id})`);
	}

	/**
	 * Handles creation of a room by a client
	 * @param {String} params.roomName Name of the room to create
	 */
	handleCreateRoom ({ roomName }) {
		if (!Room.isNameAvailable(roomName)) {
			this.socket.emit('create_room_error');
		}

		const room = new Room(roomName);
		this.socket.join(room.name);
		room.connectedPlayers.push(this);
	}
}

module.exports = SocketHandler;
