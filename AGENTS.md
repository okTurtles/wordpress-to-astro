# AGENTS.md

## What this project is

A starter kit that turns an exported WordPress blog into a static Astro site. It is a fork of the official Astro blog template (`create-astro` 1.1.0) with changes that keep the old WordPress URLs and markup. Users clone it, add their own posts, and change it to fit their site. The companion guide is linked in `README.md`.

Stack: Astro 7.4.0 (static output, needs Node `>=22.22.0`), `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, `@astrojs/markdown-remark`, and remark plugins. There is no client-side JavaScript framework.

## Commands

| Command | Notes |
| --- | --- |
| `npm ci` / `npm install` | Install dependencies. |
| `npm run build` | Build the site into `dist/`. **This is the only check in the project.** Use it to verify every change. The README says it finds bugs that `npm run dev` misses. |
| `npm run dev` (or `npm start`) | Dev server on port **4321**. In a non-interactive shell (for example an agent's shell), Astro 7 starts the server in the background and the command exits. Stop it with `npx astro dev stop` (logs: `npx astro dev logs`). |
| `npm run preview` | Serve the built `dist/` folder. |
| `./node_modules/.bin/astro telemetry disable` | Run once to turn off Astro telemetry. You can also set `ASTRO_TELEMETRY_DISABLED=1` for one run. |

The project has no tests, no linter, no formatter, and no type-check script. `@astrojs/check` is not installed, so `astro check` will not work unless you add it.

Expected build noise. You can ignore these:
- `npm warn Unknown project config "shamefully-hoist"`. This comes from `.npmrc`, which is there for pnpm users.

## Layout and data flow

All posts come from one content collection. Pages never read `src/posts/` directly:

```
src/posts/**/*.md|mdx ──glob loader (src/content.config.js)──▶ collection `posts`
                                     │
                     getPosts() (src/js/util.js: getCollection('posts') → sortedPosts():
                                     │          removes drafts, sorts newest first)
   ┌─────────────────────────────────┼──────────────────────────────────┬────────────────────────┐
   ▼                                 ▼                                  ▼                        ▼
[...wp].astro                 page/[page].astro              author|category|tag/[slug]   rss.xml.js
route = data.permalink         paginate(posts, PAGE_SIZE)     one page per urlifyToken()   summary of
<Layout><Content /></Layout>   → WPArticleSummary             → WPArticleSummary           postHTML(post)
```

- `src/content.config.js` defines the `posts` collection with the `glob` loader (`**/*.{md,mdx}` in `./src/posts`). The pattern is recursive, so posts in subfolders get a page too. There is no schema, so `post.data` is the raw frontmatter (`date` stays a string).
- Every page, component, and the RSS feed gets posts from `getPosts()` and reads frontmatter from `post.data`. `getPosts()` also stops with an error that names the file if a post that is not a draft is an `.mdx` post that sets `layout`. The reason: `@astrojs/mdx` applies the `layout` of an `.mdx` file by itself, so the post page would get the layout two times, and `postHTML()` (lists, RSS) would return a full HTML page. Every page calls `getPosts()`, so `astro build` stops, and in `astro dev` every page (not only the post page) returns 500 with the error in the log (verified). `postHTML(post)` (async) returns the post's HTML as a string. `WPArticleSummary.astro` and `rss.xml.js` use it. For `.md` posts without local images it is `post.rendered.html`. `.mdx` posts have no `rendered` field, and `.md` posts with local images (`post.rendered.metadata.imagePaths`, see "Relative Markdown images" below) have only image placeholders in it. For these two cases, `postHTML()` calls `render(post)` and renders the `Content` component to a string with Astro's experimental Container API (`experimental_AstroContainer` from `astro/container`, `loadRenderers` from `astro:container`, `getContainerRenderer` from `@astrojs/mdx/container-renderer`). It creates one container and caches the HTML per `post.id`. It renders the post again when `post.digest` changes.
- `src/pages/[...wp].astro` creates one page per post at its `permalink`. Content collections ignore the `layout` frontmatter of `.md` posts, so this page applies the layout itself. It resolves `post.data.layout` relative to `post.filePath` (for example `src/posts/sub/x.md` + `'../../layouts/BlogPost.astro'`) and looks it up in `import.meta.glob('/src/layouts/**/*.astro')`. No `layout` gives `BlogPost.astro`. A `layout` that is not found stops the build with an error that names the post and the layout (verified). The layout gets `frontmatter={post.data}`, which `BlogPost.astro` reads. `.mdx` posts never get here with a `layout`, because `getPosts()` stops first (see above).
- Generated files: `.astro/` (types, gitignored; `tsconfig.json` includes `.astro/types.d.ts`, and there is no `src/env.d.ts`) and `node_modules/.astro/data-store.json` (the content store, see "Embeds" below).
- `src/config.ts` contains `SITE_TITLE`, `SITE_DESCRIPTION`, and `PAGE_SIZE`. The `site` value in `astro.config.mjs` (now `https://example.com`) sets the absolute URLs for RSS, the sitemap, and `og:url`.
- `src/components/WPArticleSummary.astro` shows a post in a list in one of two ways. If `articlePreview` is set and the HTML contains `<!--more-->`, it shows the HTML before that marker and a "Continue reading" link. If not, it removes the HTML tags and shows the first `maxWords` words (46 by default).
- The markup uses WordPress theme class names (`entry-*`, `nav-below`, `widget`, `clear-fix`, `alignleft`, and others). `src/styles/global.css` (from Bear Blog) has **no** rules for these classes. They are there so users can add CSS from their WordPress theme.

### Which pages are template leftovers

- `src/pages/index.astro` (`/`) is still the welcome text from the template. It does not list posts. The list of posts with pages is at `/page/1/`, `/page/2/`, and so on.
- `src/pages/blog.astro` (`/blog`) shows the newest `PAGE_SIZE` posts from `getPosts()` (drafts hidden). It links to `/page/2/` with a fixed URL.
- `src/components/Sidebar.astro` is not used. It is commented out in `page/[page].astro`. `Search.astro` does not work. It is only a placeholder form. The commented-out import in Sidebar uses `@components/...`, but that alias does not exist. Only `@/` exists.
- `src/pages/about.md` uses `BlogPost.astro` but has no `author` or `permalink`. Because of this, its `PostFooter` shows "View all posts by undefined" and a link with no `href`.

## Post frontmatter rules

The README lists these fields as required: `title`, `date`, `author`, `permalink`, `categories`, `tags`. It lists these fields as optional: `layout`, `draft`, `id`. Things the code expects that are not easy to see:

- `permalink` **must start and end with `/`**. `[...wp].astro` removes one character from each end with `.slice(1).slice(0, -1)`. It does not check the value.
- `author` is strictly required. If one post has no `author`, the whole build stops with `Cannot read properties of undefined (reading 'toLowerCase')` from `urlifyToken` in `author/[slug].astro` (verified on Astro 7).
- `date` is an ISO string. The README suggests `node -e "console.log(new Date().toISOString())"` to make one.
- `layout` is optional. If it is set, it is a path relative to the post file and must point to a file in `src/layouts/`. For posts in `src/posts/`, it is `'../layouts/BlogPost.astro'`. `.mdx` posts must not set `layout` (build error, see above). They always use `BlogPost.astro`.
- `draft: true` removes the post from all pages and from the RSS feed (all of them use `getPosts()`).

## Gotchas

- **`.mdx` posts** work on the post page, in lists, in archive pages, and in RSS (verified in `astro build` and `astro dev`). Things to know:
  - Write the more-marker as `<Fragment set:html="<!--more-->" />`. A plain `<!--more-->` is an MDX syntax error.
  - Lists and RSS use the Container API output (see `postHTML()`). That HTML has no component CSS. A component with a `<style>` block looks correct on the post page, but its CSS is not on `/page/N/` (verified).
  - The Container API is experimental. An Astro upgrade can break `.mdx` rendering. `.md` posts use it only if they have local images (see the next item).
- **Relative Markdown images.** Astro processes a Markdown image with a relative path, for example `![a dot](./images/dot.png)` in an `.md` post (it becomes `/_astro/dot.<hash>.webp`). Paths that start with `/` (such as `/wp-content/uploads/...`) and URLs are not processed (`astro.config.mjs` sets no `image.domains`). For a processed image, `post.rendered.html` has only `<img __ASTRO_IMAGE_="...">` with no `src` or `alt`, and only `render()` replaces it. This is why `postHTML()` sends these posts through the Container API. Without that, the `/page/N/` preview and RSS show a broken image while the post page looks correct (verified).
- **Slugs are simple.** `urlifyToken` only makes the text lowercase and changes spaces to `-`. For example, "News & Events" becomes `/category/news-&-events/`. This might not match the WordPress slug. Two names that differ only in letter case become the same page. The archive page title uses the original text from the first matching post.
- **The output depends on the build machine.** Dates and times use `toLocaleDateString(undefined, ...)` and `toLocaleTimeString(undefined, ...)`. Thus the build machine's locale and time zone control the text that is shown. (The `blog.astro` list is different. It uses `'en-us'`.)
- **Embeds need network access when a post is rendered.** The `@remark-embedder` plugin in `astro.config.mjs` looks at each paragraph that contains only a URL. When it finds one, it downloads `https://oembed.com/providers.json` and the oEmbed data. The plugin has no cache of its own (`@remark-embedder/transformer-oembed` 3.0.0 creates its fetch cache but does not use it). Astro caches the rendered Markdown in its content store (`node_modules/.astro/data-store.json`), so a build fetches embeds only for new or changed `.md` posts. A change to `astro.config.mjs` clears the store ("Clearing content store" in the log), and the next build renders every post again. `.mdx` posts are not in the store: Vite compiles them in every build, so every build fetches their embeds again (verified). The custom `handleError` handles only Twitter URLs. For those, it shows a red error paragraph. Embed errors for any other URL stop the build.
- **Remark plugins need the `unified()` processor.** `astro.config.mjs` sets `markdown.processor: unified({ remarkPlugins: [remarkEmbedPlugin, remarkGfm, remarkBreaks] })` (`unified` from `@astrojs/markdown-remark`). Astro 7's default Markdown processor ignores remark plugins **without an error**, so tables, line breaks, and embeds would silently stop working. Keep the plugin order. `remark-breaks` changes each single newline into `<br>`. This is intentional, because WordPress exports use this format. `@astrojs/mdx` uses the same processor for `.mdx` files (it inherits `markdown.processor`), so the plugins also run there (verified).
- **`compressHTML: true` is intentional.** Astro 7's default (`'jsx'`) removes the whitespace between elements. Without this setting, the date, category, tag, and author links in `PostFooter` run together.
- `/page/1/` is built in addition to `/`. Both exist.
- Upgrade Astro with care. The code needs Astro 7 APIs: the content layer `glob` loader, `post.rendered.html` and `post.rendered.metadata.imagePaths`, `markdown.processor`, and the experimental Container API for `.mdx` posts and `.md` posts with local images (see `postHTML()`). `Astro.glob()` and `compiledContent()` no longer exist; do not use them. After an upgrade, check the `unified()` and `compressHTML` notes above against the new defaults, and build an `.mdx` post with a `<!--more-->` marker and an `.md` post with a relative image before its `<!--more-->` marker. Check that `/page/1/` and `rss.xml` contain no `__ASTRO_IMAGE_`.
- `public/wp-content/` is where users copy their mirrored WordPress uploads. The folder is not in the repository. Post HTML links to `/wp-content/uploads/...`.

## Conventions

- **Imports:** Use the `@/` alias (`tsconfig.json` maps `@/*` to `src/*`) in new or WordPress-specific files, for example `import { getPosts } from '@/js/util.js'`. Files from the original template still use relative imports. Both work.
- **Two code styles exist:**
  - Files from the original template (`BaseHead`, `Header`, `HeaderLink`, `Footer`, `BlogPost`, `index.astro`, `blog.astro`) use tabs and mostly use semicolons.
  - WordPress-specific files (`[...wp].astro`, `page/`, `author/`, `category/`, `tag/`, `WPArticleSummary`, `PostFooter`, `Sidebar`, `util.js`, `rss.xml.js`, `content.config.js`) use 2-space indent, single quotes, no semicolons, and a space before function parentheses (`function GET (context)`).
  - Use the style of the file that you edit.
- Shared helpers go in `src/js/util.js` (plain JS, not TS). Get posts with `getPosts()` and post HTML with `postHTML()`. Do not call `getCollection()` in pages. Page-level data comes from `getStaticPaths()` and goes to the page through `props`.
- Archive pages (`author`, `category`, `tag`) are almost the same. If you change one, you will probably need to change all three. They also import `Debug` from `astro/components` but do not use it.
- `.npmrc` has `save-exact = true`. Dependencies use exact versions with no `^`. Keep this when you add packages.
- `README.md` is the documentation for users. Its "things to keep in mind" list explains the post rules (frontmatter, `layout`, `.mdx`, relative images, embeds), and its "How this project differs" list describes the WordPress-specific files and settings. If you change one of these, update the README too.
- This project is a template that users copy. Text such as "CHANGE THIS", "YOUR NAME HERE", and `your-social-link` is a placeholder on purpose. Do not fill it in unless the user asks.

## How to verify a change

1. Run `npm run build`. It must finish with `[build] Complete!`.
2. Look at the files in `dist/`. For example, check that `dist/<permalink>/index.html` exists and has a `<head>`, and check `dist/rss.xml` and `dist/sitemap-index.xml`.
3. To test special cases, add a temporary post to `src/posts/` and run the build again. Delete the post when you finish.
