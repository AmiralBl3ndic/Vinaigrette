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
		this.emit = this.socket.emit;  // Shorthand
		this.on = this.socket.on;  // Shorthand
		this.join = this.socket.join;  // Shorthand

		this.score = undefined;

		// Bind socket events to SocketHandler actions
		this.on('disconnect', this.handleDisconnect);
	}

	/**
	 * Handes disconnection of a client
	 */
	handleDisconnect () {
		console.info(`Client disconnected (${this.socket.id})`);
	}
}

module.exports = SocketHandler;
