function renderBottomNav(active) {
  const user = Auth.getUser();
  const profileHref = user ? `profile.html?id=${user.id}` : 'index.html';

  const icons = {
    feed: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path></svg>`,
    explore: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
    create: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    profile: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  };

  const items = [
    { key: 'feed', href: 'feed.html', icon: icons.feed },
    { key: 'explore', href: 'explore.html', icon: icons.explore },
    { key: 'create', href: 'create.html', icon: icons.create, special: true },
    { key: 'profile', href: profileHref, icon: icons.profile },
  ];

  const html = items.map(item => {
    if (item.special) {
      return `<a href="${item.href}" class="nav-btn create-btn">${item.icon}</a>`;
    }
    return `<a href="${item.href}" class="nav-btn ${active === item.key ? 'active' : ''}">${item.icon}</a>`;
  }).join('');

  document.getElementById('bottom-nav-slot').innerHTML = html;
}