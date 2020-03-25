const router = require("express").Router();

const path = require("path");
const public = path.join(__dirname, "..", "..", "public");

router.get("/", (req, res) => {
	res.sendFile(path.join(public, "index.html"));
});

module.exports = router;
