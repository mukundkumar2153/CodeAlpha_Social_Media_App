const express = require('express');
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/likes/:postId - toggle like/unlike
router.post('/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const { data: existing } = await supabase
      .from('likes').select('id').eq('post_id', postId).eq('user_id', req.user.id).maybeSingle();

    const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (existing) {
      // unlike
      await supabase.from('likes').delete().eq('id', existing.id);
      const newCount = Math.max(0, (post.likes_count || 0) - 1);
      await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);
      return res.json({ liked: false, likes_count: newCount });
    } else {
      // like
      await supabase.from('likes').insert({ post_id: postId, user_id: req.user.id });
      const newCount = (post.likes_count || 0) + 1;
      await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);
      return res.json({ liked: true, likes_count: newCount });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not toggle like' });
  }
});

module.exports = router;
