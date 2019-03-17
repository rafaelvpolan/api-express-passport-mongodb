
require('dotenv').config()
const mongoose = require('mongoose');

// Sets Data-bases

exports.setDb = (dbname)=>{

    return mongoose.createConnection(`${process.env.MONGODB_HOST}/${dbname}`,{useNewUrlParser: true});    

}
