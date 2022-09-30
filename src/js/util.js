'use strict'

// alternative: https://github.com/mdevils/html-entities
import { decodeHTML } from 'entities'

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

export function sortedPosts (paths) {
  return paths
    .filter(p => !p.frontmatter.draft)
    .sort(
    (a, b) => new Date(b.frontmatter.date).valueOf() - new Date(a.frontmatter.date).valueOf()
  )
}
