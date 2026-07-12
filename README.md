# CodeAlpha Social Media Platform

A full-stack mini social media app built for the CodeAlpha Full Stack Development internship (Task 2).

**Stack:** Node.js + Express (backend) · Supabase / Postgres (database) · HTML, CSS, vanilla JS (frontend)

## Features

- User registration & login (JWT + bcrypt)
- User profiles with bio and stats (posts / followers / following)
- Create posts: text-only, image, or embedded video (YouTube/Instagram embed links)
- Like / unlike posts
- Comment on posts
- Follow / unfollow users
- Home feed (posts from people you follow) + Explore grid (everyone's posts)
- Seed script that fills the database with sample users, posts, comments and randomized like counts, so the app doesn't look empty on first run

## Project structure

```
CodeAlpha_SocialMediaApp/
├── backend/
│   ├── config/supabase.js       Supabase client setup
│   ├── middleware/auth.js       JWT auth middleware
│   ├── routes/                  auth, users, posts, comments, likes, follows
│   ├── db/schema.sql            run this in Supabase SQL editor
│   ├── db/seed.js               populates sample data
│   ├── server.js                Express app entry point
│   └── .env.example             copy to .env and fill in your keys
└── frontend/
    ├── index.html                login / register
    ├── feed.html                 home feed
    ├── explore.html               discover grid
    ├── profile.html               user profile
    ├── post.html                  single post + comments
    ├── create.html                create a post
    ├── css/style.css
    └── js/                        api.js, auth.js, feed.js, explore.js, profile.js, post.js, create.js, postcard.js, nav.js
```

## Setup steps

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com), create a new project, and wait for it to finish provisioning.

### 2. Run the schema
Open **Supabase Dashboard → SQL Editor → New query**, paste the contents of `backend/db/schema.sql`, and run it. This creates the `users`, `posts`, `comments`, `likes`, and `follows` tables.

### 3. Get your API keys
In **Project Settings → API**, copy:
- Project URL
- `service_role` key (not the anon key — the backend needs elevated access)

### 4. Configure environment variables
```bash
cd backend
cp .env.example .env
```
Open `.env` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and set your own `JWT_SECRET` (any long random string).

### 5. Install dependencies
```bash
npm install
```

### 6. Seed sample data (optional but recommended)
```bash
npm run seed
```
This creates 8 sample users (all with password `password123`), ~18 posts with titles/descriptions, comments on some of them, and randomized like counts (some 10-15, some in the thousands).

**Important:** the seed script leaves `media_url` blank on every post. To add real images or videos:
1. Go to **Supabase Dashboard → Table editor → posts**
2. Find the row you want
3. Paste your image URL or YouTube/Instagram embed URL into the `media_url` column
4. Make sure `media_type` matches (`image` or `embed`)

For embed URLs, use the actual embed link, not the normal share link — e.g. for YouTube:
`https://www.youtube.com/embed/VIDEO_ID` (not `https://www.youtube.com/watch?v=VIDEO_ID`)

### 7. Run the server
```bash
npm start
```
Then open `http://localhost:5000` in your browser.

## Notes

- Passwords are hashed with bcrypt before storage — never stored in plain text.
- JWT tokens are valid for 7 days and stored in the browser's localStorage.
- The `likes` table tracks who liked what (so a real logged-in user can only like a post once); the `likes_count` column on `posts` is what's displayed and is what the seed script randomizes.
- This project satisfies CodeAlpha Task 2 requirements: user profiles, posts & comments, and a like/follow system, backed by a real database.
