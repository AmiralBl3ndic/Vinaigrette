const mongoose = require("mongoose");

const quoteSauceSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	quote: String,
	answer: String
});

module.exports = mongoose.model('QuoteSauce', quoteSauceSchema, 'quote_sauces');
