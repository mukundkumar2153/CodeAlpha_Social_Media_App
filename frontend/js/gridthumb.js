function gridThumb(p) {
  if (p.media_type === 'image') {
    return p.media_url
      ? `<img src="${p.media_url}" alt="${escapeHtml(p.title)}">`
      : `<div class="grid-placeholder"><i class="ti ti-photo"></i></div>`;
  }
  if (p.media_type === 'video') {
    return p.media_url
      ? `<div class="grid-video-thumb"><video src="${p.media_url}" preload="metadata"></video><div class="play-overlay"><i class="ti ti-player-play-filled"></i></div></div>`
      : `<div class="grid-placeholder"><i class="ti ti-video"></i></div>`;
  }
  return `<div class="grid-placeholder text"><span>${escapeHtml(p.title.slice(0, 40))}</span></div>`;
}