const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}


const totalLikes = (blogs) => {
  return blogs.reduce((a, b) => { return a + b.likes }, 0)
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((a, b) => { return a.likes > b.likes ? { title: a.title, author: a.author, likes: a.likes } : b })
}

const mostBlogs = (blogs) => {
  const result = _(blogs)
    .groupBy(x => x.author)
    .map((value, key) => ({ author: key, blogs: value.length }))
    .value()
    .reduce((a, b) => { return a.likes > b.likes ? a : b })

  return result

}

const mostLikes = (blogs) => {
  const result =  _(blogs)
    .groupBy(x => x.author)
    .map((value, key) => ({ author: key, likes: _.sumBy(value, 'likes') }))
    .value().reduce((a, b) => { return a.likes > b.likes ? a : b })

  return result

}

module.exports = {
  dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
}
