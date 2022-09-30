# Wordpress → Astro Converstion Kit

You can clone/copy and modify this repo to your liking.

Your markdown-exported Wordpress blog posts should be placed in: `pages/posts/`

Please see this blog for details:

👉 **[How to Convert a Wordpress blog to Astro Static Site Generator](https://blog.okturtles.org/2022/10/convert-wordpress-to-static-site/)**

## How this project differs from the official template:

This project is fork of version `1.1.0` of the [`create-astro`](https://github.com/withastro/astro/tree/main/packages/create-astro) project.

The following differences exist:

- Wordpress-specific modifications:
  - URL preservation:
    - `pages/[...wp].astro`: preserves original wordpress permalinks for posts, as defined by the frontmatter `permalink`
    - `pages/author/[slug].astro`: wordpress-URL for listing posts for specific author
    - `pages/category/[slug].astro`: wordpress-URL for listing posts for specific category
    - `pages/tag/[slug].astro`: wordpress-URL for listing posts for specific tag
    - `pages/page/[page].astro`: wordpress-URL pagination support for listing all of your posts on the homepage
    - The orignal template's `src/pages/blog/` folder has been removed. Posts now go in `src/posts/`
  - Components:
    - `src/components/WPArticleSummary.astro`: two ways of showing post summaries on main page (with or without `<!--more-->` comment)
    - `src/components/PostFooter.astro`: optional footer under posts to link to related categories, tags, etc.
    - `src/components/Sidebar.astro`: sidebar widgets to list categories and recent posts
    - `src/components/Search.astro`: non-functioning search widget. Feel free to [implement it](https://gomakethings.com/how-to-create-a-search-page-for-a-static-website-with-vanilla-js/) and send a PR!
- Added the following dependencies:
  - `remark-breaks`: better newline handling in markdown files
  - `remark-gfm`: support for rendering tables in markdown files
  - `@remark-embedder/core` & `@remark-embedder/transformer-oembed`: support for rendering Twitter and YouTube links as embeds
- `src/pages/rss.xml.js`: superior RSS generation
- Added support for `@` in imports to make it easy to import files without using `../../../` etc.
- Added `PAGE_SIZE` config variable to `src/config.ts`
- `.npmrc` now uses `save-exact = true`

## How to use this project

1. Follow the instructions in the [companion blog post](https://blog.okturtles.org/2022/10/convert-wordpress-to-static-site/) to export your Wordpress posts and content.
2. Clone or copy this project.
3. Place your markdown-ified Wordpress posts in `src/posts`.
4. Run `npm install` (once), then either `npm run build` or `npm run dev` per the original instructions below.
5. Make any modifications as needed to the files under `src` so that your blog looks and behaves the way you'd like it.

Finally, there are some thinks to keep in mind:

- The following frontmatter is required: `title`, `date`, `author`, `layout`, `permalink`, `categories`, `tags`
- The following frontmatter is optional: `draft`, `id`
- You can set `draft: true` to prevent a post from appearing on the generated website
- **Make sure** that the URL in `permalink` begins and ends with a `/`
- You should generate the `date` value in `date` like so: `node -e "console.log(new Date().toISOString())"`
- Many of the newly added files do not fit in with the markup and styling of the original template, and probably won't fit in with the styling and markup of your Wordpress site either. You will need to modify them to look good.
- When making changes to the template, if things suddenly don't work, try running `npm run build` instead of `npm run dev`, as that seems more likely to identify and catch bugs.

# Astro Starter Kit: Blog

*(What follows is the original unmodified README from the [official Astro blog template](https://github.com/withastro/astro/tree/main/packages/create-astro).)*

```
# okTurtles Note: DO NOT DO THIS!
#                 Clone this repo, or download a zipped version of it instead.
#                 Running the command below will install the unmodified version
#                 of the Astro blog template, which doesn't have Wordpress support.
npm create astro@latest -- --template blog
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/blog)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!


![blog](https://user-images.githubusercontent.com/4677417/186189140-4ef17aac-c3c9-4918-a8c2-ce86ba1bb394.png)

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```
├── public/
├── src/
│   ├── components/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Installs dependencies                            |
| `npm run dev`          | Starts local dev server at `localhost:3000`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
