import './style.css';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createHeroScene } from './scene.js';
import { media, gallery, cities, sources } from './content.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const icon = name => '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let savedMotion = null;
try { savedMotion = localStorage.getItem('tannu-motion'); } catch { /* optional preference only */ }
let motionEnabled = savedMotion ? savedMotion === 'on' : !reducedQuery.matches;
let scene, lenis = null, motionContext = null, motionMedia = null, tickerCallback = null, entranceDone = false, entranceTimeline = null;
let lastDialogFocus = null, toastTimer, activeGalleryIndex = 0;
const viewport = $('#reels-viewport');
const track = $('#reels-track');

// All visible claims and media references come from the editable source file.
track.innerHTML = media.map((item, index) => {
  const visual = item.poster
    ? '<img src="' + item.poster + '" alt="" width="540" height="780" loading="lazy" />'
    : '<span class="reel-custom-cover ' + (item.cover === 'purple' ? 'alt' : '') + '"><span>' + item.short.replaceAll('\n', '<br>') + '</span><i>✳</i><span class="cover-small">OPEN THE ORIGINAL INSTAGRAM MOMENT</span></span>';
  return '<article class="reel-card" data-category="' + item.category + '"><button class="reel-image-button" data-media-open="' + item.id + '" data-cursor="PLAY" aria-label="Play ' + item.title + '">' + visual + '<span class="reel-top"><span><i></i>' + item.label + '</span>' + icon(item.type === 'youtube' ? 'play' : 'instagram') + '</span><span class="reel-play">' + icon('play') + '</span>' + (item.poster ? '<span class="reel-bottom"><small>' + (item.type === 'video' ? 'REAL VIDEO / CLICK TO PLAY WITH SOUND' : 'THE SHORT FILM') + '</small><strong>' + item.short.replaceAll('\n', '<br>') + '</strong></span>' : '') + '</button><div class="reel-card-caption"><div><h3>' + item.title + '</h3><p>' + item.subtitle + '</p></div><span>' + String(index + 1).padStart(2, '0') + ' ↗</span></div></article>';
}).join('');

$('#gallery-grid').innerHTML = gallery.map((item, index) => '<button class="gallery-item" data-gallery-open="' + index + '" data-cursor="VIEW" aria-label="View ' + item.title + '"><span class="gallery-image"><img src="' + item.src + '" alt="' + item.title + '" loading="lazy" width="600" height="750" /></span><span class="gallery-item-label"><span>' + item.title + '</span><small>' + item.kind + '</small></span></button>').join('');
$('#audience-cities').innerHTML = cities.map((city, index) => '<div class="city-row"><div class="city-row-main"><span class="city-name"><span class="city-index">0' + (index + 1) + '</span>' + city.name + '</span><span class="city-value">' + city.share + '<small>%</small></span></div><div class="city-track"><span class="city-fill" style="--city-width:' + (city.share / cities[0].share * 100) + '%"></span></div></div>').join('');
$('#source-list').innerHTML = sources.map(source => '<a class="source-item" href="' + source.url + '" target="_blank" rel="noopener noreferrer"><strong>' + source.name + ' ↗</strong><span>' + source.note + '</span></a>').join('');

function showToast(message) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message; toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
}

// Native modal dialogs provide keyboard focus trapping and Escape-to-close.
function openDialog(dialog) {
  if ($('dialog[open]')) return;
  lastDialogFocus = document.activeElement;
  closeMenu();
  pausePreviews();
  dialog.showModal();
  document.body.classList.add('dialog-is-open');
  lenis?.stop();
  scene?.setMotion(false);
}
for (const dialog of $$('dialog')) {
  dialog.setAttribute('data-lenis-prevent', '');
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog.id === 'media-dialog') {
      $$('video', dialog).forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
      $('#media-dialog-body').replaceChildren();
    }
    document.body.classList.remove('dialog-is-open');
    lenis?.start(); scene?.setMotion(motionEnabled);
    lastDialogFocus?.focus({ preventScroll: true });
  });
}

function openMedia(id) {
  const item = media.find(entry => entry.id === id);
  if (!item) return;
  const dialog = $('#media-dialog'), body = $('#media-dialog-body');
  body.replaceChildren();
  body.classList.toggle('is-instagram', item.type === 'instagram');
  $('#media-dialog-title').textContent = item.title;
  $('#media-dialog-description').textContent = item.type === 'video' ? 'Local video · Player controls include sound and fullscreen' : 'External player · Requires an internet connection';
  $('#media-original-link').href = item.original;
  if (item.type === 'video') {
    const video = document.createElement('video');
    video.src = item.src; video.poster = item.poster; video.controls = true; video.playsInline = true; video.preload = 'metadata';
    video.setAttribute('aria-label', item.title);
    body.append(video);
    video.addEventListener('error', () => { $('#media-dialog-description').textContent = 'Unable to load the local video. Use Open Original to visit the public profile.'; });
    openDialog(dialog);
    video.play().catch(() => { /* Browser may require pressing Play in the controls. */ });
  } else {
    const frame = document.createElement('iframe');
    frame.title = item.title; frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.src = item.type === 'youtube'
      ? 'https://www.youtube-nocookie.com/embed/biI3D6gS7Aw?autoplay=1&rel=0'
      : 'https://www.instagram.com/p/' + item.shortcode + '/embed/';
    body.append(frame);
    if (item.type === 'instagram') {
      const note = document.createElement('p');
      note.className = 'embed-notice';
      note.textContent = 'Instagram controls playback and may require sign-in. If the embed is unavailable, choose Open Original below.';
      body.append(note);
    }
    openDialog(dialog);
  }
}

function showGalleryImage(index) {
  activeGalleryIndex = (index + gallery.length) % gallery.length;
  const item = gallery[activeGalleryIndex];
  $('#gallery-full-image').src = item.src;
  $('#gallery-full-image').alt = item.description;
  $('#gallery-dialog-title').textContent = item.title;
  $('#gallery-caption').textContent = item.description;
  $('#gallery-counter').textContent = String(activeGalleryIndex + 1).padStart(2, '0') + ' / ' + String(gallery.length).padStart(2, '0');
}
$('#gallery-prev').addEventListener('click', () => showGalleryImage(activeGalleryIndex - 1));
$('#gallery-next').addEventListener('click', () => showGalleryImage(activeGalleryIndex + 1));
$('#gallery-dialog').addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); showGalleryImage(activeGalleryIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showGalleryImage(activeGalleryIndex - 1); }
});
document.addEventListener('click', event => {
  const play = event.target.closest('[data-media-open]');
  if (play) openMedia(play.dataset.mediaOpen);
  const photograph = event.target.closest('[data-gallery-open]');
  if (photograph) { showGalleryImage(Number(photograph.dataset.galleryOpen)); openDialog($('#gallery-dialog')); }
  if (event.target.closest('[data-sources-open]')) openDialog($('#sources-dialog'));
});

// Mouse-hover previews are loaded only on demand. The complete files remain in the ZIP.
const previewVideos = new Map();
function pausePreviews() {
  for (const [button, video] of previewVideos) { video.pause(); button.classList.remove('is-playing'); }
}
for (const button of $$('.reel-image-button')) {
  const item = media.find(entry => entry.id === button.dataset.mediaOpen);
  if (item?.type !== 'video') continue;
  button.addEventListener('pointerenter', event => {
    if (!motionEnabled || !finePointer.matches || event.pointerType === 'touch' || $('dialog[open]')) return;
    let video = previewVideos.get(button);
    if (!video) {
      video = document.createElement('video'); video.src = item.src; video.poster = item.poster;
      video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
      video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1; button.append(video); previewVideos.set(button, video);
    }
    video.play().then(() => button.classList.add('is-playing')).catch(() => {});
  });
  button.addEventListener('pointerleave', () => {
    previewVideos.get(button)?.pause(); button.classList.remove('is-playing');
  });
}
const videoVisibility = new IntersectionObserver(entries => {
  for (const entry of entries) if (!entry.isIntersecting) {
    const video = previewVideos.get(entry.target);
    video?.pause(); entry.target.classList.remove('is-playing');
  }
});
$$('.reel-image-button').forEach(button => videoVisibility.observe(button));

// Carousel: touch swipe, mouse drag, keyboard and explicit previous/next controls.
function carouselStep(direction) {
  const first = $$('.reel-card', track).find(card => !card.hidden);
  if (first) viewport.scrollBy({ left: direction * (first.offsetWidth + 24), behavior: motionEnabled ? 'smooth' : 'instant' });
}
$('#work-prev').addEventListener('click', () => carouselStep(-1));
$('#work-next').addEventListener('click', () => carouselStep(1));
function updateCarouselControls() {
  const max = viewport.scrollWidth - viewport.clientWidth;
  $('#work-prev').disabled = viewport.scrollLeft < 4;
  $('#work-next').disabled = viewport.scrollLeft >= max - 4;
}
viewport.addEventListener('scroll', updateCarouselControls, { passive: true });
viewport.addEventListener('keydown', event => {
  if (event.target !== viewport) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); carouselStep(1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); carouselStep(-1); }
});
let drag = null, preventCarouselClick = false;
viewport.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  drag = { x: event.clientX, scroll: viewport.scrollLeft, pointer: event.pointerId, moved: false };
  preventCarouselClick = false;
});
viewport.addEventListener('pointermove', event => {
  if (!drag) return;
  const delta = event.clientX - drag.x;
  if (!drag.moved && Math.abs(delta) > 8) {
    drag.moved = true; viewport.classList.add('is-dragging'); viewport.setPointerCapture(drag.pointer); pausePreviews();
  }
  if (drag.moved) { event.preventDefault(); viewport.scrollLeft = drag.scroll - delta; }
});
function endDrag() {
  if (!drag) return;
  preventCarouselClick = drag.moved;
  if (viewport.hasPointerCapture(drag.pointer)) viewport.releasePointerCapture(drag.pointer);
  viewport.classList.remove('is-dragging'); drag = null;
}
viewport.addEventListener('pointerup', endDrag);
viewport.addEventListener('pointercancel', endDrag);
window.addEventListener('pointerup', endDrag);
viewport.addEventListener('click', event => {
  if (preventCarouselClick) { event.preventDefault(); event.stopPropagation(); preventCarouselClick = false; }
}, true);
for (const filter of $$('[data-filter]')) {
  filter.addEventListener('click', () => {
    pausePreviews();
    $$('[data-filter]').forEach(button => { const active = button === filter; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
    let count = 0;
    for (const card of $$('.reel-card', track)) {
      card.hidden = filter.dataset.filter !== 'all' && card.dataset.category !== filter.dataset.filter;
      if (!card.hidden) count++;
    }
    $('#visible-work-count').textContent = String(count).padStart(2, '0');
    viewport.scrollTo({ left: 0, behavior: 'instant' });
    if (motionEnabled) gsap.fromTo($$('.reel-card:not([hidden])', track), { y: 20, opacity: .25 }, { y: 0, opacity: 1, duration: .45, stagger: .06, clearProps: 'opacity,transform' });
    requestAnimationFrame(updateCarouselControls);
  });
}
new ResizeObserver(updateCarouselControls).observe(viewport);

// Mobile menu keeps every in-page section reachable.
const menuToggle = $('#menu-toggle'), menu = $('#mobile-menu');
function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Open navigation');
  document.body.classList.remove('dialog-is-open'); lenis?.start();
}
menuToggle.addEventListener('click', () => {
  const opening = menu.hidden;
  if (!opening) { closeMenu(); return; }
  menu.hidden = false; menuToggle.setAttribute('aria-expanded', 'true'); menuToggle.setAttribute('aria-label', 'Close navigation');
  document.body.classList.add('dialog-is-open'); lenis?.stop();
  if (motionEnabled) gsap.fromTo($$('a', menu), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .4, clearProps: 'all' });
});
menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuToggle.focus(); }
  if (!menu.hidden && event.key === 'Tab') {
    const items = [menuToggle, ...$$('a', menu)];
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(); }, { passive: true });

// A real local action: compose a brief. No fake submission or fabricated email address.
$('#brief-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const value = key => String(data.get(key) || '').trim();
  if (!value('name') || !value('brand') || value('message').length < 10) { showToast('Please add a name, project and a short description.'); return; }
  $('#generated-brief').value = 'Hi Tanveer / SocialBridge team,\n\nMy name is ' + value('name') + ' and I am reaching out for ' + value('brand') + '.\n\nEnquiry: ' + value('type') + '\n\n' + value('message') + '\n\nPlease share availability, the collaboration process and relevant charges. Thank you!';
  openDialog($('#brief-dialog'));
});
$('#copy-brief').addEventListener('click', async () => {
  const textarea = $('#generated-brief');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(textarea.value);
    showToast('Brief copied. Open Instagram to send it.');
  } catch {
    textarea.focus(); textarea.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* manual fallback below */ }
    showToast(copied ? 'Brief copied. Open Instagram to send it.' : 'Brief selected. Press Ctrl+C or use Copy on your device.');
  }
});

// Keep source content visible when animations are off, reduced or unsupported.
function setupMotion(enabled) {
  motionEnabled = enabled;
  document.documentElement.classList.toggle('motion-paused', !enabled);
  $('#motion-toggle').setAttribute('aria-pressed', String(enabled));
  $('.motion-label').textContent = enabled ? 'Motion on' : 'Motion off';
  motionMedia?.revert(); motionMedia = null;
  motionContext?.revert(); motionContext = null;
  if (tickerCallback) gsap.ticker.remove(tickerCallback);
  tickerCallback = null;
  lenis?.destroy(); lenis = null;
  if (!enabled) {
    if (entranceTimeline) { entranceTimeline.progress(1).kill(); entranceTimeline = null; }
    pausePreviews();
    $('#preloader').style.display = 'none';
    gsap.set('.hero-line>span,.hero-enter,.hero-visual', { clearProps: 'all' });
    gsap.killTweensOf('.magnetic,.tilt-card');
    gsap.set('.magnetic,.tilt-card', { clearProps: 'transform' });
    scene?.setMotion(false);
    entranceDone = true;
    return;
  }
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  tickerCallback = time => lenis?.raf(time * 1000);
  gsap.ticker.add(tickerCallback); gsap.ticker.lagSmoothing(0);
  if ($('dialog[open]') || !menu.hidden) lenis.stop();
  initScrollAnimations();
  scene?.setMotion(!$('dialog[open]'));
  if (!entranceDone) playEntrance();
  else $('#preloader').style.display = 'none';
}

function playEntrance() {
  entranceDone = true;
  const loader = $('#preloader'), value = { count: 0 };
  loader.style.animation = 'none';
  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  entranceTimeline = tl;
  tl.to(value, { count: 100, duration: 1.35, ease: 'power2.inOut', onUpdate: () => { $('#loader-count').textContent = String(Math.floor(value.count)).padStart(2, '0'); } }, 0);
  tl.to('.loader-line', { width: '100%', duration: 1.35 }, 0);
  tl.from('.loader-word', { y: 55, opacity: 0, duration: .75 }, .05);
  tl.to('.loader-word i', { rotation: 180, duration: 1.4 }, 0);
  tl.to(loader, { yPercent: -101, duration: .85, onComplete: () => { loader.style.display = 'none'; } }, 1.35);
  tl.from('.hero-line>span', { yPercent: 115, skewY: 4, stagger: .14, duration: 1.15, ease: 'power4.out', clearProps: 'transform' }, 1.65);
  tl.from('.hero-enter', { y: 20, opacity: 0, stagger: .1, duration: .8, ease: 'power2.out', clearProps: 'all' }, 1.8);
  tl.from('.hero-visual', { y: 75, rotation: -9, opacity: 0, duration: 1.3, ease: 'power3.out', clearProps: 'all' }, 1.55);
  tl.from('.header', { y: -20, opacity: 0, duration: .7, clearProps: 'all' }, 1.9);
}

function initScrollAnimations() {
  motionContext = gsap.context(() => {
    for (const element of $$('[data-reveal]')) {
      gsap.from(element, { y: 38, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
    }
    for (const element of $$('[data-count]')) {
      const counter = { value: 0 }, target = Number(element.dataset.count), decimals = Number(element.dataset.decimals || 0);
      gsap.to(counter, { value: target, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 95%', once: true }, onUpdate: () => { element.textContent = counter.value.toFixed(decimals); }, onComplete: () => { element.textContent = target.toFixed(decimals); } });
    }
    gsap.from('.city-fill', { scaleX: 0, duration: 1.2, stagger: .13, ease: 'power3.out', scrollTrigger: { trigger: '.audience-data', start: 'top 80%', once: true } });
    gsap.from('.city-row-main', { y: 20, opacity: 0, duration: .7, stagger: .1, scrollTrigger: { trigger: '.audience-data', start: 'top 80%', once: true } });
    gsap.from('.gallery-image', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, stagger: .08, ease: 'power3.inOut', scrollTrigger: { trigger: '.gallery-grid', start: 'top 85%', once: true } });
    gsap.from('.reel-image-button', { y: 60, opacity: 0, rotation: 2, duration: .9, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.reels-viewport', start: 'top 88%', once: true } });
    gsap.from('.profile-facts>div', { y: 18, opacity: 0, duration: .6, stagger: .08, scrollTrigger: { trigger: '.profile-facts', start: 'top 90%', once: true } });
    gsap.from('.about-scribble path', { strokeDasharray: 300, strokeDashoffset: 300, duration: 1.2, scrollTrigger: { trigger: '.about-scribble', start: 'top 88%', once: true } });
    gsap.from('.film-credits dl>div', { x: 20, opacity: 0, duration: .7, stagger: .08, scrollTrigger: { trigger: '.film-credits', start: 'top 82%', once: true } });
    gsap.from('.contact-links>a', { x: -30, opacity: 0, duration: .8, stagger: .12, scrollTrigger: { trigger: '.contact-links', start: 'top 90%', once: true } });
    gsap.from('.brief-form label', { y: 18, opacity: 0, duration: .6, stagger: .07, scrollTrigger: { trigger: '.brief-form', start: 'top 87%', once: true } });
    gsap.from('.closing-word>span', { yPercent: 110, duration: 1.2, stagger: .12, ease: 'power4.out', scrollTrigger: { trigger: '.closing-word', start: 'top 95%', once: true } });
    gsap.to('.closing-word>i', { rotation: 165, ease: 'none', scrollTrigger: { trigger: '.connect', start: 'top 80%', end: 'bottom bottom', scrub: 1.5 } });
    gsap.to('.film-image>img', { scale: 1.16, yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.film', start: 'top bottom', end: 'bottom top', scrub: 1.1 } });
    gsap.to('.question', { rotation: -5, repeat: -1, yoyo: true, duration: 1.5, ease: 'sine.inOut' });
  });
  motionMedia = gsap.matchMedia();
  motionMedia.add('(min-width: 701px)', () => {
    gsap.to('.hero-photo-wrap', { y: -65, rotation: -2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 } });
    gsap.to('.hero-outline', { rotation: 9, y: 45, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.8 } });
    gsap.to('.hero-copy', { y: 90, opacity: .35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 10%', scrub: 1 } });
    gsap.to('.play-sticker', { rotation: 7, y: -25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.6 } });
    gsap.to('.about-scribble', { rotation: 12, y: -20, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.to('.gallery-item:nth-child(2n)', { y: -40, ease: 'none', scrollTrigger: { trigger: '.gallery-grid', start: 'top bottom', end: 'bottom top', scrub: 1.4 } });
    gsap.to('.work-heading-side>.asterisk-spin', { y: -20, ease: 'none', scrollTrigger: { trigger: '.work', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
  });
  ScrollTrigger.refresh();
}

// Pointer details: magnetic controls, a responsive card and a contextual cursor.
if (finePointer.matches) {
  const cursor = $('.cursor');
  const moveX = gsap.quickTo(cursor, 'x', { duration: .15, ease: 'power3' });
  const moveY = gsap.quickTo(cursor, 'y', { duration: .15, ease: 'power3' });
  window.addEventListener('pointermove', event => {
    if (!motionEnabled) return;
    moveX(event.clientX); moveY(event.clientY);
    const target = event.target.closest('[data-cursor]');
    cursor.classList.toggle('is-view', Boolean(target));
    cursor.classList.toggle('is-link', !target && Boolean(event.target.closest('a,button')));
    $('span', cursor).textContent = target?.dataset.cursor || '';
  }, { passive: true });
  for (const button of $$('.magnetic')) {
    button.addEventListener('pointermove', event => {
      if (!motionEnabled) return;
      const box = button.getBoundingClientRect();
      gsap.to(button, { x: (event.clientX - box.left - box.width / 2) * .14, y: (event.clientY - box.top - box.height / 2) * .18, duration: .35, ease: 'power2.out' });
    });
    button.addEventListener('pointerleave', () => { if (motionEnabled) gsap.to(button, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }); });
  }
  const card = $('.tilt-card');
  card.addEventListener('pointermove', event => {
    if (!motionEnabled) return;
    const box = card.getBoundingClientRect();
    gsap.to(card, { rotationX: -(event.clientY - box.top - box.height / 2) / box.height * 9, rotationY: (event.clientX - box.left - box.width / 2) / box.width * 10, duration: .6, ease: 'power2.out', transformPerspective: 1000 });
  });
  card.addEventListener('pointerleave', () => { if (motionEnabled) gsap.to(card, { rotationX: 0, rotationY: 0, duration: .8, ease: 'power2.out' }); });
}

function updatePagePosition() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  $('.scroll-progress span').style.transform = 'scaleX(' + progress + ')';
  $('#header').classList.toggle('is-scrolled', window.scrollY > 80);
}
window.addEventListener('scroll', updatePagePosition, { passive: true });
window.addEventListener('resize', updatePagePosition, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) pausePreviews(); });

$('#motion-toggle').addEventListener('click', () => {
  const next = !motionEnabled;
  try { localStorage.setItem('tannu-motion', next ? 'on' : 'off'); } catch { /* optional preference */ }
  savedMotion = next ? 'on' : 'off';
  setupMotion(next);
  showToast(next ? 'Motion on — enjoy the experience.' : 'Motion off — all content remains available.');
});
reducedQuery.addEventListener('change', event => { if (!savedMotion) setupMotion(!event.matches); });
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.defaultPrevented) return;
  const href = anchor.getAttribute('href');
  if (!href || href === '#') return;
  const destination = document.getElementById(href.slice(1));
  if (!destination) return;
  event.preventDefault(); closeMenu();
  if (lenis && motionEnabled) lenis.scrollTo(destination, { offset: -75, duration: 1.2 });
  else destination.scrollIntoView({ behavior: 'instant', block: 'start' });
  history.replaceState(null, '', href);
});

scene = createHeroScene($('#scene-stage'), motionEnabled);
setupMotion(motionEnabled);
updatePagePosition(); updateCarouselControls();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => { ScrollTrigger.refresh(); updatePagePosition(); }, { once: true });
window.addEventListener('pagehide', () => { pausePreviews(); scene?.destroy(); lenis?.destroy(); });
