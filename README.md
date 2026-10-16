# Wordpress → Astro Converstion Kit

You can clone/copy and modify this repo to your liking.

Your markdown-exported Wordpress blog posts should be placed in: `src/posts/`

Please see this blog for details:

👉 **[How to Convert a Wordpress blog to Astro Static Site Generator](https://blog.okturtles.org/2024/10/convert-wordpress-to-static-site/)**

## How to use this project

1. Follow the instructions in the [companion blog post](https://blog.okturtles.org/2024/10/convert-wordpress-to-static-site/) to export your Wordpress posts and content.
2. Clone or copy this project.
3. Place your markdown-ified Wordpress posts in `src/posts` (subfolders work too).
4. Place your mirrored `wp-content` folder in `public/`. The most important subfolder of this is `wp-content/uploads`, which contains your pictures. You might or might not need the rest.
5. Install project dependencies by running `npm install`. You need Node.js `22.22.0` or newer (Astro 7 requires it).
6. Disable Astro telemetry: `./node_modules/.bin/astro telemetry disable` (this only needs to be done once)
7. Run `npm run build` to generate site in `dist/` and check for errors
8. Run `npm run dev` to serve the site locally and monitor files for changes. You can make any modifications as needed to the files under `src/` so that your blog looks and behaves the way you'd like it
9. Don't forget to update files `astro.config.mjs` and `config.ts` with values that are relevant to your website!

When you run `npm run build`, your website will be saved to the `dist/` folder. How you'd like to deploy it then is up to you. There are [many options](https://docs.astro.build/en/guides/deploy/).

Finally, there are some things to keep in mind:

- The following frontmatter is required: `title`, `date`, `author`, `permalink`, `categories`, `tags`
- The following frontmatter is optional: `layout`, `draft`, `id`
- You can set `draft: true` to prevent a post from appearing on the generated website
- **Make sure** that the URL in `permalink` begins and ends with a `/`
- You should generate the `date` value in `date` like so: `node -e "console.log(new Date().toISOString())"`
- `layout` is a path relative to the post file, and it must point to a file in `src/layouts/`. For a post in `src/posts/`, it is `'../layouts/BlogPost.astro'`. For a post in `src/posts/sub/`, it is `'../../layouts/BlogPost.astro'`. A post without `layout` uses `src/layouts/BlogPost.astro`.
- `.mdx` posts work too, with these differences:
  - Do not set `layout` in an `.mdx` post. The build stops with an error. `.mdx` posts always use `src/layouts/BlogPost.astro`.
  - Write the "more" marker as `<Fragment set:html="<!--more-->" />`. A plain `<!--more-->` is a syntax error in MDX.
  - The list pages and the RSS feed get the HTML of `.mdx` posts from Astro's experimental [Container API](https://docs.astro.build/en/reference/container-reference/). A future Astro upgrade can break this. `.md` posts do not use it.
  - The post previews on the list pages and in the RSS feed do not have the CSS of the components that you use in an `.mdx` post. The post page has it.
- A paragraph that contains only the URL of an [oEmbed](https://oembed.com/) provider (for example YouTube or Twitter) becomes an embed. The build downloads the embed data, so it needs internet access. Astro caches `.md` posts, so a build downloads embeds only for new or changed `.md` posts (a change to `astro.config.mjs` clears this cache). `.mdx` posts download their embeds on every build. If an embed fails, the build stops, except for Twitter links: these show a red error message instead.
- Many of the newly added files do not fit in with the markup and styling of the original template, and probably won't fit in with the styling and markup of your Wordpress site either. You will need to modify them to look good.
- When making changes to the template, if things suddenly don't work, try running `npm run build` instead of `npm run dev`, as that seems more likely to identify and catch bugs.

## How this project differs from the official template:

This project is fork of version `1.1.0` of the [`create-astro`](https://github.com/withastro/astro/tree/main/packages/create-astro) project. It has since been upgraded to Astro 7.

The following differences exist:

- Wordpress-specific modifications:
  - Posts:
    - `src/content.config.js`: all `.md` and `.mdx` files in `src/posts/` and its subfolders make up the `posts` [content collection](https://docs.astro.build/en/guides/content-collections/)
    - `src/js/util.js`: `getPosts()` returns the posts without drafts, newest first. `postHTML()` returns the HTML of a post (`.md` or `.mdx`). All pages and the RSS feed get their posts from these two functions.
  - URL preservation:
    - `src/pages/[...wp].astro`: preserves original wordpress permalinks for posts, as defined by the frontmatter `permalink`. It also applies the `layout` of the post.
    - `src/pages/author/[slug].astro`: wordpress-URL for listing posts for specific author
    - `src/pages/category/[slug].astro`: wordpress-URL for listing posts for specific category
    - `src/pages/tag/[slug].astro`: wordpress-URL for listing posts for specific tag
    - `src/pages/page/[page].astro`: wordpress-URL pagination support for listing all of your posts (`/page/1/`, `/page/2/`, and so on). The homepage (`src/pages/index.astro`) still shows the welcome text of the template.
    - The orignal template's `src/pages/blog/` folder has been removed. Posts now go in `src/posts/`
  - Components:
    - `src/components/WPArticleSummary.astro`: shows a post in the lists of posts in one of two ways: the text before the `<!--more-->` marker, or the first words of the post if it has no marker
    - `src/components/PostFooter.astro`: optional footer under posts to link to related categories, tags, etc.
    - `src/components/Sidebar.astro`: sidebar widgets to list categories and recent posts (not used by default)
    - `src/components/Search.astro`: non-functioning search widget. Feel free to [implement it](https://gomakethings.com/how-to-create-a-search-page-for-a-static-website-with-vanilla-js/) and send a PR!
- Added the following dependencies:
  - `@astrojs/markdown-remark`: its `unified()` Markdown processor (set in `astro.config.mjs`) runs the remark plugins below. Astro 7's default Markdown processor ignores remark plugins and shows no error.
  - `remark-breaks`: better newline handling in markdown files
  - `remark-gfm`: support for rendering tables in markdown files
  - `@remark-embedder/core` & `@remark-embedder/transformer-oembed`: support for rendering Twitter and YouTube links as embeds
- `src/pages/rss.xml.js`: an RSS feed with the first 100 words or so of each post and a "Read more" link. Drafts are not in the feed.
- `astro.config.mjs` sets `compressHTML: true`. It keeps the whitespace between HTML elements. Astro 7's default removes it, and then for example the links in the post footer run together.
- Added support for `@` in imports to make it easy to import files without using `../../../` etc.
- Added `PAGE_SIZE` config variable to `src/config.ts`
- `.npmrc` now uses `save-exact = true`

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
| `npm run dev`          | Starts local dev server at `localhost:4321`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `npm run astro --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
