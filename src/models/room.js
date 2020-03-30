class Room {
	static io;

	/**
	 * List of existing rooms
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
	 * Create a room
	 * @param {String} name Name of the room
	 */
	constructor (name) {
		if (!Room.isNameAvailable(name)) {
			throw new Error('Room name is already in use!');
		}

		this.name = name;
		this.connectedPlayers = [];

		// Add room to list of rooms
		Room.rooms.push(this);
	}
}

module.exports = Room;
