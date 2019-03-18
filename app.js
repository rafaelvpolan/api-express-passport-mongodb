const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');
const session = require('express-session');
const redis = require('redis');
const clientRedis = redis.createClient();
const RedisStore = require('connect-redis')(session);
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');


//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

//Initiate our app
const app = express();

//Configure our app
app.use(cors());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

const store = new RedisStore({
  client: clientRedis,
  url  : process.env.REDIS_URL,
  host  : process.env.REDIS_HOST,
  port  : process.env.REDIS_PORT
});

app.use(session( { 
  store: store,
  genid:()=>uuid(),
  secret: process.env.SESSION_SECRET, 
  cookie: { maxAge:3600000 },
  rolling:true,
  resave: false,
  saveUninitialized: true
}));

app.use((req, res, next)=> {

  if(req.sessionID && (req.path !=='/api/users/login')){

    return store.get(req.sessionID,(err,sess)=>{
      if(err)
        next(new Error('Erro server'));
      
      if (!sess) {        
        if(req.session) req.session.destroy();        
        // return next(new Error('oh no')) // handle error
        return res.status(200).json({
          message:'Api expirated!',
          actions:[{name:'redirect',value:'/login'}]
        }).end();
      
      }else{       
        next();
      }
    });      
    
  }else{

    next();
  }

})

if(!isProduction) {
  app.use(errorHandler());
}

//Configure Mongoose
mongoose.set('debug', true);

//Models & routes
require('./models/Users');
require('./config/passport');
app.use(require('./routes'));

//Error handlers & middlewares
if(!isProduction) {
  app.use((err, req, res) => {
    res.status(err.status || 500);

    res.json({
      errors: {
        message: err.message,
        error: err,
      },
    });
  });
}

app.use((err, req, res) => {
if(err){
  res.status(err.status || 500);

  res.json({
    errors: {
      message: err.message,
      error: {},
    },
  });
}
});





app.listen(8000, () => console.log('Server running on http://localhost:8000/'));