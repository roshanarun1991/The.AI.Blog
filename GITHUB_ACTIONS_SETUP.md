# GitHub Actions Daily Blog Setup

The reliable publishing path is now:

```text
GitHub Actions -> update index.html -> commit to main -> Render auto-deploys
```

## What was added

- `.github/workflows/daily-ai-blog.yml` runs the updater.
- `scripts/daily_ai_blog.py` researches public AI feeds, creates one post, updates counts, and avoids duplicates.

## Schedule

- 21:00 Europe/Stockholm: add today's post.
- 07:00 Europe/Stockholm: fallback check for yesterday.
- Manual: GitHub -> Actions -> Daily AI blog update -> Run workflow.

## Required setup

In GitHub, open the repository `roshanarun1991/The.AI.Blog` and go to:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

Add:

```text
OPENAI_API_KEY
```

Without this secret, the updater still creates a simpler source-backed article from public feeds. With the secret, it writes richer beginner-friendly posts.

Optional repository variable:

```text
OPENAI_MODEL
```

Default: `gpt-4.1-mini`.