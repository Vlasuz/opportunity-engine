# Opportunity Engine

Read-only SaaS opportunity research dashboard. It searches public Reddit discussions, groups recurring problems, and keeps links to the original posts for validation.

## Features

- Reddit OAuth search by keyword and optional subreddit
- Up to 100 public posts per research run
- Problem clustering with source excerpts and permalinks
- No posting, voting, messaging, user profiling, or automated outreach
- Responsive Next.js dashboard

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure these environment variables:

```env
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=web:opportunity-engine:1.0 (by /u/your_username)
```

Create the credentials under Reddit's app preferences. Use a unique and descriptive user agent.

## Deploy to Vercel

1. Import this repository in Vercel.
2. Add the three Reddit environment variables for Production, Preview, and Development.
3. Deploy using the automatically detected Next.js preset.

## Reddit data use

The app reads public posts through Reddit's official OAuth Data API and displays links to original sources. It does not train a model on Reddit content, contact users, or perform actions on their behalf.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, and the Reddit OAuth Data API.
