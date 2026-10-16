'use strict'

// alternative: https://github.com/mdevils/html-entities
import { decodeHTML } from 'entities'
import { getCollection, render } from 'astro:content'
import { experimental_AstroContainer } from 'astro/container'
import { loadRenderers } from 'astro:container'
import { getContainerRenderer } from '@astrojs/mdx/container-renderer'

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
  const posts = sortedPosts(await getCollection('posts'))
  // `@astrojs/mdx` applies the `layout` of an `.mdx` file by itself. The post page
  // would apply it a second time, and `postHTML()` (lists, RSS) would return a
  // whole page. Every page calls this function, so `astro dev` shows the error on
  // every page, not only on the post page.
  const mdxWithLayout = posts.find(p => p.data.layout && p.filePath.endsWith('.mdx'))
  if (mdxWithLayout) {
    throw new Error(`${mdxWithLayout.filePath}: remove 'layout' from this .mdx post (.mdx posts always use BlogPost.astro)`)
  }
  return posts
}

// `.md` entries come with their HTML in `post.rendered`, but the local images in
// it are placeholders that only `render()` replaces. `.mdx` entries have no HTML
// at all: they are components. Both are rendered to a string with Astro's
// experimental Container API. Each post is rendered once and cached. The cache
// checks `post.digest` so that `astro dev` renders an edited post again.
const renderedHTMLCache = new Map()
export async function postHTML (post) {
  if (post.rendered && !post.rendered.metadata?.imagePaths?.length) return post.rendered.html
  let cached = renderedHTMLCache.get(post.id)
  if (cached?.digest !== post.digest) {
    cached = { digest: post.digest, html: renderToHTML(post) }
    renderedHTMLCache.set(post.id, cached)
  }
  return cached.html
}

let container
async function renderToHTML (post) {
  container ??= loadRenderers([getContainerRenderer()])
    .then(renderers => experimental_AstroContainer.create({ renderers }))
  const { Content } = await render(post)
  return (await container).renderToString(Content)
}
