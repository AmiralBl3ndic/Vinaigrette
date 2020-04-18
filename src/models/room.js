/* eslint-disable no-param-reassign */

const { formatAnswer } = require('../utils');
const MongoDBService = require('../services/mongodb-service');
const ImageSauce = require('./image-sauce');

const { requests: clientEvent, responses: serverResponse } = require('../socket-event-names');

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

		/**
		 * Points that an answer will give for the round
		 * 
		 * @type {Number}
		 */
		this.roundPoints = 5;

		/**
		 * Whether the game has started
		 * @type {Boolean}
		 */
		this.started = false;

		// Add room to list of rooms
		Room.rooms.push(this);
	}

	/**
	 * Get the current scoreboard of players in the room
	 * @returns {Array<{name: String, score: Number}>} Current scoreboard of the room
	 */
	getScoreboard () {
		return this.playersSockets.map(({ name, score, found }) => ({ name, score, found: found || false }));
	}

	/**
	 * Check if any player has reached the number of points required for winning
	 * @param {Number} points Points to reach to consider victory
	 */
	hasAnyPlayerWon (points) {
		return this.playersSockets.some((player) => player.score >= points);
	}

	/**
	 * Get a random sauce and send it to the players
	 * 
	 * @returns {ImageSauce|QuoteSauce} Random sauce
	 * @throws {Error} When no sauce found
	 */
	async getAndSendRandomSauceToPlayers () {
		// Get a random sauce
		const sauce = await MongoDBService.getRandomSauce();

		// If no sauce found
		if (!sauce) {
			Room.io.in(this.name).emit(serverResponse.NO_SAUCES_AVAILABLE);
			Room.io.in(this.name).emit(serverResponse.GAME_END);
			throw new Error('No sauce found');  // Nothing to be done
		}

		// Determine type of sauce and send it to players
		if (sauce instanceof ImageSauce) {
			Room.io.in(this.name).emit(serverResponse.NEW_ROUND_SAUCE, {
				type: 'image',
				imageUrl: sauce.imageUrl,
			});
		} else {
			Room.io.in(this.name).emit(serverResponse.NEW_ROUND_SAUCE, {
				type: 'quote',
				quote: sauce.quote,
			});
		}

		return sauce;
	}

	/**
	 * Processes the answer sent by the player
	 * @param {SocketIO.Socket} socket Player's socket
	 * @param {String} answer Answer sent by the player
	 * @param {String} rightAnswer Awaited answer
	 */
	processPlayerAnswer (socket, answer, rightAnswer) {
		if (formatAnswer(answer).equals(rightAnswer)) {
			// Increase player score
			socket.points += this.roundPoints;
					
			// Decrease points won by next player (until it gets under 3 points)
			if (this.roundPoints >= 3) {
				this.roundPoints -= 2;
			}

			socket.found = true;

			// Notify player of good answer
			socket.emit(serverResponse.GOOD_ANSWER);

			// Notify all players of scoreboard update
			Room.io.in(this.name).emit(serverResponse.SCOREBOARD_UPDATE, { scoreboard: this.getScoreboard() });
		} else {
			// Notify player of wrong answer
			socket.emit(serverResponse.WRONG_ANSWER);
		}
	}

	/**
	 * Start a game in the room
	 */
	async start () {
		const pointsToWin = 100;
		const roundDuration = 25 * 1000;  // 25 seconds
		const timeBetweenRounds = 4 * 1000;  // 4 seconds
		
		// Ensure all players have score set to 0
		this.playersSockets = this.playersSockets.map((socket) => {
			socket.score = 0;
			socket.found = false;
			return socket;
		});

		const startGameRound = async () => {
			console.info(`[GAME] [Room "${this.name}"] Round started`);
				
			this.roundPoints = 5;  // Reset round points
			
			let sauce;
			try {
				sauce = await this.getAndSendRandomSauceToPlayers();
			} catch (err) {
				return;  // No need to continue if no sauce available
			}

			// Ensure all players have their "found status" set to false (not found)
			this.playersSockets = this.playersSockets.map((socket) => {
				socket.found = false;
				return socket;
			});

			// Send a scoreboard update
			Room.io.in(this.name).emit(serverResponse.SCOREBOARD_UPDATE, { scoreboard: this.getScoreboard() });

			// Listen for players answers
			this.playersSockets.forEach(
				(socket) => socket.on(clientEvent.SAUCE_ANSWER, (answer) => this.processPlayerAnswer(socket, answer, sauce.answer)),
			);

			// Wait for round duration before doing anything
			setTimeout(() => {
				console.info(`[GAME] [Room "${this.name}"] Round ended`);

				// Stop listening to player answers
				this.playersSockets.forEach((socket) => socket.removeListener(clientEvent.SAUCE_ANSWER));

				// Notify players of round end
				Room.io.in(this.name).emit(serverResponse.ROUND_END);

				// If no player has won yet, start a new round after a timeout
				if (!this.hasAnyPlayerWon(pointsToWin)) {
					// Send good answer to all players
					Room.io.in(this.name).emit(serverResponse.RIGHT_ANSWER, {
						answer: sauce.originalAnswer,
					});

					setTimeout(() => {
						startGameRound();
					}, timeBetweenRounds);
				} else {  // If a player has won
					// Determine winner (highest score)
					// TODO: determine winner with first player to reach goal
					const winningPlayers = this.playersSockets
						.map((player) => ({ username: player.username, score: player.score }))  // Get only relevant data
						.filter((player) => player.score >= pointsToWin)  // Get only players with 'winning' score
						.sort((p1, p2) => p2.score - p1.score);  // Sort winning players by score in descending order

					// Notify all players of winner
					Room.io.in(this.name).emit(serverResponse.PLAYER_WON, winningPlayers[0]);

					console.info(`[GAME] [Room "${this.name}"] Game ended`);
				}
			}, roundDuration);  // TODO: find a way to shorten duration during round
		};

		this.started = true;
		console.info(`[GAME] [Room "${this.name}"] Game started`);
		startGameRound();  // Start the first game round
	}
}

module.exports = Room;
