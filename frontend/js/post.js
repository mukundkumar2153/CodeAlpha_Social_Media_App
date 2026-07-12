const postParams = new URLSearchParams(window.location.search);
const postId = postParams.get('id');

async function loadPost() {
  const slot = document.getElementById('post-slot');
  if (!postId) {
    slot.innerHTML = `<div class="empty-state"><p>No post selected.</p></div>`;
    return;
  }
  try {
    const post = await apiRequest(`/posts/${postId}`, { auth: Auth.isLoggedIn() });
    slot.innerHTML = renderPostCard(post);
    attachLikeHandlers(slot);
  } catch (err) {
    slot.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

async function loadComments() {
  const slot = document.getElementById('comments-slot');
  try {
    const comments = await apiRequest(`/comments/${postId}`);
    if (!comments.length) {
      slot.innerHTML = `<div class="empty-state"><p>No comments yet. Be the first!</p></div>`;
      return;
    }
    slot.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="avatar-sm">${c.author && c.author.avatar_url ? `<img src="${c.author.avatar_url}">` : initials(c.author ? c.author.username : '?')}</div>
        <div class="comment-body">
          <div><span class="comment-author">${c.author ? c.author.username : 'unknown'}</span><span class="comment-text">${escapeHtml(c.content)}</span></div>
          <div class="comment-time">${timeAgo(c.created_at)}</div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    slot.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

document.getElementById('comment-submit').addEventListener('click', async () => {
  if (!Auth.isLoggedIn()) { window.location.href = 'index.html'; return; }
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) return;

  try {
    await apiRequest(`/comments/${postId}`, { method: 'POST', auth: true, body: { content } });
    input.value = '';
    loadComments();
  } catch (err) {
    alert(err.message);
  }
});

loadPost();
loadComments();
