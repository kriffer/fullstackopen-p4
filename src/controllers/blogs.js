const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response, next) => {
  try{
    const blogs = await Blog.find({})
    if(blogs){
      response.json(blogs)
    }else{
      response.status(404).end()
    }
  } catch(exception) {
    next(exception)
  }
})



blogsRouter.post('/', async (request, response, next) => {
  const body = request.body

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  })
  try{
    const savedBlog = await blog.save()
    if(savedBlog)   {
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


blogsRouter.delete('/:id', async (request, response, next) => {
  try{
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  }catch(error) {next(error)}
})

module.exports = blogsRouter
