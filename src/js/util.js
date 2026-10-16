'use strict'

// alternative: https://github.com/mdevils/html-entities
import { decodeHTML } from 'entities'
import { getCollection } from 'astro:content'

// if you need a fancier one, you could use https://github.com/sindresorhus/slugify
export function urlifyToken (s) {
  return s.toLowerCase().replaceAll(' ', '-')
}

// https://github.com/DylanPiercey/strip
const htmlReg = /<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi
const commentReg = /<!--.+-->/gi
export function stripHTML (html = '') {
  return decodeHTML(html.replace(htmlReg, '').replace(commentReg, '')).trim()
}

export function sortedPosts (posts) {
  return posts
    .filter(p => !p.data.draft)
    .sort(
    (a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf()
  )
}

export async function getPosts () {
  return sortedPosts(await getCollection('posts'))
}

export async function postHTML (post) {
  return post.rendered.html
}
