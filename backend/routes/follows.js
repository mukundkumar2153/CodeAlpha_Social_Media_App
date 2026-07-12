const express = require('express');
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/follows/:userId - toggle follow/unfollow
router.post('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ error: 'You cannot follow yourself' });

    const { data: existing } = await supabase
      .from('follows').select('*').eq('follower_id', req.user.id).eq('following_id', userId).maybeSingle();

    if (existing) {
      await supabase.from('follows').delete().eq('follower_id', req.user.id).eq('following_id', userId);
      return res.json({ following: false });
    } else {
      await supabase.from('follows').insert({ follower_id: req.user.id, following_id: userId });
      return res.json({ following: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not toggle follow' });
  }
});

// GET /api/follows/:userId/followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('follows').select('follower_id').eq('following_id', req.params.userId);
    if (error) throw error;

    const ids = rows.map(r => r.follower_id);
    if (!ids.length) return res.json([]);

    const { data: users } = await supabase
      .from('users').select('id, username, avatar_url, bio').in('id', ids);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load followers' });
  }
});

// GET /api/follows/:userId/following
router.get('/:userId/following', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('follows').select('following_id').eq('follower_id', req.params.userId);
    if (error) throw error;

    const ids = rows.map(r => r.following_id);
    if (!ids.length) return res.json([]);

    const { data: users } = await supabase
      .from('users').select('id, username, avatar_url, bio').in('id', ids);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load following list' });
  }
});

module.exports = router;
