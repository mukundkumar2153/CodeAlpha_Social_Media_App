const API_BASE = 'http://localhost:5000/api';

let state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  feedMode: 'all', // 'all' | 'following'
  viewingProfile: null // username being viewed in side panel, defaults to self
};

// ---------- API helper ----------
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr + 'Z').getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---------- Auth view ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    loginSuccess(data);
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('registerError');
  errEl.textContent = '';
  try {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
    loginSuccess(data);
  } catch (err) {
    errEl.textContent = err.message;
  }
});

function loginSuccess(data) {
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  showApp();
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  document.getElementById('appView').classList.add('hidden');
  document.getElementById('authView').classList.remove('hidden');
});

// ---------- App view ----------
function showApp() {
  document.getElementById('authView').classList.add('hidden');
  document.getElementById('appView').classList.remove('hidden');
  state.viewingProfile = state.user.username;
  loadProfilePanel(state.user.username);
  loadPosts();
}

document.getElementById('navFeedBtn').addEventListener('click', () => setNav('feed'));
document.getElementById('navExploreBtn').addEventListener('click', () => setNav('explore'));
document.getElementById('navProfileBtn').addEventListener('click', () => {
  setNav('profile');
  state.viewingProfile = state.user.username;
  loadProfilePanel(state.user.username);
});

function setNav(which) {
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
  if (which === 'feed') { document.getElementById('navFeedBtn').classList.add('active'); state.feedMode = 'following'; setFeedToggle('following'); }
  if (which === 'explore') { document.getElementById('navExploreBtn').classList.add('active'); state.feedMode = 'all'; setFeedToggle('all'); }
  if (which === 'profile') { document.getElementById('navProfileBtn').classList.add('active'); }
  loadPosts();
}

document.getElementById('toggleAllBtn').addEventListener('click', () => { setFeedToggle('all'); loadPosts(); });
document.getElementById('toggleFollowingBtn').addEventListener('click', () => { setFeedToggle('following'); loadPosts(); });

function setFeedToggle(mode) {
  state.feedMode = mode;
  document.getElementById('toggleAllBtn').classList.toggle('active', mode === 'all');
  document.getElementById('toggleFollowingBtn').classList.toggle('active', mode === 'following');
}

// ---------- Composer ----------
document.getElementById('submitPostBtn').addEventListener('click', async () => {
  const content = document.getElementById('postContent').value.trim();
  const image_url = document.getElementById('postImage').value.trim();
  if (!content) return showToast('Write something first!');

  try {
    await api('/posts', { method: 'POST', body: JSON.stringify({ content, image_url }) });
    document.getElementById('postContent').value = '';
    document.getElementById('postImage').value = '';
    loadPosts();
    if (state.viewingProfile === state.user.username) loadProfilePanel(state.user.username);
  } catch (err) {
    showToast(err.message);
  }
});

// ---------- Load & render posts ----------
async function loadPosts() {
  const listEl = document.getElementById('postsList');
  listEl.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const path = state.feedMode === 'following' ? '/posts/feed' : '/posts';
    const posts = await api(path);
    renderPosts(posts);
  } catch (err) {
    listEl.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

function renderPosts(posts) {
  const listEl = document.getElementById('postsList');
  if (!posts.length) {
    listEl.innerHTML = '<p class="empty-state">No posts yet. Be the first to share something!</p>';
    return;
  }
  listEl.innerHTML = posts.map(postTemplate).join('');

  posts.forEach(p => {
    document.getElementById(`likeBtn-${p.id}`).addEventListener('click', () => toggleLike(p.id, p.likedByMe));
    document.getElementById(`commentToggle-${p.id}`).addEventListener('click', () => toggleComments(p.id));
    document.querySelectorAll(`.author-link-${p.id}`).forEach(el =>
      el.addEventListener('click', () => viewProfile(p.author.username)));
    if (p.author.id === state.user.id) {
      const delBtn = document.getElementById(`deleteBtn-${p.id}`);
      if (delBtn) delBtn.addEventListener('click', () => deletePost(p.id));
    }
  });
}

function postTemplate(p) {
  const isOwner = p.author.id === state.user.id;
  return `
  <div class="post-card" id="post-${p.id}">
    <div class="post-header">
      <div class="avatar author-link-${p.id}">${initials(p.author.username)}</div>
      <div>
        <div class="post-author author-link-${p.id}">${escapeHtml(p.author.username)}</div>
        <div class="post-time">${timeAgo(p.created_at)}</div>
      </div>
    </div>
    <div class="post-content">${escapeHtml(p.content)}</div>
    ${p.image_url ? `<img class="post-image" src="${escapeAttr(p.image_url)}" onerror="this.style.display='none'">` : ''}
    <div class="post-actions">
      <button class="action-btn ${p.likedByMe ? 'liked' : ''}" id="likeBtn-${p.id}">
        ${p.likedByMe ? '❤️' : '🤍'} <span id="likeCount-${p.id}">${p.likeCount}</span>
      </button>
      <button class="action-btn" id="commentToggle-${p.id}">💬 ${p.commentCount} Comments</button>
      ${isOwner ? `<button class="action-btn delete-btn" id="deleteBtn-${p.id}">🗑️ Delete</button>` : ''}
    </div>
    <div class="comments-section hidden" id="commentsSection-${p.id}"></div>
  </div>`;
}

async function toggleLike(postId, currentlyLiked) {
  try {
    if (currentlyLiked) {
      await api(`/posts/${postId}/like`, { method: 'DELETE' });
    } else {
      await api(`/posts/${postId}/like`, { method: 'POST' });
    }
    loadPosts();
  } catch (err) {
    showToast(err.message);
  }
}

async function deletePost(postId) {
  if (!confirm('Delete this post?')) return;
  try {
    await api(`/posts/${postId}`, { method: 'DELETE' });
    loadPosts();
  } catch (err) {
    showToast(err.message);
  }
}

async function toggleComments(postId) {
  const section = document.getElementById(`commentsSection-${postId}`);
  if (!section.classList.contains('hidden')) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');
  section.innerHTML = '<p class="empty-state" style="padding:10px;">Loading comments...</p>';
  try {
    const comments = await api(`/posts/${postId}/comments`);
    section.innerHTML = `
      <div class="comment-list">
        ${comments.map(c => `
          <div class="comment">
            <div class="avatar" style="width:26px;height:26px;font-size:11px;">${initials(c.username)}</div>
            <div><b>${escapeHtml(c.username)}</b> ${escapeHtml(c.content)}
              <div class="post-time">${timeAgo(c.created_at)}</div>
            </div>
          </div>`).join('') || '<p class="empty-state" style="padding:8px;">No comments yet.</p>'}
      </div>
      <form class="comment-form" id="commentForm-${postId}">
        <input type="text" placeholder="Write a comment..." id="commentInput-${postId}" required>
        <button type="submit">Send</button>
      </form>
    `;
    document.getElementById(`commentForm-${postId}`).addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById(`commentInput-${postId}`);
      const content = input.value.trim();
      if (!content) return;
      try {
        await api(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
        input.value = '';
        toggleComments(postId); // close
        toggleComments(postId); // reopen refreshed
        loadPosts();
      } catch (err) {
        showToast(err.message);
      }
    });
  } catch (err) {
    section.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

// ---------- Profile panel ----------
async function viewProfile(username) {
  state.viewingProfile = username;
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
  await loadProfilePanel(username);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadProfilePanel(username) {
  const panel = document.getElementById('profilePanel');
  panel.innerHTML = '<p class="empty-state">Loading...</p>';
  try {
    const profile = await api(`/users/${username}`);
    const isSelf = profile.username === state.user.username;

    panel.innerHTML = `
      <div class="profile-avatar-lg">${initials(profile.username)}</div>
      <div class="profile-username">${escapeHtml(profile.username)}</div>
      <div class="profile-bio">${escapeHtml(profile.bio || 'No bio yet.')}</div>
      <div class="profile-stats">
        <div><b>${profile.postCount}</b><span>Posts</span></div>
        <div><b>${profile.followerCount}</b><span>Followers</span></div>
        <div><b>${profile.followingCount}</b><span>Following</span></div>
      </div>
      ${isSelf ? `
        <div class="bio-edit">
          <textarea id="bioInput" placeholder="Update your bio...">${escapeHtml(profile.bio || '')}</textarea>
          <button id="saveBioBtn">Save Bio</button>
        </div>
      ` : `
        <button class="follow-btn ${profile.isFollowing ? 'following' : ''}" id="followBtn">
          ${profile.isFollowing ? 'Following ✓' : 'Follow'}
        </button>
      `}
    `;

    if (isSelf) {
      document.getElementById('saveBioBtn').addEventListener('click', async () => {
        const bio = document.getElementById('bioInput').value.trim();
        try {
          await api('/users/me', { method: 'PUT', body: JSON.stringify({ bio }) });
          showToast('Bio updated!');
          loadProfilePanel(username);
        } catch (err) {
          showToast(err.message);
        }
      });
    } else {
      document.getElementById('followBtn').addEventListener('click', async () => {
        try {
          if (profile.isFollowing) {
            await api(`/users/${username}/follow`, { method: 'DELETE' });
          } else {
            await api(`/users/${username}/follow`, { method: 'POST' });
          }
          loadProfilePanel(username);
        } catch (err) {
          showToast(err.message);
        }
      });
    }
  } catch (err) {
    panel.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

// ---------- Utils ----------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

// ---------- Init ----------
if (state.token && state.user) {
  showApp();
}
