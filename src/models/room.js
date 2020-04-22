/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */

const levenshtein = require('js-levenshtein');

const ImageSauce = require('./image-sauce');
const QuoteSauce = require('./quote-sauce');

const {
	maximumReportsBeforeSauceBan,
	defaultWinningScore,
	gameRoundDurationSeconds,
	gameRoundTimeoutDurationSeconds, 
	levenshteinCloseThreshold,
} = require('../server.config');

const { formatAnswer } = require('../utils');
const MongoDBService = require('../services/mongodb-service');
const S3Service = require('../services/s3-service');

const { requests: clientEvent, responses: serverResponse } = require('../socket-event-names');

/**
 * @typedef CurrentSauce
 * @property {mongoose.Types.ObjectID} _id
 * @property {String} answer
 * @property {String} imageUrl
 * @property {String} quote
 * @property {String} answer
 * @property {String} originalAnswer
 */

/**
 * Represents a game room
 */
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

		/**
		 * @type {Function}
		 */
		this.roundTimeout = null;

		/**
		 * Current sauce to send to the players
		 * @type {CurrentSauce}
		 */
		this.currentSauce = null;

		/**
		 * Time remaining to play during the current round
		 * @type {Number}
		 */
		this.remainingRoundTime = 0;

		this.remainingTimeInterval = null;

		this.sauceDeleted = false;

		this.formattedSauceAnswer = '';

		this.isClosing = false;

		// Add room to list of rooms
		Room.rooms.push(this);
	}

	/**
	 * Get the current scoreboard of players in the room
	 * @returns {Array<{username: String, score: Number, found: Boolean}>} Current scoreboard of the room
	 */
	getScoreboard () {
		return this.playersSockets.map(({ username, points, found }) => ({ player: username, score: points, found: found || false }));
	}

	/**
	 * Check if any player has reached the number of points required for winning
	 * @param {Number} points Points to reach to consider victory
	 */
	hasAnyPlayerWon (points) {
		return this.playersSockets.some((player) => player.points >= points);
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

		// Save sauce
		this.currentSauce = sauce;

		this.formattedSauceAnswer = formatAnswer(sauce.originalAnswer);

		// If no sauce found
		if (!sauce) {
			Room.io.in(this.name).emit(serverResponse.NO_SAUCES_AVAILABLE);
			Room.io.in(this.name).emit(serverResponse.GAME_END);
			throw new Error('No sauce found');  // Nothing to be done
		}

		// Determine type of sauce and send it to players
		if (sauce.imageUrl) {
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
	 * Get the function that listens and processes a player answer
	 * @param {SocketIO.Socket} socket Socket to bind the action to
	 */
	getSocketAnswerListenerFunction (socket) {
		return (answer) => this.processPlayerAnswer(socket, answer, this.formattedSauceAnswer);
	}

	/**
	 * Processes the answer sent by the player
	 * @param {SocketIO.Socket} socket Player's socket
	 * @param {String} answer Answer sent by the player
	 * @param {String} rightAnswer Awaited answer
	 */
	processPlayerAnswer (socket, answer, rightAnswer) {
		if (socket.found) return;  // Do not process the answer of a player who have already found the answer
		
		const formattedAnswer = formatAnswer(answer);

		if (formatAnswer === rightAnswer) {
			// Increase player score
			socket.points += this.roundPoints;
					
			// Decrease points won by next player
			if (this.roundPoints === 5) {  // First player gets 5 points
				this.roundPoints = 3;
			} else if (this.roundPoints === 3) {  // Second player gets 3 points
				this.roundPoints = 2;
			} else if (this.roundPoints === 2) {  // Third player gets 2 points
				this.roundPoints = 1;  // Next players get 1 point
			}

			socket.found = true;
			socket.foundAt = Date.now();

			// Notify player of good answer
			socket.emit(serverResponse.GOOD_ANSWER);

			// Notify all players of scoreboard update
			Room.io.in(this.name).emit(serverResponse.SCOREBOARD_UPDATE, { scoreboard: this.getScoreboard() });
		} else if (levenshtein(formattedAnswer, rightAnswer) <= levenshteinCloseThreshold) {  // If answer is close
			socket.emit(serverResponse.ANSWER_IS_CLOSE);
		} else {  // Notify player of wrong answer
			socket.emit(serverResponse.WRONG_ANSWER);
		}
	}

	/**
	 * Start a game in the room
	 */
	async start () {
		const pointsToWin = defaultWinningScore;
		const roundDuration = gameRoundDurationSeconds * 1000;
		const timeBetweenRounds = gameRoundTimeoutDurationSeconds * 1000;
		
		if (this.started) {
			return;   // Do not start a game in the same room again
		}
		
		// Ensure all players have score set to 0
		this.playersSockets = this.playersSockets.map((socket) => {
			socket.points = 0;
			socket.found = false;
			socket.foundAt = null;
			return socket;
		});

		// Notify all players of the room that the game has started
		Room.io.in(this.name).emit(serverResponse.GAME_START);

		const startGameRound = async () => {
			console.info(`[GAME] [Room "${this.name}"] Round started`);
				
			this.roundPoints = 5;  // Reset round points
			
			let sauce;
			try {
				sauce = await this.getAndSendRandomSauceToPlayers();
			} catch (err) {
				return;  // No need to continue if no sauce available
			}

			this.sauceDeleted = false;

			// Ensure all players have their "found status" set to false (not found)
			this.playersSockets = this.playersSockets.map((socket) => {
				socket.found = false;
				socket.foundAt = null;
				return socket;
			});

			/**
			 * Function responsible for the actions at the end of a round
			 */
			const processRoundEnd = () => {
				console.info(`[GAME] [Room "${this.name}"] Round ended`);

				// Stop listening to player answers and mark all as able to report again
				this.playersSockets.forEach((socket) => {
					socket.off(clientEvent.SAUCE_ANSWER, socket.answerListener);
					socket.currentSauceReported = false;
				});

				// Notify players of round end
				Room.io.in(this.name).emit(serverResponse.ROUND_END);

				// If no player has won yet, start a new round after a timeout
				if (!this.hasAnyPlayerWon(pointsToWin)) {
					// Send good answer to all players
					Room.io.in(this.name).emit(serverResponse.RIGHT_ANSWER, {
						answer: sauce.originalAnswer,
					});

					if (!this.isClosing) {
						setTimeout(() => {
							startGameRound();
						}, timeBetweenRounds); 
					}
				} else {  // If a player has won
					// Send good answer to all players
					Room.io.in(this.name).emit(serverResponse.RIGHT_ANSWER, {
						answer: sauce.originalAnswer,
					});

					// Determine winner (highest score)
					const winningPlayers = this.playersSockets
						.map((player) => ({ username: player.username, score: player.points, foundAt: player.foundAt }))  // Get only relevant data
						.filter((player) => player.score >= pointsToWin)  // Get only players with 'winning' score
						.sort((p1, p2) => p2.score - p1.score);  // Sort winning players by score in descending order
				
					let winner = winningPlayers[0];

					if (winningPlayers.length >= 2 && winningPlayers[0].score === winningPlayers[1].score) {
						// eslint-disable-next-line prefer-destructuring
						winner = winningPlayers.sort((p1, p2) => p1.foundAt - p2.foundAt)[0];
					}

					setTimeout(() => {
						// Notify all players of winner and game end
						Room.io.in(this.name).emit(serverResponse.PLAYER_WON, winner);
						Room.io.in(this.name).emit(serverResponse.GAME_END);

						this.started = false;

						console.info(`[GAME] [Room "${this.name}"] Game ended`);
					}, timeBetweenRounds);
				}
			};

			this.remainingRoundTime = roundDuration / 1000;
			const numberOfPlayers = this.playersSockets.length;
			this.remainingTimeInterval = setInterval(() => {
				this.remainingRoundTime -= 1;
				if (this.remainingRoundTime <= 0) {
					clearInterval(this.remainingTimeInterval);
					Room.io.in(this.name).emit(serverResponse.TIMER_UPDATE, 0);
				} else {
					Room.io.in(this.name).emit(serverResponse.TIMER_UPDATE, this.remainingRoundTime);
					const numberOfPlayersWhoGuessed = this.playersSockets.filter(({ found }) => found).length;
					if (numberOfPlayersWhoGuessed === numberOfPlayers) {
						clearInterval(this.remainingTimeInterval);
						clearTimeout(this.roundTimeout);
						processRoundEnd();
					}
				}
			}, 1000);

			// Send a scoreboard update
			Room.io.in(this.name).emit(serverResponse.SCOREBOARD_UPDATE, { scoreboard: this.getScoreboard() });

			// Listen for players answers
			this.playersSockets.forEach((socket) => {
				socket.answerListener = this.getSocketAnswerListenerFunction(socket);
				socket.on(clientEvent.SAUCE_ANSWER, socket.answerListener);
			});

			// Wait for round duration before doing anything
			this.roundTimeout = setTimeout(processRoundEnd, roundDuration);
		};

		this.started = true;
		console.info(`[GAME] [Room "${this.name}"] Game started`);
		startGameRound();  // Start the first game round
	}

	/**
	 * Handles updating records reports and deleting the ones with too many reports
	 */
	async reportCurrentSauce () {
		console.info(`[ROOM] [Room "${this.name}"] [REPORT] Sauce reported`);

		const reportedSauce = this.currentSauce;

		if (this.sauceDeleted) return;

		// Check if current sauce is an image
		if (this.currentSauce.imageUrl) {
			const sauces = await ImageSauce.find({ imageUrl: reportedSauce.imageUrl });
			
			for (const sauce of sauces) {
				sauce.reports = sauce.reports ? sauce.reports + 1 : 1;

				if (sauce.reports >= maximumReportsBeforeSauceBan) {
					S3Service.deleteImage(sauce.imageUrl);
					sauce.remove();
					this.sauceDeleted = true;
					console.info(`[ROOM] [Room "${this.name}"] [REPORT] Sauce was deleted`);
				} else if (!this.sauceDeleted) {
					sauce.save();
				}
			}
		} else {
			const sauces = await QuoteSauce.find({ quote: reportedSauce.quote, originalAnswer: reportedSauce.originalAnswer });

			for (const sauce of sauces) {
				sauce.reports = sauce.reports ? sauce.reports + 1 : 1;

				if (sauce.reports >= maximumReportsBeforeSauceBan) {
					sauce.remove();
					this.sauceDeleted = true;
					console.info(`[ROOM] [Room "${this.name}"] [REPORT] Sauce was deleted`);
				} else if (!this.sauceDeleted) {
					sauce.save();
				}
			}
		}
	}
}

module.exports = Room;
