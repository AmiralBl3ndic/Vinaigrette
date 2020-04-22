const removeAccents = require('remove-accents');

/**
 * Formats an answer to processable format
 * @param {String} input Answer to format
 * @returns `input` with no accents, all lowercase and whitespaces removed
 */
function formatAnswer (input) {
	if (!input) return '';

	const withoutAccents = removeAccents(input.toLowerCase().replace(/[ ,\-_]/g, ''));
	if (!withoutAccents) return '';

	return withoutAccents.toLowerCase().replace(/[,;:?./+="'(!)]/g, '');
}

module.exports = {
	formatAnswer,
};
