import rss from '@astrojs/rss'
import { SITE_TITLE, SITE_DESCRIPTION } from '../config.ts'
import { getPosts, postHTML } from '@/js/util.js'

export async function GET (context) {
  const posts = await getPosts()
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // site: import.meta.env.SITE,
    site: context.site,
    items: await Promise.all(posts.map(async (post) => ({
      link: post.data.permalink,
      title: post.data.title,
      pubDate: post.data.date,
      description: postSummary(await postHTML(post), post.data.permalink)
    })))
  })
}

function postSummary (html, permalink) {
  return html
    // you can delete the below if you want to include
    // the entire blog post in your RSS feed. Note that
    // many RSS readers cache results, so readers who read
    // via RSS only won't see post edits.
    .slice(0, 1000)
    .split(' ')
    .slice(0, 100) // about 100 words
    .join(' ')
    // remove unclosed tags so that the 'Read more' link renders correctly
    .replace(/<\/[a-zA-Z]+$/, '')
    + ` &hellip; <a href="${permalink}">Read more</a>`
}
