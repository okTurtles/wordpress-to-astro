import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'

export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/posts' })
  })
}
