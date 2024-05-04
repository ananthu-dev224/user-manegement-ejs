const mongoose = require('mongoose')


//schema
const userSchema =  new mongoose.Schema({
    username:{
       type:String,
       unique:true,
       required:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
    },
    password:{
       type: String,
       required:true,
    }
})

//model
const userModel = new mongoose.model('User',userSchema)

module.exports = userModel