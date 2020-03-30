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

		this.score = undefined;
	}

	/**
	 * Binds socket events to actions
	 */
	handle () {
		// Bind socket events to SocketHandler actions
		this.socket.on('disconnect', this.handleDisconnect);
	}

	/**
	 * Handes disconnection of a client
	 */
	handleDisconnect () {
		console.info(`Client disconnected (${this.id})`);
	}
}

module.exports = SocketHandler;
