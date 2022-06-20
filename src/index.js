const http = require('http')
const express = require('express')
const mongoose = require('mongoose')

const app = express()
const cors = require('cors')
const router = require('./controllers/blogs')
const config = require('./utils/config')
mongoose.connect(config.MONGODB_URI)

app.use(cors())
app.use(express.json())
app.use('/api/blogs', router)

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`)
})
