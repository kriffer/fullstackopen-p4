const bcrypt = require('bcrypt')
const userRouter = require('express').Router()
const User = require('../models/user')

userRouter.get('/', async (request, response, next) => {
  try{
    const users = await User.find({}).populate('blogs')
    if(users){
      response.json(users)
    }else{
      response.status(404).end()
    }
  } catch(exception) {
    next(exception)
  }
})


userRouter.post('/', async (request, response) => {

  const { username, name, password } = request.body

  const existingUser = await User.findOne({ username })
  if (existingUser) {
    return response.status(400).json({
      error: 'username must be unique'
    })
  }

  const saltRounds=10

  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})



module.exports = userRouter
