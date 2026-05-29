git clone https://github.com/roshanarun1991/The.AI.Blog.git
cd The.AI.Blog



# The.AI.blog

Static AI trends blog by Roshan Arun.

Live link text convention:

[The.AI.Blog](https://the-ai-blog-0ltv.onrender.com/)

For social media, paste the raw URL instead of Markdown:

`https://the-ai-blog-0ltv.onrender.com/`

The site includes Open Graph and Twitter metadata so social previews can show `The.AI.Blog`.

## Local preview

Open `index.html` directly or serve the folder with any static file server.

## Render deployment

This repo includes `render.yaml` for a Render static site.

- Service name: `the-ai-blog`
- Static publish path: `.`
- Build command: none
- Render URL: `https://the-ai-blog-0ltv.onrender.com/`

In Render, create a new Blueprint or Static Site from:

`https://github.com/roshanarun1991/The.AI.Blog`

## Daily updates

Daily posts should be added as expandable blog rows inside the `DAILY_POSTS_START` and `DAILY_POSTS_END` markers in `index.html`.

Each post should include:

- Date
- Clear title
- Practical AI trend summary
- Useful public GitHub links when relevant
- Credit to original tool/project owners

The homepage is split into tabs:

- Blog: daily trend posts
- Projects: B2B/B2C project ideas
- GitHub: public repositories
- Resources: official learning links and credits
