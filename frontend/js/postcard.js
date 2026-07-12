function renderMedia(post) {
  if (post.media_type === 'image' && post.media_url) {
    return `<div class="post-media"><img src="${post.media_url}" alt="${escapeHtml(post.title)}"></div>`;
  }
  if (post.media_type === 'video' && post.media_url) {
    return `<div class="post-media"><video src="${post.media_url}" controls preload="metadata"></video></div>`;
  }
  if (post.media_type === 'text') {
    return '';
  }
  return `<div class="post-media">No media link added yet for this post</div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderPostCard(post) {
  const author = post.author || { username: 'unknown', avatar_url: '' };
  const avatarHtml = author.avatar_url
    ? `<img src="${author.avatar_url}" alt="${author.username}">`
    : initials(author.username);

  return `
    <div class="post-card" data-post-id="${post.id}">
      <a href="profile.html?id=${post.user_id}" class="post-card-header">
        <div class="avatar-sm">${avatarHtml}</div>
        <div class="meta">
          <span class="username">${escapeHtml(author.username)}</span>
          <span class="timestamp">${timeAgo(post.created_at)}</span>
        </div>
      </a>
      ${renderMedia(post)}
      <div class="post-body">
        <div class="post-actions">
          <button class="action-btn like-btn ${post.liked_by_me ? 'liked' : ''}" data-post-id="${post.id}">
            <i class="ti ti-heart"></i>
            <span class="count like-count">${formatCount(post.likes_count || 0)}</span>
          </button>
          <a href="post.html?id=${post.id}" class="action-btn">
            <i class="ti ti-message-circle"></i>
            <span class="count">${formatCount(post.comments_count || 0)}</span>
          </a>
        </div>
        <div class="post-title">${escapeHtml(post.title)}</div>
        ${post.description ? `<p class="post-description">${escapeHtml(post.description)}</p>` : ''}
        ${post.comments_count ? `<a href="post.html?id=${post.id}" class="post-comments-link">View all ${post.comments_count} comments</a>` : ''}
      </div>
    </div>
  `;
}

function attachLikeHandlers(container) {
  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!Auth.isLoggedIn()) { window.location.href = 'index.html'; return; }
      const postId = btn.dataset.postId;
      try {
        const res = await apiRequest(`/likes/${postId}`, { method: 'POST', auth: true });
        btn.classList.toggle('liked', res.liked);
        btn.querySelector('.like-count').textContent = formatCount(res.likes_count);
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
