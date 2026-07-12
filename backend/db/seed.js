// Populates the database with sample users, posts, comments and like counts
// so the app doesn't look empty. Media URLs (image/embed links) are left
// blank on purpose — fill them in manually from the Supabase table editor.
//
// Run with: npm run seed   (from inside the backend folder)

const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const SAMPLE_USERS = [
  { username: 'aayush_dev',   email: 'aayush@example.com',   bio: 'Full stack dev | building things that break sometimes' },
  { username: 'riya.codes',   email: 'riya@example.com',     bio: 'Frontend enthusiast, coffee addict' },
  { username: 'traveler_kunal', email: 'kunal@example.com',  bio: 'Chasing sunsets across India' },
  { username: 'foodie_meera', email: 'meera@example.com',    bio: 'Home chef | recipe hoarder' },
  { username: 'gamer_arjun',  email: 'arjun@example.com',    bio: 'PC master race, streaming on weekends' },
  { username: 'fit_with_sara',email: 'sara@example.com',     bio: 'Fitness coach | 5am club' },
  { username: 'photo_by_dev', email: 'dev@example.com',      bio: 'Street photography from Mumbai' },
  { username: 'music_by_ira', email: 'ira@example.com',      bio: 'Guitarist, songwriter, dreamer' },
];

const SAMPLE_POSTS = [
  { title: 'First day at my new internship!', description: 'Started something exciting today, feeling grateful.', media_type: 'image' },
  { title: 'Sunset from my terrace', description: 'Nothing beats this view after a long day.', media_type: 'image' },
  { title: 'New recipe I tried today', description: 'Butter garlic pasta, took 20 mins only.', media_type: 'image' },
  { title: 'Gaming setup upgrade', description: 'Finally got the second monitor, feels unreal.', media_type: 'image' },
  { title: 'Morning workout done', description: '5am club checking in, who else is up?', media_type: 'video', video_source: 'embed' },
  { title: 'Random thought of the day', description: 'Why does time move faster on weekends?', media_type: 'text' },
  { title: 'Street photography dump', description: 'Some shots from Bandra this weekend.', media_type: 'image' },
  { title: 'New song cover', description: 'Tried covering a classic today, let me know what you think.', media_type: 'video', video_source: 'embed' },
  { title: 'Weekend trip highlights', description: 'Three days, one backpack, zero regrets.', media_type: 'image' },
  { title: 'Coding late night again', description: 'Debugging at 2am hits different.', media_type: 'text' },
  { title: 'Cafe hopping in the city', description: 'Found this hidden gem near Bandra.', media_type: 'image' },
  { title: 'Quick dance cover', description: 'Learned this in a day, still rough around edges.', media_type: 'video', video_source: 'embed' },
  { title: 'Books I read this month', description: 'Three books, all very different genres.', media_type: 'image' },
  { title: 'Rainy day thoughts', description: 'Monsoon really hits different in this city.', media_type: 'text' },
  { title: 'New PC build reveal', description: 'Took me two weeks to source all parts.', media_type: 'image' },
  { title: 'Trying stand-up comedy', description: 'First open mic ever, terrifying but fun.', media_type: 'video', video_source: 'embed' },
  { title: 'Weekend hike', description: 'Sahyadri trails never disappoint.', media_type: 'image' },
  { title: 'Sketching practice', description: 'Getting back into digital art after months.', media_type: 'image' },
];

const SAMPLE_COMMENTS = [
  'This is amazing!',
  'Love this so much',
  'Congrats yaar!',
  'Wow, need to try this too',
  'Great shot!',
  'This made my day',
  'So relatable honestly',
  'Keep it up!',
  'Underrated post fr',
  'Saving this for later',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomLikes() {
  // Roughly half the posts get a small like count (10-15),
  // the rest get a much bigger spread up to 10K, like a real feed.
  return Math.random() < 0.5 ? randomInt(10, 15) : randomInt(500, 10000);
}

async function seed() {
  console.log('Seeding users...');
  const insertedUsers = [];

  for (const u of SAMPLE_USERS) {
    const password_hash = await bcrypt.hash('password123', 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ ...u, password_hash, avatar_url: '' })
      .select('id, username')
      .single();

    if (error) {
      console.error(`Failed to insert user ${u.username}:`, error.message);
      continue;
    }
    insertedUsers.push(data);
  }

  console.log(`Inserted ${insertedUsers.length} users. Default password for all: password123`);

  if (!insertedUsers.length) {
    console.error('No users inserted, stopping seed.');
    return;
  }

  console.log('Seeding posts...');
  const insertedPosts = [];

  for (const p of SAMPLE_POSTS) {
    const author = insertedUsers[randomInt(0, insertedUsers.length - 1)];
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: author.id,
        title: p.title,
        description: p.description,
        media_type: p.media_type === 'video' ? 'embed' : p.media_type, // videos stored as embed URLs
        media_url: '', // fill this manually in Supabase table editor
        likes_count: randomLikes(),
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to insert post "${p.title}":`, error.message);
      continue;
    }
    insertedPosts.push(data.id);
  }

  console.log(`Inserted ${insertedPosts.length} posts.`);

  console.log('Seeding comments (only on some posts)...');
  let commentCount = 0;

  for (const postId of insertedPosts) {
    // roughly 60% of posts get comments, rest stay with zero
    if (Math.random() > 0.6) continue;

    const howMany = randomInt(1, 4);
    for (let i = 0; i < howMany; i++) {
      const commenter = insertedUsers[randomInt(0, insertedUsers.length - 1)];
      const content = SAMPLE_COMMENTS[randomInt(0, SAMPLE_COMMENTS.length - 1)];

      const { error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: commenter.id, content });

      if (!error) commentCount++;
    }
  }

  console.log(`Inserted ${commentCount} comments.`);

  console.log('Seeding a few follow relationships...');
  let followCount = 0;
  for (const follower of insertedUsers) {
    const howManyToFollow = randomInt(1, 4);
    for (let i = 0; i < howManyToFollow; i++) {
      const target = insertedUsers[randomInt(0, insertedUsers.length - 1)];
      if (target.id === follower.id) continue;

      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: follower.id, following_id: target.id });

      if (!error) followCount++;
    }
  }
  console.log(`Inserted ${followCount} follow relationships.`);

  console.log('\nDone! Go to Supabase -> Table editor -> posts, and paste your image/embed links into the media_url column.');
}

seed().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
