/**
 * Handler for socket-related actions
 */
class SocketHandler {
	/**
	 * Create a SocketHandler
	 * @param {SocketIO.Socket} socket Client socket
	 */
	constructor (socket) {
		this.socket = socket;

		this.score = undefined;

		// Bind socket events to SocketHandler actions
	}
}

module.exports = SocketHandler;
