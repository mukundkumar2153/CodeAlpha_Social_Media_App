Auth.requireLogin();
renderBottomNav('feed');

async function loadFeed() {
  const slot = document.getElementById('feed-slot');
  try {
    const posts = await apiRequest('/posts/feed', { auth: true });

    if (!posts.length) {
      await renderSuggestions(slot);
      return;
    }

    slot.innerHTML = posts.map(renderPostCard).join('');
    attachLikeHandlers(slot);
  } catch (err) {
    slot.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

async function renderSuggestions(slot) {
  try {
    const explorePosts = await apiRequest('/posts/explore', { auth: false });
    const me = Auth.getUser();
    const seen = new Set();
    const suggestions = [];

    for (const p of explorePosts) {
      if (p.author && p.author.id !== me.id && !seen.has(p.author.id)) {
        seen.add(p.author.id);
        suggestions.push(p.author);
      }
    }

    if (!suggestions.length) {
      slot.innerHTML = `
        <div class="empty-state">
          <div class="icon"><i class="ti ti-mood-empty"></i></div>
          <h3>Your feed is empty</h3>
          <p>Follow some people from Explore to see their posts here.</p>
        </div>`;
      return;
    }

    slot.innerHTML = `
      <div class="page-title">Suggested for you</div>
      <div id="suggestions-list">
        ${suggestions.slice(0, 8).map(u => `
          <div class="suggestion-row" data-user-id="${u.id}">
            <a href="profile.html?id=${u.id}" class="suggestion-info">
              <div class="avatar-sm">${u.avatar_url ? `<img src="${u.avatar_url}">` : initials(u.username)}</div>
              <span class="username">${u.username}</span>
            </a>
            <button class="btn-outline suggestion-follow-btn" style="width:auto;margin:0;padding:8px 18px;font-size:12px">Follow</button>
          </div>
        `).join('')}
      </div>
    `;

    slot.querySelectorAll('.suggestion-follow-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('.suggestion-row');
        const userId = row.dataset.userId;
        try {
          const res = await apiRequest(`/follows/${userId}`, { method: 'POST', auth: true });
          btn.textContent = res.following ? 'Following' : 'Follow';
          if (res.following) setTimeout(loadFeed, 600); // refresh feed once they follow someone
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    slot.innerHTML = `<div class="empty-state"><p>Could not load suggestions.</p></div>`;
  }
}

async function loadStoryBubbles() {
  const slot = document.getElementById('stories-slot');
  try {
    const posts = await apiRequest('/posts/explore', { auth: false });
    const seen = new Set();
    const authors = [];
    for (const p of posts) {
      if (p.author && !seen.has(p.author.id)) {
        seen.add(p.author.id);
        authors.push(p.author);
      }
    }
    if (!authors.length) { slot.innerHTML = ''; return; }

    slot.innerHTML = `<div class="stories-row">${authors.map(a => `
      <a href="profile.html?id=${a.id}" class="story-bubble">
        <div class="story-ring"><div class="avatar">${a.avatar_url ? `<img src="${a.avatar_url}">` : initials(a.username)}</div></div>
        <span>${a.username}</span>
      </a>`).join('')}</div>`;
  } catch (err) {
    slot.innerHTML = '';
  }
}

loadStoryBubbles();
loadFeed();