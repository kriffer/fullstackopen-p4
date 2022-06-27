const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../src/app')
const helper = require('./helper')
const Blog = require('../src/models/blog')
const bcrypt = require('bcrypt')
const User = require('../src/models/user')
const api = supertest(app)


//---------------------Users


beforeEach(async () => {
  await User.deleteMany({})
  await Blog.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', name:'superuser',passwordHash })
  const savedUser = await user.save()

  const blogs = helper.initialBlogs.map(b => ({ ...b, 'user':savedUser.id }))
  await Blog.insertMany(blogs)

})

describe('when there is initially one user in db', () => {



  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'user1',
      name: 'User Test',
      password: 'test',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('username must be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
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

  test('should return 401 Unauthorized if no token is defined in request header', async () => {

    const user = { 'username':'root','password':'sekret' }

    const response=await api
      .post('/api/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /application\/json/)


    const token = response.body.token

    const newBlog = {
      author: 'John Doe',
      likes: 2 ,
      url: 'http://localhost:3003',
      title: 'Blog test'
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

  })

  test('succeeds with valid data', async () => {

    const user = { 'username':'root','password':'sekret' }

    const response=await api
      .post('/api/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /application\/json/)


    const token = response.body.token

    const newBlog = {
      author: 'John Doe',
      likes: 2 ,
      url: 'http://localhost:3003',
      title: 'Blog test'
    }

    await api
      .post('/api/blogs')
      .set({ Authorization: `Bearer ${token}` })
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
    const user = { 'username':'root','password':'sekret' }
    const response=await api
      .post('/api/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const token = response.body.token

    const newBlog = {
      author: 'John Doe',
      likes: 2
    }

    await api
      .post('/api/blogs')
      .set({ Authorization: `Bearer ${token}` })
      .send(newBlog)
      .expect(400)

    const blogsInDB = await helper.blogsInDb()
    expect(blogsInDB).toHaveLength(helper.initialBlogs.length)
  })


  test('likes property should be default 0 if not specified in request data', async () => {
    const user = { 'username':'root','password':'sekret' }

    const response=await api
      .post('/api/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /application\/json/)


    const token = response.body.token

    const newBlog = {
      author: 'John Doe',
      title:'Sample test blog',
      url:'http://localhost:3003'
    }

    const resp = await api
      .post('/api/blogs')
      .set({ Authorization: `Bearer ${token}` })
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(resp.body.likes).toEqual(0)
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
    const user = { 'username':'root','password':'sekret' }

    const response=await api
      .post('/api/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /application\/json/)


    const token = response.body.token

    const blogsInDb = await helper.blogsInDb()
    const blog = blogsInDb[0]

    await api
      .delete(`/api/blogs/${blog.id}`)
      .set({ Authorization: `Bearer ${token}` })
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