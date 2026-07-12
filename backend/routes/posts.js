const express = require('express');
const supabase = require('../config/supabase');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// helper: attach author info + comment count + whether current user liked it
async function enrichPosts(posts, currentUserId) {
  if (!posts.length) return [];

  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: authors } = await supabase
    .from('users').select('id, username, avatar_url').in('id', userIds);
  const authorMap = Object.fromEntries((authors || []).map(a => [a.id, a]));

  const postIds = posts.map(p => p.id);
  const { data: allComments } = await supabase
    .from('comments').select('post_id').in('post_id', postIds);
  const commentCounts = {};
  (allComments || []).forEach(c => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

  let likedSet = new Set();
  if (currentUserId) {
    const { data: myLikes } = await supabase
      .from('likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds);
    likedSet = new Set((myLikes || []).map(l => l.post_id));
  }

  return posts.map(p => ({
    ...p,
    author: authorMap[p.user_id] || null,
    comments_count: commentCounts[p.id] || 0,
    liked_by_me: likedSet.has(p.id),
  }));
}

// POST /api/posts - create a new post
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, media_type, media_url } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: req.user.id,
        title,
        description: description || '',
        media_type: media_type || 'text',
        media_url: media_url || '',
        likes_count: 0,
      })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create post' });
  }
});

// GET /api/posts/feed - posts from people the current user follows
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const { data: following } = await supabase
      .from('follows').select('following_id').eq('follower_id', req.user.id);
    const followingIds = (following || []).map(f => f.following_id);
    followingIds.push(req.user.id); // include your own posts too

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(await enrichPosts(posts, req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load feed' });
  }
});

// GET /api/posts/explore - all posts, newest first (works for guests too)
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(await enrichPosts(posts, req.user && req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load explore feed' });
  }
});

// GET /api/posts/:id - single post detail
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data: post, error } = await supabase
      .from('posts').select('*').eq('id', req.params.id).maybeSingle();

    if (error) throw error;
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const [enriched] = await enrichPosts([post], req.user && req.user.id);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load post' });
  }
});

module.exports = router;
