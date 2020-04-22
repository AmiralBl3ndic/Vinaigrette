const router = require('express').Router();

router.get('/', (req, res) => {
	res.redirect('https://github.com/AmiralBl3ndic/Vinaigrette');
});

module.exports = router;
