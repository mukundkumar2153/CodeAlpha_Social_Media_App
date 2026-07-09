const express = require('express');
const db = require('../db/database');
const { authRequired, authOptional } = require('../middleware/auth');

const router = express.Router();

function enrichPost(post, viewerId) {
  const author = db.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?').get(post.user_id);
  const likeCount = db.prepare('SELECT COUNT(*) c FROM likes WHERE post_id = ?').get(post.id).c;
  const commentCount = db.prepare('SELECT COUNT(*) c FROM comments WHERE post_id = ?').get(post.id).c;
  let likedByMe = false;
  if (viewerId) {
    likedByMe = !!db.prepare('SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, viewerId);
  }
  return { ...post, author, likeCount, commentCount, likedByMe };
}

// Global feed (all posts, newest first)
router.get('/', authOptional, (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 100').all();
  res.json(posts.map(p => enrichPost(p, req.user && req.user.id)));
});

// Personalized feed: posts from people you follow + your own
router.get('/feed', authRequired, (req, res) => {
  const posts = db.prepare(`
    SELECT p.* FROM posts p
    WHERE p.user_id = ?
       OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
    ORDER BY p.created_at DESC
    LIMIT 100
  `).all(req.user.id, req.user.id);
  res.json(posts.map(p => enrichPost(p, req.user.id)));
});

// Get single post
router.get('/:id', authOptional, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(enrichPost(post, req.user && req.user.id));
});

// Create post
router.post('/', authRequired, (req, res) => {
  const { content, image_url } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content is required' });
  }
  const info = db.prepare('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)')
    .run(req.user.id, content.trim(), image_url || '');
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(enrichPost(post, req.user.id));
});

// Delete post (owner only)
router.delete('/:id', authRequired, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post deleted' });
});

// Like a post
router.post('/:id/like', authRequired, (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  try {
    db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id);
    res.status(201).json({ message: 'Liked' });
  } catch {
    res.status(409).json({ error: 'Already liked' });
  }
});

// Unlike a post
router.delete('/:id/like', authRequired, (req, res) => {
  db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Unliked' });
});

// Get comments for a post
router.get('/:id/comments', (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar_url
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);
  res.json(comments);
});

// Add comment to a post
router.post('/:id/comments', authRequired, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment content is required' });

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const info = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, content.trim());

  const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar_url
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(comment);
});

// Delete a comment (owner only)
router.delete('/comments/:commentId', authRequired, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Not your comment' });

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
  res.json({ message: 'Comment deleted' });
});

module.exports = router;
