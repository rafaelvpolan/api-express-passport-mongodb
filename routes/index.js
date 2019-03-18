const express = require('express');
const router = express.Router();

router.use((req, res, next)=>{
    // .. some logic here .. like any other middleware
    next();
});

router.use('/api', require('./api'));


module.exports = router;