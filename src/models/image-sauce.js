const mongoose = require("mongoose");

const imageSauceSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	imageUrl: String,
	answer: String
});

module.exports = mongoose.model('ImageSauce', imageSauceSchema, 'image_sauces');
