renderBottomNav('explore');

async function loadExplore() {
  const slot = document.getElementById('explore-slot');
  try {
    const posts = await apiRequest('/posts/explore', { auth: Auth.isLoggedIn() });

    if (!posts.length) {
      slot.innerHTML = `<div class="empty-state"><div class="icon"><i class="ti ti-photo-off"></i></div><h3>No posts yet</h3><p>Be the first to share something.</p></div>`;
      return;
    }

    slot.innerHTML = posts.map(p => `<a href="post.html?id=${p.id}" class="grid-item">${gridThumb(p)}</a>`).join('');
  } catch (err) {
    slot.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

let searchDebounce;
document.getElementById('user-search-input').addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  const query = e.target.value.trim();
  const resultsSlot = document.getElementById('search-results-slot');
  const exploreGrid = document.getElementById('explore-slot');

  if (!query) {
    resultsSlot.innerHTML = '';
    exploreGrid.style.display = 'grid';
    return;
  }

  exploreGrid.style.display = 'none';
  resultsSlot.innerHTML = `<div class="loading-spinner">Searching...</div>`;

  searchDebounce = setTimeout(async () => {
    try {
      const users = await apiRequest(`/users?search=${encodeURIComponent(query)}`);
      if (!users.length) {
        resultsSlot.innerHTML = `<div class="empty-state"><p>No users found for "${query}"</p></div>`;
        return;
      }
      resultsSlot.innerHTML = users.map(u => `
        <a href="profile.html?id=${u.id}" class="user-list-row">
          <div class="avatar-sm">${u.avatar_url ? `<img src="${u.avatar_url}">` : initials(u.username)}</div>
          <div class="user-list-info">
            <span class="username">${u.username}</span>
            ${u.bio ? `<span class="bio-preview">${u.bio}</span>` : ''}
          </div>
        </a>
      `).join('');
    } catch (err) {
      resultsSlot.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
    }
  }, 350);
});

loadExplore();