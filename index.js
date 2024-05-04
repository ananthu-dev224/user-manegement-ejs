const express = require('express')
const app = express()
const path = require('path')
const nocache = require('nocache')
const session = require('express-session')
const {v4:uuidv4} = require('uuid')




//dev defined module
const router = require('./controller/router')


const PORT = process.env.PORT || 4000

// Middleware
app.use(nocache())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))




//Database
const db = require('./model/db')
const userModel = require('./model/schema')


app.use(session({
    secret:uuidv4(),
    resave:false,
    saveUninitialized:true
  }))
  


app.set('view engine','ejs')

app.use('/static',express.static(path.join(__dirname,'public')))
app.use('/assets',express.static(path.join(__dirname,'/public/assets')))

app.use('/',router)


app.listen(PORT,()=>{
    console.log(`listening at http://localhost:${PORT}`);
})
