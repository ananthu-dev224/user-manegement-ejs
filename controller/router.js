const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')

var userLogin 
var adminLogin


//DB user
const userModel = require('../model/schema')


//landing page route
const commonHandler = (req,res)=>{
  if(req.session.userLogin){
    res.status(200)
    res.redirect("/Home")
  }
  else{
    res.status(200)
    res.render("userLogin");
  }
}


router.get('/',commonHandler)
router.get('/login',commonHandler)

//signup page route 
router.get('/SignUp',(req,res)=>{
  
    if(!req.session.userLogin){
      res.render('userSignup')
    }else{
      res.redirect('/Home')
    }
})

//sign up route and data saving
router.post('/SignUp/Home',async (req,res)=>{
        // Extract user data from the request body
        const { username, email, password } = req.body;

        //checking if the email already exists in db
        let existingUser
        if(/^[A-Za-z]/.test(username)){
          existingUser = await userModel.findOne({email})
        if(existingUser){
          return res.render('userSignup',{alert:"Email already exists"})
        }
        //hashpassword
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password,saltRounds)
        // Create a new user instance
        const newUser = new userModel({
          username,
          email,
          password:hashedPassword,
        });
        
        // Save the user to the database
        await newUser.save().then(()=>{

        //set session userLogin variable
          req.session.userLogin = true;


          if(req.session.userLogin){
            req.session.username = username
             res.redirect('/Home')
          }
          else{
            res.redirect('/')
          }
        }).catch ((error) =>{
          console.error(error)
          res.render('error',{error:error.message})
        }
        )}
        else{
           res.redirect('/SignUp')
        }
             
})


//form login user for an existing user
router.post('/Login/Home', async (req, res) => {
    try {
      const { email, password } = req.body;
      // Find user in the database
      const user = await userModel.findOne({ email })
       
      //if user doesnt give any value and login
      if (!email || !password) {
         return res.render('userLogin', { alert: 'Email and password are required' });
      }
  
      //response if the user doesnt exists
      if(!user){
       return res.render('userLogin',{alert:"No user found with the email"})
      }
       
      //match password
      const passMatch = await bcrypt.compare(password,user.password)
  
      //response if the password is wrong
      if (!passMatch) {
        return res.render('userLogin', { alert: 'Password is wrong' });
      }
      
      //if both are valid
      req.session.userLogin = true
      req.session.username = user.username
      if(req.session.userLogin){
        res.status(201)
        res.redirect('/home')
      }else{
         res.redirect('/')
      }
    } catch (error) {
      console.error(error);
      return  res.status(500).render('error',{error:error.message})
    }
  });


//home page route
router.get('/Home',(req,res)=>{
    if(req.session.userLogin){
      const username = req.session.username
      res.render('userHome',{user:username})
    }else{
      res.redirect('/')
    }
  })

//logout route
router.post('/logout',(req,res)=>{
  req.session.userLogin = false
  res.redirect('/')
})


//////ADMIN ZONE//////

//admin
const admindb={
  email:"admin@gmail.com",
  password:"ananthu9526",
}



//admin log in
router.get('/Admin',(req,res)=>{
  res.render('adminLogin')

})

//admin log in form post
router.post('/AdminPanel',(req,res)=>{
      try{
        const{adminemail , adminpass } =req.body

        if(adminemail === ''|| adminpass === '' ){
          res.render('adminLogin',{alert:"Email and password is mandatory"})
        }else if(admindb.email !== adminemail){
          res.render('adminLogin',{alert:"Email not found"})
        }else if(adminpass !== admindb.password ){
          res.render('adminLogin',{alert:"Password not correct"})
        }else if(admindb.email !== adminemail && adminpass !== admindb.password){
          res.render('adminLogin',{alert:"Email and Password is wrong"})
        }else{
          req.session.adminLogin = true
          if(req.session.adminLogin){
            res.redirect('/AdminPanel')
          }
        }
      }catch(error){
        console.log(error);
        res.render('error',{error:error.message})
      }
})


//admin panel get
router.get('/AdminPanel',async(req,res)=>{
  try{
    const users = await userModel.find();
    if(req.session.adminLogin){
      res.render('adminPanel',{users,message:"Hello Admin, Welcome to Admin Panel"})
    }
    else{
      res.redirect('/Admin');
    }
  }
  catch(err){
    res.status(500).render('error',{error:err.message})
  }
})

//inserting data from adminPanel
router.post('/Insert',async (req,res)=>{
  const saltround=10
  const {username,email,password}=req.body
  const users = await userModel.find();
  const hashedPassword = await bcrypt.hash(password,saltround)
  const newUser = new userModel({
    username,
    email,
    password:hashedPassword,
  })
  newUser.save()
  .then(()=>{
    res.redirect('/AdminPanel');
  })
  .catch((err)=>{
    console.error(err);
        res.render('adminPanel',{users,message:"Email already exists"})
  })
})

//deleting data
router.post('/AdminPanel/Delete/:id',async (req,res)=>{
  try{
    await userModel.findByIdAndDelete(req.params.id);
    res.redirect('/AdminPanel')
  }
  catch(err){
        console.error("Error deleting user:", err);
        res.status(500).render('error',{error:err.message})
  }
})


//search bar
router.get('/AdminPanel/Search', async (req, res) => {
  const {username} = req.query;
  try {
    const users = await userModel.find({
        username: new RegExp("^"+username, 'i')
    });

    if(req.session.adminLogin){
      if(users.length>0){
        res.render('adminPanel',{users,message:"User found"});
      }
      else{
        res.render('adminPanel',{users,message:"No user found"})
      }
    }
    else{
      res.redirect('/Admin');
    }
    
    
} catch (err) {
    console.error("Error during search:", err);
    res.status(500).send('Internal Server Error');
}
});

//edit data page
router.get('/AdminPanel/Edit/:id',async (req,res)=>{
  const user = await userModel.findById(req.params.id)
  if(req.session.adminLogin){
    res.render("editData",{alert:"Welcome to the Edit Page Admin",user})
  }else{
    res.redirect('/AdminPanel')
  }
})

//editing and updating data
router.post('/AdminPanel/Update/:id',async(req,res)=>{
   try {
      if(req.body.password){
      const saltround = 10
      const hashPassword = await bcrypt.hash(req.body.password,saltround)
      req.body.password = hashPassword
      }
      await userModel.findByIdAndUpdate(req.params.id,req.body)
      
      //Check if admin is logged in 
      if(req.session.adminLogin){
        const users = await userModel.find()
        res.render('adminPanel',{message:'Edit Success',users})
      }else{
        res.redirect('/Admin')
      }
      
   } catch (error) {
    //This error code is duplicate key error
       if(error.code === 11000){
        res.render('editData',{alert:"Email already exists",users:req.body})
       }else{
        res.status(500).render("error",{error:error.message})
       }
   }
})



//Logout Admin
router.post('/AdminPanel/Adminlogout',(req,res)=>{
  req.session.adminLogin = false
  res.redirect('/Admin')
})

module.exports = router