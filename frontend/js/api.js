const API_BASE = '/api';

const Auth = {
  getToken() { return localStorage.getItem('cf_token'); },
  setToken(t) { localStorage.setItem('cf_token', t); },
  getUser() {
    const raw = localStorage.getItem('cf_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser(u) { localStorage.setItem('cf_user', JSON.stringify(u)); },
  logout() {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    window.location.href = 'index.html';
  },
  isLoggedIn() { return !!this.getToken(); },
  requireLogin() {
    if (!this.isLoggedIn()) window.location.href = 'index.html';
  }
};

async function apiRequest(path, { method = 'GET', body = null, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Auth.getToken()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// Uploads a file (e.g. image) using multipart/form-data, returns the public URL
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Auth.getToken()}` },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}

function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}