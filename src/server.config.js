module.exports = {
	mongoConnectionString: process.env.CONTAINERIZED === "true" ? "mongodb://mongo:27017/vinaigrette" : "mongodb://localhost:27017/vinaigrette"
};
