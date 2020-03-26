const removeAccents = require("remove-accents");

/**
 * Formats an answer to processable format
 * @param {String} input Answer to format
 * @returns `input` with no accents, all lowercase and whitespaces removed
 */
function formatAnswer (input) {
	return removeAccents(input.toLowerCase().replace(/[ ,\-_]/g, ""));
}

module.exports = {
	formatAnswer
};
