import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('posts') // apni koi bhi real table ka naam daalo (e.g. users, posts, comments)
      .select('*')
      .limit(1);

    if (error) throw error;

    res.status(200).json({ status: 'ok', message: 'Supabase pinged successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
