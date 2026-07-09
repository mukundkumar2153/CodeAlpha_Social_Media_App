# 🌊 Ripple — Mini Social Media App

A full-stack mini social media platform with user profiles, posts, comments, likes, and a follow system.

**Stack:** Express.js + SQLite (backend) · HTML/CSS/vanilla JS (frontend) · JWT auth

---

## Features

- **Auth** — register/login with hashed passwords (bcrypt) + JWT sessions
- **Profiles** — bio, avatar initials, follower/following/post counts, editable bio
- **Posts** — create/delete text posts with optional image URL
- **Comments** — add comments to any post, delete your own
- **Likes** — like/unlike posts, live like counts
- **Follow system** — follow/unfollow users, "Following" feed vs. global "Explore" feed

---

## Project Structure

```
social-app/
├── backend/
│   ├── server.js            # Express app entry point
│   ├── db/
│   │   └── database.js      # SQLite schema + connection
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js          # /api/auth (register, login)
│   │   ├── users.js         # /api/users (profiles, follow)
│   │   └── posts.js         # /api/posts (posts, comments, likes)
│   └── package.json
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## Setup

### 1. Backend

```bash
cd backend
npm install
npm start
```

Server runs at `http://localhost:5000`. SQLite database file (`social.db`) is created automatically on first run — no separate DB setup needed.

Optional: set a custom JWT secret via environment variable:
```bash
JWT_SECRET=your-secret-here npm start
```

### 2. Frontend

The frontend is plain static files — no build step. Just open `frontend/index.html` in a browser, or serve it:

```bash
cd frontend
npx serve -l 3000
```

Then visit `http://localhost:3000`. Make sure the backend is running on port 5000 (or edit `API_BASE` in `app.js` if you change the port).

---

## API Reference

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | `{ username, email, password, bio? }` → user + token |
| POST | `/api/auth/login` | `{ username, password }` → user + token |

### Users
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/users/:username` | optional | Get profile + stats |
| PUT | `/api/users/me` | required | Update `{ bio, avatar_url }` |
| POST | `/api/users/:username/follow` | required | Follow a user |
| DELETE | `/api/users/:username/follow` | required | Unfollow a user |
| GET | `/api/users/:username/followers` | — | List followers |
| GET | `/api/users/:username/following` | — | List who they follow |

### Posts
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | optional | Global feed (all posts) |
| GET | `/api/posts/feed` | required | Personalized feed (following + self) |
| GET | `/api/posts/:id` | optional | Single post |
| POST | `/api/posts` | required | Create `{ content, image_url? }` |
| DELETE | `/api/posts/:id` | required | Delete own post |
| POST | `/api/posts/:id/like` | required | Like a post |
| DELETE | `/api/posts/:id/like` | required | Unlike a post |
| GET | `/api/posts/:id/comments` | — | List comments |
| POST | `/api/posts/:id/comments` | required | Add `{ content }` |
| DELETE | `/api/posts/comments/:commentId` | required | Delete own comment |

All authenticated routes expect `Authorization: Bearer <token>`.

---

## Database Schema

- **users**: id, username, email, password_hash, bio, avatar_url, created_at
- **posts**: id, user_id, content, image_url, created_at
- **comments**: id, post_id, user_id, content, created_at
- **likes**: id, post_id, user_id, created_at (unique per post+user)
- **follows**: id, follower_id, following_id, created_at (unique per pair)

Foreign keys cascade on delete (deleting a user removes their posts/comments/likes/follows).

---

## Notes for extending

- Swap SQLite for Postgres/MySQL by changing `db/database.js` — the query style (`better-sqlite3`'s `.prepare().get()/.all()/.run()`) would need a client-specific adapter, but the schema translates directly.
- Add image upload (vs. URL) with `multer` + local/S3 storage.
- Add pagination to `/api/posts` and `/api/posts/feed` (currently capped at 100).
- Password reset, email verification, and rate limiting are not implemented — add before any real deployment.
