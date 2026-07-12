const express = require('express');
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/comments/:postId - list comments on a post
router.get('/:postId', async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', req.params.postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const userIds = [...new Set(comments.map(c => c.user_id))];
    const { data: authors } = await supabase
      .from('users').select('id, username, avatar_url').in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);
    const authorMap = Object.fromEntries((authors || []).map(a => [a.id, a]));

    res.json(comments.map(c => ({ ...c, author: authorMap[c.user_id] || null })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load comments' });
  }
});

// POST /api/comments/:postId - add a comment
router.post('/:postId', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: req.params.postId, user_id: req.user.id, content })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, author: { id: req.user.id, username: req.user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add comment' });
  }
});

module.exports = router;
