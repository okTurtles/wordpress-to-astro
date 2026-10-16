# AGENTS.md

## What this project is

A starter kit that turns an exported WordPress blog into a static Astro site. It is a fork of the official Astro blog template (`create-astro` 1.1.0) with changes that keep the old WordPress URLs and markup. Users clone it, add their own posts, and change it to fit their site. The companion guide is linked in `README.md`.

Stack: Astro 4.5.12 (static output), `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, and remark plugins. There is no client-side JavaScript framework.

## Commands

| Command | Notes |
| --- | --- |
| `npm ci` / `npm install` | Install dependencies. |
| `npm run build` | Build the site into `dist/`. **This is the only check in the project.** Use it to verify every change. The README says it finds bugs that `npm run dev` misses. |
| `npm run dev` (or `npm start`) | Dev server. Astro 4 uses port **4321**. The README table says 3000, which is out of date. |
| `npm run preview` | Serve the built `dist/` folder. |
| `./node_modules/.bin/astro telemetry disable` | Run once to turn off Astro telemetry. You can also set `ASTRO_TELEMETRY_DISABLED=1` for one run. |

The project has no tests, no linter, no formatter, and no type-check script. `@astrojs/check` is not installed, so `astro check` will not work unless you add it.

Expected build noise. You can ignore these:
- `npm warn Unknown project config "shamefully-hoist"`. This comes from `.npmrc`, which is there for pnpm users.
- A Vite warning: "... is dynamically imported by ... but also statically imported by src/pages/rss.xml.js". It appears once for each post. It occurs because the RSS file uses `import.meta.glob` with `eager: true`, and the other pages use `Astro.glob`.

## Layout and data flow

There is no content collection and no data layer. Each page gets posts from the folder directly:

```
src/posts/*.md|mdx  ──Astro.glob──▶ sortedPosts() (src/js/util.js: removes drafts, sorts newest first)
                                     │
   ┌─────────────────────────────────┼──────────────────────────────────────────┐
   ▼                                 ▼                                          ▼
[...wp].astro                 page/[page].astro                 author|category|tag/[slug].astro
route = frontmatter.permalink  paginate(posts, PAGE_SIZE)        one page per urlifyToken(value)
renders only <Content />       → WPArticleSummary                → WPArticleSummary
(the HTML comes from the post's `layout`)
```

- `src/pages/[...wp].astro` creates one page per post at its `permalink`. It renders only `<Content />`. The full HTML page (`<head>`, header, footer, `PostFooter`) comes from the **`layout` frontmatter of the post** (`'../layouts/BlogPost.astro'`). If a post has no `layout`, the page has no `<head>` and no styles.
- `src/pages/rss.xml.js` uses `import.meta.glob('../posts/**/*.{md,mdx}')`. This pattern is **recursive**. All other pages use the non-recursive `'../posts/*.{md,mdx}'`. A post in a subfolder will appear in the RSS feed, but it will have no page.
- The `Astro.glob` path is relative to the file that calls it. Files in `src/pages/` and `src/components/` use `'../posts/...'`. Files in `src/pages/<sub>/` use `'../../posts/...'`.
- `src/config.ts` contains `SITE_TITLE`, `SITE_DESCRIPTION`, and `PAGE_SIZE`. The `site` value in `astro.config.mjs` (now `https://example.com`) sets the absolute URLs for RSS, the sitemap, and `og:url`.
- `src/components/WPArticleSummary.astro` shows a post in a list in one of two ways. If `articlePreview` is set and the HTML contains `<!--more-->`, it shows the HTML before that marker and a "Continue reading" link. If not, it removes the HTML tags and shows the first `maxWords` words (46 by default).
- The markup uses WordPress theme class names (`entry-*`, `nav-below`, `widget`, `clear-fix`, `alignleft`, and others). `src/styles/global.css` (from Bear Blog) has **no** rules for these classes. They are there so users can add CSS from their WordPress theme.

### Which pages are template leftovers

- `src/pages/index.astro` (`/`) is still the welcome text from the template. It does not list posts. The list of posts with pages is at `/page/1/`, `/page/2/`, and so on.
- `src/pages/blog.astro` (`/blog`) shows the newest `PAGE_SIZE` posts. It links to `/page/2/` with a fixed URL. It sorts the posts itself and does **not** use `sortedPosts`, so **draft posts appear in this list** (verified). A user might expect drafts to be hidden.
- `src/components/Sidebar.astro` is not used. It is commented out in `page/[page].astro`. `Search.astro` does not work. It is only a placeholder form. The commented-out import in Sidebar uses `@components/...`, but that alias does not exist. Only `@/` exists.
- `src/pages/about.md` uses `BlogPost.astro` but has no `author` or `permalink`. Because of this, its `PostFooter` shows "View all posts by undefined" and a link with no `href`.

## Post frontmatter rules

The README says these fields are required: `title`, `date`, `author`, `layout`, `permalink`, `categories`, `tags`. These fields are optional: `draft`, `id`. Things the code expects that are not easy to see:

- `permalink` **must start and end with `/`**. `[...wp].astro` removes one character from each end with `.slice(1).slice(0, -1)`. It does not check the value.
- `author` is strictly required. If one post has no `author`, the whole build stops with `Cannot read properties of undefined (reading 'toLowerCase')` from `urlifyToken` in `author/[slug].astro` (verified).
- `date` is an ISO string. The README suggests `node -e "console.log(new Date().toISOString())"` to make one.
- `layout` is a path relative to the post file. For posts in `src/posts/`, it is `'../layouts/BlogPost.astro'`.
- `draft: true` removes the post from all pages that use `sortedPosts`. That is all pages except `/blog` (see above).

## Gotchas

- **`.mdx` posts break the build.** The glob patterns accept `.mdx`, but `WPArticleSummary.astro` and `rss.xml.js` call `post.compiledContent()`. MDX modules do not have this function. The build stops with `page.compiledContent is not a function` (verified). Use `.md` for posts, or change those two files first.
- **Slugs are simple.** `urlifyToken` only makes the text lowercase and changes spaces to `-`. For example, "News & Events" becomes `/category/news-&-events/`. This might not match the WordPress slug. Two names that differ only in letter case become the same page. The archive page title uses the original text from the first matching post.
- **The output depends on the build machine.** Dates and times use `toLocaleDateString(undefined, ...)` and `toLocaleTimeString(undefined, ...)`. Thus the build machine's locale and time zone control the text that is shown. (The `blog.astro` list is different. It uses `'en-us'`.)
- **Embeds need network access at build time.** The `@remark-embedder` plugin in `astro.config.mjs` looks at each paragraph that contains only a URL. When it finds one, it downloads `https://oembed.com/providers.json` and the oEmbed data. The cache is in `node_modules/.cache/@remark-embedder/transformer-oembed/fetch`. The custom `handleError` handles only Twitter URLs. For those, it shows a red error paragraph. Embed errors for any other URL stop the build.
- Remark plugin order is `[remarkEmbedPlugin, remarkGfm, remarkBreaks]`. `remark-breaks` changes each single newline into `<br>`. This is intentional, because WordPress exports use this format.
- `/page/1/` is built in addition to `/`. Both exist.
- Do not upgrade Astro without care. The code uses `Astro.glob`, the markdown `layout` frontmatter on imported posts, and `compiledContent()`. These all work in Astro 4, but later major versions removed or changed them.
- `public/wp-content/` is where users copy their mirrored WordPress uploads. The folder is not in the repository. Post HTML links to `/wp-content/uploads/...`.

## Conventions

- **Imports:** Use the `@/` alias (`tsconfig.json` maps `@/*` to `src/*`) in new or WordPress-specific files, for example `import { sortedPosts } from '@/js/util.js'`. Files from the original template still use relative imports. Both work.
- **Two code styles exist:**
  - Files from the original template (`BaseHead`, `Header`, `HeaderLink`, `Footer`, `BlogPost`, `index.astro`, `blog.astro`) use tabs and mostly use semicolons.
  - WordPress-specific files (`[...wp].astro`, `page/`, `author/`, `category/`, `tag/`, `WPArticleSummary`, `PostFooter`, `Sidebar`, `util.js`, `rss.xml.js`) use 2-space indent, single quotes, no semicolons, and a space before function parentheses (`function GET (context)`).
  - Use the style of the file that you edit.
- Shared helpers go in `src/js/util.js` (plain JS, not TS). Page-level data comes from `getStaticPaths()` and goes to the page through `props`.
- Archive pages (`author`, `category`, `tag`) are almost the same. If you change one, you will probably need to change all three. They also import `Debug` from `astro/components` but do not use it.
- `.npmrc` has `save-exact = true`. Dependencies use exact versions with no `^`. Keep this when you add packages.
- This project is a template that users copy. Text such as "CHANGE THIS", "YOUR NAME HERE", and `your-social-link` is a placeholder on purpose. Do not fill it in unless the user asks.

## How to verify a change

1. Run `npm run build`. It must finish with `[build] Complete!`.
2. Look at the files in `dist/`. For example, check that `dist/<permalink>/index.html` exists and has a `<head>`, and check `dist/rss.xml` and `dist/sitemap-index.xml`.
3. To test special cases, add a temporary post to `src/posts/` and run the build again. Delete the post when you finish.
