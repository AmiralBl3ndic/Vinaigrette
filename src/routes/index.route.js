const router = require('express').Router();

const path = require('path');

const htmlRoot = path.join(__dirname, '..', '..', 'public');

router.get('/', (req, res) => {
	res.sendFile(path.join(htmlRoot, 'index.html'));
});

module.exports = router;
