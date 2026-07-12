const express = require('express');
const supabase = require('../config/supabase');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users?search=xxx - search users by username
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = supabase.from('users').select('id, username, avatar_url, bio');
    if (search) query = query.ilike('username', `%${search}%`);
    const { data, error } = await query.limit(20);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not search users' });
  }
});

// GET /api/users/:id - public profile with counts
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, bio, avatar_url, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { count: postsCount } = await supabase
      .from('posts').select('*', { count: 'exact', head: true }).eq('user_id', id);
    const { count: followersCount } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id);
    const { count: followingCount } = await supabase
      .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id);

    let isFollowing = false;
    if (req.user) {
      const { data: rel } = await supabase
        .from('follows').select('*').eq('follower_id', req.user.id).eq('following_id', id).maybeSingle();
      isFollowing = !!rel;
    }

    res.json({
      ...user,
      posts_count: postsCount || 0,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      is_following: isFollowing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load profile' });
  }
});

// PUT /api/users/:id - edit own profile only
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own profile' });

    const { bio, avatar_url } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ bio, avatar_url })
      .eq('id', id)
      .select('id, username, email, bio, avatar_url, created_at')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// GET /api/users/:id/posts - all posts by this user
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load posts' });
  }
});

module.exports = router;