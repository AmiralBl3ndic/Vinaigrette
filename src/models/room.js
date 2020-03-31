class Room {
	/**
	 * SocketIO Server
	 * 
	 * @type {SocketIO.Server}
	 */
	static io;

	/**
	 * List of existing rooms
	 * 
	 * @type {Array<Room>}
	 */
	static rooms = [];

	/**
	 * Check if a name is available for room creation
	 * @param {String} name Name of the room to check
	 * @returns {Boolean} Whether it is possible to create a room with given name
	 */
	static isNameAvailable (name) {
		return !this.rooms.map((room) => room.name).includes(name);
	}

	/**
	 * Get a room instance by its name, if it already has been created
	 * @param {String} name Name of the room to find
	 * @returns {Room|null} Room with given name or `null` if none found
	 */
	static findRoom (name) {
		const potentialRooms = this.rooms.filter((room) => room.name === name);

		if (!potentialRooms) return null;

		return potentialRooms[0];
	}

	/**
	 * Create a room
	 * @param {String} name Name of the room
	 * @throws {Error} When room name is not available
	 */
	constructor (name) {
		if (!Room.isNameAvailable(name)) {
			throw new Error('Room name is already in use!');
		}

		/**
		 * Name of the room
		 * @type {String}
		 */
		this.name = name;
		
		/**
		 * Array of sockets corresponding to connected clients
		 * @type {Array<SocketIO.Socket>}
		 */
		this.playersSockets = [];

		// Add room to list of rooms
		Room.rooms.push(this);
	}
}

module.exports = Room;
