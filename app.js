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

const redisOptions = {
  client: clientRedis,
  url  : process.env.REDIS_URL,
  host  : process.env.REDIS_HOST,
  port  : process.env.REDIS_PORT
}
const store = new RedisStore(redisOptions);
const sessionOptions = { 
  store: store,
  genid:()=>uuid(),
  secret: 'api-express-pass-mdb', 
  cookie: { maxAge:600000, expires:300000 },
  resave: false,
  saveUninitialized: true
} 
app.use(session(sessionOptions));
app.use( (req, res, next)=> {


  // console.log('SESSIDDD',req.sessionID);
  if(req.session && (req.path !=='/api/users/login')){

    store.get(req.sessionID,(err,sess)=>{
      if(err)
        next(new Error('Erro server'));

      if (!req.session || !sess) {        
        if(req.session) req.session.destroy();        
        return next(new Error('oh no')) // handle error
        // res.status(200).json({
        //   message:'Api expired',
        //   actions:[{name:'redirect',value:'/login'}]
        // });
       
      }
    });
      
  
  }
  next()
  
  
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
  res.status(err.status || 500);

  res.json({
    errors: {
      message: err.message,
      error: {},
    },
  });
});

app.listen(8000, () => console.log('Server running on http://localhost:8000/'));