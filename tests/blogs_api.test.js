const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../src/app')
const helper = require('./helper')
const Blog = require('../src/models/blog')
const api = supertest(app)


beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})


describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  },100000)


  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('unique identifier property of the blog posts should be id,', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    const blogsInDB = await helper.blogsInDb()
    const iDs = blogsInDB.map(blog => blog.id)
    expect(iDs).toBeDefined()
  })


})


describe('addition of a new blog', () => {
  test('succeeds with valid data', async () => {
    const newBlog = {
      author: 'John Doe',
      likes: 2 ,
      url: 'http://localhost:3003',
      title: 'Blog test'
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsInDB = await helper.blogsInDb()
    expect(blogsInDB).toHaveLength(helper.initialBlogs.length + 1)
    const titles = blogsInDB.map(blog => blog.title)
    expect(titles).toContain(
      'Blog test'
    )
  })


  test('response code should be 400 if there are no title and url in request data', async () => {
    const newBlog = {
      author: 'John Doe',
      likes: 2
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsInDB = await helper.blogsInDb()
    expect(blogsInDB).toHaveLength(helper.initialBlogs.length)
  })


  test('likes property should be default 0 if not specified in request data', async () => {
    const newBlog = {
      author: 'John Doe',
      title:'Sample test blog',
      url:'http://localhost:3003'
    }

    const response = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(response.body.likes).toEqual(0)
  })

})


describe('updating of a blog', () => {
  test('property likes should be updated successfully', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blog = blogsInDb[1]

    blog.likes = blog.likes + 1

    const response = await api
      .put(`/api/blogs/${blog.id}`)
      .send(blog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(response.body.likes).toEqual(blog.likes)
  })

})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blog = blogsInDb[0]

    await api
      .delete(`/api/blogs/${blog.id}`)
      .expect(204)

    const blogsInDbAfterDelete = await helper.blogsInDb()

    expect(blogsInDbAfterDelete).toHaveLength(
      helper.initialBlogs.length - 1
    )

    const contents = blogsInDbAfterDelete.map(b => b.title)

    expect(contents).not.toContain(blog.title)
  })
})


afterAll(() => {
  mongoose.connection.close()
})