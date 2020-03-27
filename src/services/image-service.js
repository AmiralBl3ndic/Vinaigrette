const sharp = require('sharp');

/**
 * Wrapper for image manipulation tasks
 */
class ImageService {
	/**
	 * Converts the `buffer` of bytes of an image to JPEG format
	 * 
	 * @param {Buffer} buffer Bytes of the image to convert to JPEG
	 * @returns {Buffer} Bytes of the image in JPEG format
	 */
	static async convertToJPEG (buffer) {
		if (buffer.length === 0) {  // If empty buffer
			return null;
		}

		return sharp(buffer).toFormat('jpeg').jpeg().toBuffer();
	}
}

module.exports = ImageService;
