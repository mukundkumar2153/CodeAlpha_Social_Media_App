renderBottomNav('profile');

const params = new URLSearchParams(window.location.search);
const profileId = params.get('id');
const me = Auth.getUser();

async function loadProfile() {
  const slot = document.getElementById('profile-slot');
  if (!profileId) {
    slot.innerHTML = `<div class="empty-state"><p>No profile selected.</p></div>`;
    return;
  }

  try {
    const user = await apiRequest(`/users/${profileId}`, { auth: Auth.isLoggedIn() });
    const isMe = me && me.id === profileId;

    const avatarHtml = user.avatar_url ? `<img src="${user.avatar_url}">` : initials(user.username);

    slot.innerHTML = `
      <div class="profile-header">
        <div class="avatar-lg">${avatarHtml}</div>
        <div class="profile-stats">
          <div class="stat"><span class="num">${formatCount(user.posts_count)}</span><span class="label">Posts</span></div>
          <div class="stat stat-clickable" id="followers-stat"><span class="num">${formatCount(user.followers_count)}</span><span class="label">Followers</span></div>
          <div class="stat stat-clickable" id="following-stat"><span class="num">${formatCount(user.following_count)}</span><span class="label">Following</span></div>
        </div>
      </div>
      <div class="profile-bio" id="profile-bio-view">
        <div class="name">${user.username}</div>
        <div class="bio-text">${user.bio || 'No bio yet.'}</div>
      </div>
      <div class="profile-actions" id="profile-actions">
        ${isMe
          ? `<button class="btn-outline" id="edit-bio-btn" style="flex:1">Edit profile</button>`
          : `<button class="btn-gradient" id="follow-btn" style="flex:1">${user.is_following ? 'Following' : 'Follow'}</button>`
        }
      </div>
      <div class="section-tabs">
        <button class="active"><i class="ti ti-grid-dots"></i></button>
      </div>
      <div class="posts-grid" id="user-posts-grid">
        <div class="loading-spinner">Loading posts...</div>
      </div>
    `;

    document.getElementById('followers-stat').addEventListener('click', () => openFollowListModal('followers', user.username));
    document.getElementById('following-stat').addEventListener('click', () => openFollowListModal('following', user.username));

    if (!isMe) {
      document.getElementById('follow-btn').addEventListener('click', async (e) => {
        if (!Auth.isLoggedIn()) { window.location.href = 'index.html'; return; }
        try {
          const res = await apiRequest(`/follows/${profileId}`, { method: 'POST', auth: true });
          e.target.textContent = res.following ? 'Following' : 'Follow';
        } catch (err) {
          alert(err.message);
        }
      });
    } else {
      document.getElementById('edit-bio-btn').addEventListener('click', () => showEditForm(user));
    }

    loadUserPosts();
  } catch (err) {
    slot.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

async function openFollowListModal(type, username) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span>${type === 'followers' ? 'Followers' : 'Following'}</span>
        <button class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body" id="modal-list-body">
        <div class="loading-spinner">Loading...</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('modal-close-btn')) {
      overlay.remove();
    }
  });

  try {
    const users = await apiRequest(`/follows/${profileId}/${type}`);
    const body = document.getElementById('modal-list-body');

    if (!users.length) {
      body.innerHTML = `<div class="empty-state"><p>No ${type} yet.</p></div>`;
      return;
    }

    body.innerHTML = users.map(u => `
      <a href="profile.html?id=${u.id}" class="user-list-row">
        <div class="avatar-sm">${u.avatar_url ? `<img src="${u.avatar_url}">` : initials(u.username)}</div>
        <div class="user-list-info">
          <span class="username">${u.username}</span>
          ${u.bio ? `<span class="bio-preview">${u.bio}</span>` : ''}
        </div>
      </a>
    `).join('');
  } catch (err) {
    document.getElementById('modal-list-body').innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

function showEditForm(user) {
  const bioView = document.getElementById('profile-bio-view');
  const actions = document.getElementById('profile-actions');

  bioView.innerHTML = `
    <div class="field">
      <label>Bio</label>
      <textarea id="edit-bio-input">${user.bio || ''}</textarea>
    </div>
    <div class="field">
      <label>Profile photo</label>
      <input type="file" id="edit-avatar-file" accept="image/*">
      <div id="avatar-preview-wrap" style="margin-top:8px">
        ${user.avatar_url ? `<img src="${user.avatar_url}" style="width:60px;height:60px;border-radius:50%;object-fit:cover">` : ''}
      </div>
    </div>
    <div id="edit-error" class="form-error"></div>
  `;

  actions.innerHTML = `
    <button class="btn-outline" id="cancel-edit-btn" style="flex:1">Cancel</button>
    <button class="btn-gradient" id="save-edit-btn" style="flex:1">Save</button>
  `;

  document.getElementById('edit-avatar-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('avatar-preview-wrap');
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${url}" style="width:60px;height:60px;border-radius:50%;object-fit:cover">`;
  });

  document.getElementById('cancel-edit-btn').addEventListener('click', () => loadProfile());

  document.getElementById('save-edit-btn').addEventListener('click', async () => {
    const errorBox = document.getElementById('edit-error');
    errorBox.classList.remove('show');
    const saveBtn = document.getElementById('save-edit-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const bio = document.getElementById('edit-bio-input').value.trim();
      let avatar_url = user.avatar_url || '';

      const file = document.getElementById('edit-avatar-file').files[0];
      if (file) {
        saveBtn.textContent = 'Uploading photo...';
        avatar_url = await uploadFile(file);
      }

      await apiRequest(`/users/${profileId}`, { method: 'PUT', auth: true, body: { bio, avatar_url } });
      window.location.reload();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add('show');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  });
}

async function loadUserPosts() {
  const grid = document.getElementById('user-posts-grid');
  try {
    const posts = await apiRequest(`/users/${profileId}/posts`);
    if (!posts.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1"><p>No posts yet.</p></div>`;
      return;
    }
    grid.innerHTML = posts.map(p => `<a href="post.html?id=${p.id}" class="grid-item">${gridThumb(p)}</a>`).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1"><p>${err.message}</p></div>`;
  }
}

document.getElementById('settings-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('settings-menu').classList.toggle('show');
});

document.addEventListener('click', () => {
  document.getElementById('settings-menu').classList.remove('show');
});

document.getElementById('menu-logout').addEventListener('click', () => {
  Auth.logout();
});

document.getElementById('menu-edit-profile').addEventListener('click', () => {
  const editBtn = document.getElementById('edit-bio-btn');
  if (editBtn) {
    editBtn.click();
  } else {
    alert('You can only edit your own profile.');
  }
  document.getElementById('settings-menu').classList.remove('show');
});

loadProfile();