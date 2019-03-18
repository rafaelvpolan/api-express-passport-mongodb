
const mongoose = require('mongoose');
require('dotenv').config()

// Sets Data-bases

exports.setDb = (dbname)=>{

    return mongoose.createConnection(`${process.env.MONGODB_HOST}/${dbname}`,{useNewUrlParser: true});    

}
