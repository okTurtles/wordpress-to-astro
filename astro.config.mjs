import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import remarkBreaks from 'remark-breaks' // improves support for newlines in markdown files
import remarkGfm from 'remark-gfm' // support rendering tables in markdown files
// twitter & youtube auto-embed via remark
import remarkEmbedder from '@remark-embedder/core'
import oembedTransformer from '@remark-embedder/transformer-oembed'

const remarkEmbedPlugin = [remarkEmbedder.default, {
  transformers: [oembedTransformer.default],
  // https://github.com/remark-embedder/transformer-oembed/issues/25#issuecomment-888613740
  // https://github.com/remark-embedder/core#handleerror-errorinfo-errorinfo--gottenhtml--promisegottenhtml
  handleError ({error, url, transformer}) {
    if (transformer.name !== '@remark-embedder/transformer-oembed' || !url.includes('twitter.com')) {
      // we're only handling errors from this specific transformer and the twitter URL
      // so we'll rethrow errors from any other transformer/url
      throw error
    }
    console.error("ERROR: couldn't embed:", url)
    return `<p style="color:red">ERROR: Unable to embed <a href="${url}">this tweet</a> (possibly deleted).</p>`
  }
}]

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com', // CHANGE THIS TO YOUR HOMEPAGE!
	integrations: [mdx(), sitemap()],
	markdown: {
		remarkPlugins: [remarkEmbedPlugin, remarkGfm, remarkBreaks]
	}
})
