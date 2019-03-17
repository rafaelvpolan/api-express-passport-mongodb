
const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const mongodb = require('../../config/mongodb');
const Admin = mongodb.setDb('admin');

const Users = Admin.model('Users');

//POST new user route (optional, everyone has access)
router.post('/', auth.optional, (req, res, next) => {
  const { body: { user } } = req;

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  const finalUser = new Users(user);

  const email = user.email = user.email.toLowerCase();
  const password = user.password;

  return Users.findOne({ email })
  .then((user) => {
    if(user) {

      return res.status(422).json({ errors: 'E-mail exists' })

    }else{
  
      finalUser.setPassword(password);

      return finalUser.save()
      .then(() => res.status(201).json({ user: finalUser.toAuthJSON() }));

    }
   
    
  }).catch((err)=>{

    return res.status(500).json(err);

  });


});

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
  const { body: { user } } = req;

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if(err) {
      return next(err);  
    }

    if(passportUser) {
      const user = passportUser;
      user.token = passportUser.generateJWT();

      return res.json({ user: user.toAuthJSON() });
    }

    return status(400).info;
  })(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  console.log('req',id);

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.status(200).json({message:'user nao logado'});
      }

      return res.json({ user: user.toAuthJSON() });
    }).catch((err)=>{
      return res.json(err);
    })
});

module.exports = router;