Auth.requireLogin();
renderBottomNav('create');

let selectedType = 'text';

document.querySelectorAll('#type-select button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#type-select button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;

    document.getElementById('image-file-field').style.display = selectedType === 'image' ? 'block' : 'none';
    document.getElementById('video-file-field').style.display = selectedType === 'video' ? 'block' : 'none';
  });
});

document.getElementById('post-image-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById('image-preview-wrap');
  if (!file) { preview.innerHTML = ''; return; }
  const url = URL.createObjectURL(file);
  preview.innerHTML = `<img src="${url}" style="width:100%;border-radius:12px;margin-top:10px;max-height:260px;object-fit:cover">`;
});

document.getElementById('post-video-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById('video-preview-wrap');
  if (!file) { preview.innerHTML = ''; return; }
  const url = URL.createObjectURL(file);
  preview.innerHTML = `<video src="${url}" controls style="width:100%;border-radius:12px;margin-top:10px;max-height:260px"></video>`;
});

document.getElementById('submit-post-btn').addEventListener('click', async () => {
  const errorBox = document.getElementById('form-error');
  errorBox.classList.remove('show');

  const title = document.getElementById('post-title').value.trim();
  const description = document.getElementById('post-description').value.trim();

  if (!title) {
    errorBox.textContent = 'Title is required';
    errorBox.classList.add('show');
    return;
  }

  const btn = document.getElementById('submit-post-btn');
  btn.disabled = true;
  btn.textContent = 'Sharing...';

  try {
    let media_url = '';

    if (selectedType === 'image') {
      const file = document.getElementById('post-image-file').files[0];
      if (file) {
        btn.textContent = 'Uploading image...';
        media_url = await uploadFile(file);
      }
    } else if (selectedType === 'video') {
      const file = document.getElementById('post-video-file').files[0];
      if (file) {
        btn.textContent = 'Uploading video...';
        media_url = await uploadFile(file);
      }
    }

    btn.textContent = 'Sharing...';
    const post = await apiRequest('/posts', {
      method: 'POST',
      auth: true,
      body: { title, description, media_type: selectedType, media_url },
    });
    window.location.href = `post.html?id=${post.id}`;
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Share post';
  }
});