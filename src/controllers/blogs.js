const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const { userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (request, response, next) => {
  try{
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    if(blogs){
      response.json(blogs)
    }else{
      response.status(404).end()
    }
  } catch(exception) {
    next(exception)
  }
})



blogsRouter.post('/', userExtractor, async (request, response, next) => {
  const body = request.body
  let user = request.user
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user:  user._id
  })
  try{
    const savedBlog = await blog.save()
    if(savedBlog)   {
      user.blogs = user.blogs.concat(savedBlog._id)
      await user.save()
      response.status(201).json(savedBlog)
    }else{
      response.status(404).end()
    }
  }catch(error) {
    next(error)
  }})


blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body
  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  }
  try{
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.status(201).json(updatedBlog)
  }catch(error) {next(error)}
})


blogsRouter.get('/:id', async (request, response, next) => {
  try{
    const blog = await Blog.findById(request.params.id)
    if (blog) {
      response.json(blog)
    } else {
      response.status(404).end()
    }
  }
  catch(error) { next(error)}
})


blogsRouter.delete('/:id', userExtractor, async (request, response, next) => {
  try{
    const blog = await Blog.findById(request.params.id)
    if(request.user.id.toString() === blog.user.toString()){
      await Blog.deleteOne(blog)
      response.status(204).end()
    } else {
      response.status(401).json({ error: 'Forbidden for this user' })
    }
  }catch(error) {next(error)}
})

module.exports = blogsRouter
