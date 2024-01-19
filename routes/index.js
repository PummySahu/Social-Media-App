var express = require('express');
var router = express.Router();
var passport = require('passport')
var userModel = require('./users')
var postModel = require('./post')
var multer = require('multer')
var path = require('path')
var fs = require('fs')
var mailer = require('../nodemailer')
var crypto = require('crypto')

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// const storage = multer.diskStorage({
//   destination: function(req,file,cb){
//     cb(null,'./public/images/uploads')
//   },
//   filename: function(req,file,cb){
//     const uniqueSuffix = Date.now()+'-'+Math.round(Math.random()*1E9)+path.extname(file.originalname)
//     cb(null,file.fieldname+'-'+uniqueSuffix)
//   }
// })

// const upload = multer({storage})





router.get('/profile', isLoggedIn, function(req, res, next){
  userModel.findOne({username:req.session.passport.user})
  .populate("posts")
  .then(function(userdetails){
    res.render("profile" , {userdetails})
  })
})

router.get('/delete/:id',function(req,res,next){
  postModel
  .findOneAndDelete({_id: req.params.id})
  .then(function(deleteid){
    res.redirect('back')
  })
})

router.get('/login',function(req,res,next){
  res.render('login')
})

router.get('/signup',function(req,res,next){
  res.render('index')
})

router.post('/login',passport.authenticate('local',{
  successRedirect:'/profile',
  failureRedirect: '/login'
}),
function(req,res,next){
})

router.post('/register',function(req,res,next){
  var newUser = new userModel({
    username:req.body.username,
    name:req.body.name,
    image:req.body.image,
    email:req.body.email,
    age:req.body.age,
    about: req.body.about
  })
  userModel.register(newUser,req.body.password)
  .then(function(u){
    passport.authenticate('local')(req,res,function(){
      res.redirect('profile')
    })
  })
  .catch(function(e){
    res.send(e)
  })
})

router.get('/edit',function(req,res,next){
  userModel
  .findOne({username:req.session.passport.user})
  .then(function(founduser){
    res.render("edit",{founduser})
  })
})

router.post('/update',isLoggedIn, function(req,res,next){
  userModel
  .findOneAndUpdate({username:req.session.passport.user},{
    username : req.body.username,
    age : req.body.age,
    name : req.body.name,
    about: req.body.about
  }, {new: true})
  .then(function(updateuser){
  req.login(updateuser, function(err) {
    if (err) { return next(err);  }
    // return res.redirect('/users/' + req.user.username);
    res.redirect('profile')
  })
  });
})


router.get('/create',function(req,res,next){
  userModel
  .findOne({username:req.session.passport.user})
  .then(function(userdetail){
    res.render("create",{userdetail})
  })
})


router.get('/home',isLoggedIn,function(req,res,next){
  postModel
  .find()
  .populate('userid')
  .then(function(allposts){
    userModel
    .findOne({username: req.session.passport.user})
    .then(function(userdetail){
      res.render('home',{allposts,userdetail})
    })
  })
})

router.get('/like/:postid',isLoggedIn,function(req,res,next){
  userModel
  .findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.findOne({_id: req.params.postid})
    .then(function(post){
      if(post.likes.indexOf(foundUser._id) === -1){
        post.likes.push(foundUser._id)
      }
      else{
        post.likes.splice(post.likes.indexOf(foundUser._id),1)
      }
      post.save()
      .then(function(){
        res.redirect("back")
      })
    })
  })
})

router.get('/close',isLoggedIn,function(req,res,next){
  res.redirect('profile')
})

router.post('/post', isLoggedIn,function(req, res ,next){
    userModel.findOne({username:req.session.passport.user})
    .then(function(founduser){
      postModel.create({
        userid: founduser._id,
        data: req.body.post
      })
      .then(function(createpost){
        founduser.posts.push(createpost._id)
        founduser.save()
        .then(function(){
          res.redirect('home')
        })
      })
    })
})

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});




const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage})

router.post('/upload',isLoggedIn, upload.single('image'), function(req, res, next) {
  userModel.findOne({username:req.session.passport.user})
 .then(function(founduser){
  if(founduser.image !== 'def.png'){
    fs.unlink(`./public/images/uploads/${founduser.image}`)
  }
  founduser.image = req.file.filename,
    founduser.save()
    .then(function(){
        res.redirect("back")
    })
  })
});


router.get("/check/:username", isLoggedIn,function(req,res,next){
  userModel.findOne({username: req.params.username})
  .then(function(users){
     if(users){
      res.json(true)
     }
     else{
      res.json(false)
     }
  })
})

router.get('/forgot',function(req,res,next){
  res.render('forgot')
})


router.post('/forgot', async function(req,res,next){
  var user = await userModel.findOne({email: req.body.email})  
  if(!user){
    res.send('mail sent if the user exist')
  }
  else{
    try{
        crypto.randomBytes(80,async function(err,buff){
          let key = buff.toString("hex")
          mailer(req.body.email, user._id, key)
          .then(async function(){
            user.keyExpire = Date.now() + 24*60*60*1000
            user.key = key

            await user.save()
            res.send('mail sent')
          })
        })
    }
    catch(err){
       res.send(err)
    }
  }
})

router.get('/forgot/:userid/:key',async function(req,res,next){
  try{
    let user = await userModel.findOne({_id: req.params.userid})
    if(user.key === req.params.key && Date.now() < user.keyExpire){
      res.render("reset",{user})
    }
    else{
      res.send("tej chl rha h...!")
    }
  }
  catch(err){
     res.send(err)
  }
})


router.post('/resetpass/:userid', async function(req,res,next){
    let user = await userModel.findOne({_id: req.params.userid})
    user.setPassword(req.body.password, async function(){
      user.key = ""
      await user.save()
      req.logIn(user, function(){
        res.redirect('/profile')
      })
    })
})


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next()
  }
  else {
    res.redirect('/')
  }
}

module.exports = router;
