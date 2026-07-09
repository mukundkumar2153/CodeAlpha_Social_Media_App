const express = require('express');
const db = require('../db/database');
const { authRequired, authOptional } = require('../middleware/auth');

const router = express.Router();

function getProfile(username, viewerId) {
  const user = db.prepare(
    'SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE username = ?'
  ).get(username);
  if (!user) return null;

  const followerCount = db.prepare('SELECT COUNT(*) c FROM follows WHERE following_id = ?').get(user.id).c;
  const followingCount = db.prepare('SELECT COUNT(*) c FROM follows WHERE follower_id = ?').get(user.id).c;
  const postCount = db.prepare('SELECT COUNT(*) c FROM posts WHERE user_id = ?').get(user.id).c;

  let isFollowing = false;
  if (viewerId) {
    isFollowing = !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
      .get(viewerId, user.id);
  }

  return { ...user, followerCount, followingCount, postCount, isFollowing };
}

// Get a user's profile by username
router.get('/:username', authOptional, (req, res) => {
  const profile = getProfile(req.params.username, req.user && req.user.id);
  if (!profile) return res.status(404).json({ error: 'User not found' });
  res.json(profile);
});

// Update own profile
router.put('/me', authRequired, (req, res) => {
  const { bio, avatar_url } = req.body;
  db.prepare('UPDATE users SET bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url) WHERE id = ?')
    .run(bio, avatar_url, req.user.id);
  const updated = db.prepare('SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  res.json(updated);
});

// Follow a user
router.post('/:username/follow', authRequired, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: "You can't follow yourself" });

  try {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)')
      .run(req.user.id, target.id);
    res.status(201).json({ message: 'Followed successfully' });
  } catch (err) {
    res.status(409).json({ error: 'Already following this user' });
  }
});

// Unfollow a user
router.delete('/:username/follow', authRequired, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?')
    .run(req.user.id, target.id);
  res.json({ message: 'Unfollowed successfully' });
});

// List followers
router.get('/:username/followers', (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const followers = db.prepare(`
    SELECT u.id, u.username, u.avatar_url, u.bio
    FROM follows f JOIN users u ON u.id = f.follower_id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
  `).all(target.id);
  res.json(followers);
});

// List following
router.get('/:username/following', (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE username = ?').get(req.params.username);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const following = db.prepare(`
    SELECT u.id, u.username, u.avatar_url, u.bio
    FROM follows f JOIN users u ON u.id = f.following_id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `).all(target.id);
  res.json(following);
});

module.exports = router;
