module.exports = {
	mongoConnectionString: process.env.CONTAINERIZED === "true" ? "mongodb://mongo:27017/" : "mongodb://localhost:27017/"
};
