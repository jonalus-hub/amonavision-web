/* AmonaVision – the frame and the family chat, simulated in the browser.

   A simplified recreation of the real frame (viewer.py) and bot: nothing leaves
   the browser. Photos and videos a visitor adds stay as local blob: URLs, and
   recordings are only kept in memory. Behaviour copied from the frame:
   - four buttons: Back / Play / Reply (hold) / Next;
   - "Play" / "Reply" hints above the play and record buttons (the frame's
     tutorial mode, so they always show when there is something to play);
   - a voice icon while a voice note plays, a "no voice" badge for 5 s when Play
     is pressed on a photo without one, a pulsing red circle with a timer while
     recording, recordings under 1 s discarded;
   - the slideshow moves on every 10 s;
   - voice notes pair with a photo by replying to it in the chat. */
(() => {
  'use strict';
  const AV = window.AV;
  const t = (...a) => AV.t(...a);
  const $ = s => document.querySelector(s);

  const canvas = $('#screen');
  if (!canvas || !AV) return;
  const ctx = canvas.getContext('2d');

  const W = 1024, H = 600;            // the real panel
  const BTN_OFFSET = 10 * W / 230;    // viewer.py: hints sit 1 cm off centre on a 230 mm wide panel
  const HINT_Y = H - 48;              // config.txt [Overlay] bottom_margin_px
  const SLIDE_MS = 10000;             // config.txt [Viewer] slideshow_interval
  const BADGE_MS = 5000;              // the "no voice" badge
  const MIN_REC_S = 1;                // shorter recordings are discarded, as on the frame
  const MAX_FILE = 200 * 1024 * 1024; // keep a huge local file from eating the tab's memory
  const FONT = '"Plus Jakarta Sans", Helvetica, Arial, sans-serif';
  const CREAM = '#faf7f2', DARK = '#121212';   // the illustrations' palette, with the orange accent

  const frameEl = $('#frame');
  const msgsEl = $('#msgs');
  const liveEl = $('#frameLive');
  const statusEl = $('#chatStatus');
  const sampleBtn = $('#sampleBtn');
  const micToggle = $('#micToggle');
  const micHint = $('#micHint');

  // ------------------------------------------------------------------ content
  // Drawn with the characters of the illustrations: the child with the orange curl,
  // the brown-haired mother in orange and the blond adult in grey.
  const SEED = [
    { sender: 'Emma', kind: 'photo', file: 'beach.png', voice: '01-beach-walk', time: '10:12' },
    { sender: 'Leo', kind: 'photo', file: 'picnic.png', voice: '03-picnic-dog', time: '13:47' },
    { sender: 'Sara', kind: 'photo', file: 'bedtime.png', voice: '07-bedtime-story', time: '19:58' },
    { sender: 'Sara', kind: 'video', file: 'hello', time: '20:05' },
  ];
  const SAMPLES = ['flower.png'];   // the photo the visitor sends in step 1
  let sampleNext = 0;

  const sessions = [];   // what the frame can show, in arrival order
  const messages = [];   // the chat
  let msgSeq = 1;
  let cur = -1;
  let state = 'IDLE';    // IDLE | WAITING | PLAYING | RECORDING
  let currentPlayed = false;
  let slideStart = performance.now();
  let badgeUntil = 0;
  let replyTo = null;
  let micStream = null;
  let visible = true;

  // The sample voices speak a made-up cartoon language, so one set serves both page languages.
  const voiceUrl = v => v.url || `media/voice/${v.key}.mp3`;
  const now = () => performance.now();
  const clock = () => new Date().toTimeString().slice(0, 5);

  // ------------------------------------------------------------------ screen
  const audioEl = new Audio();
  audioEl.preload = 'auto';
  const videoEl = document.createElement('video');
  videoEl.playsInline = true;
  videoEl.preload = 'auto';
  // Builds of Chromium without H.264 get the WebM copy of the sample video.
  const VIDEO_EXT = videoEl.canPlayType('video/mp4; codecs="avc1.64001F"') ? 'mp4' : 'webm';

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function size(media) {
    return [media.naturalWidth || media.videoWidth || media.width, media.naturalHeight || media.videoHeight || media.height];
  }

  // The frame letterboxes each photo over a blurred, enlarged copy of itself.
  function compose(media) {
    const [iw, ih] = size(media);
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const g = out.getContext('2d');
    const tiny = document.createElement('canvas');
    tiny.width = 32; tiny.height = 19;
    const tg = tiny.getContext('2d');
    const cs = Math.max(32 / iw, 19 / ih);
    tg.drawImage(media, (32 - iw * cs) / 2, (19 - ih * cs) / 2, iw * cs, ih * cs);
    const mid = document.createElement('canvas');   // two steps up: a smooth blur, without ctx.filter
    mid.width = 128; mid.height = 75;
    const mg = mid.getContext('2d');
    mg.imageSmoothingQuality = 'high';
    mg.drawImage(tiny, 0, 0, 128, 75);
    g.imageSmoothingQuality = 'high';
    g.drawImage(mid, 0, 0, W, H);
    g.fillStyle = 'rgba(0, 0, 0, 0.15)';
    g.fillRect(0, 0, W, H);
    const s = Math.min(W / iw, H / ih);
    g.drawImage(media, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
    return out;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function pill(text, cx, cy) {
    ctx.font = `700 30px ${FONT}`;
    const w = ctx.measureText(text).width + 36, h = 54;
    const x = Math.max(4, Math.min(cx - w / 2, W - w - 4)), y = Math.max(4, Math.min(cy - h / 2, H - h - 4));
    ctx.fillStyle = 'rgba(18, 18, 18, 0.88)';
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  }

  function speaker(cx, cy, sz, muted) {
    const u = sz / 64;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = CREAM;
    ctx.strokeStyle = CREAM;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-22 * u, -8 * u); ctx.lineTo(-12 * u, -8 * u); ctx.lineTo(2 * u, -20 * u);
    ctx.lineTo(2 * u, 20 * u); ctx.lineTo(-12 * u, 8 * u); ctx.lineTo(-22 * u, 8 * u);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 4.5 * u;
    if (muted) {
      ctx.beginPath(); ctx.moveTo(10 * u, -9 * u); ctx.lineTo(26 * u, 9 * u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26 * u, -9 * u); ctx.lineTo(10 * u, 9 * u); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(4 * u, 0, 12 * u, -0.9, 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(4 * u, 0, 21 * u, -0.9, 0.9); ctx.stroke();
    }
    ctx.restore();
  }

  function disc(cx, cy, r, alpha) {
    ctx.fillStyle = `rgba(18, 18, 18, ${alpha})`;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  function recIndicator(ms) {
    const elapsed = (ms - recStart) / 1000;
    const pulse = Math.abs(Math.sin(ms / 1000 * 2.5));
    const r = 55 + pulse * 20;
    disc(W / 2, H / 2, r + 30, 0.31);
    ctx.fillStyle = `rgba(232, 40, 40, ${(160 + pulse * 95) / 255})`;   // red, as on the frame
    ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.fill();
    const s = Math.floor(elapsed);
    ctx.font = `800 ${Math.round(r * 0.62)}px ${FONT}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, W / 2, H / 2 + 2);
  }

  function hasMedia(s) { return !!(s && (s.voice || s.kind === 'video')); }

  function draw() {
    const ms = now();
    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(0, 0, W, H);
    const s = sessions[cur];
    if (!s) {
      ctx.font = `600 34px ${FONT}`;
      ctx.fillStyle = '#a19b92';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('frame.waiting'), W / 2, H / 2);
      return;
    }
    if (state === 'PLAYING' && s.kind === 'video' && videoEl.readyState >= 2) {
      const [vw, vh] = size(videoEl);
      const k = Math.min(W / vw, H / vh);
      ctx.drawImage(videoEl, (W - vw * k) / 2, (H - vh * k) / 2, vw * k, vh * k);
    } else if (s.surface) {
      ctx.drawImage(s.surface, 0, 0);
    }
    if (state === 'WAITING') {
      if (ms < badgeUntil) { disc(W / 2, H / 2, 52, 0.88); speaker(W / 2, H / 2, 80, true); }
      if (hasMedia(s)) {
        if (!currentPlayed) pill(t('frame.play'), W / 2 - BTN_OFFSET, HINT_Y);
        else pill(t('frame.reply'), W / 2 + BTN_OFFSET, HINT_Y);
      }
    } else if (state === 'PLAYING' && s.kind === 'photo') {
      disc(W / 2, H - 52, 42, 0.88);
      speaker(W / 2, H - 52, 64, false);
    } else if (state === 'RECORDING') {
      recIndicator(ms);
    }
  }

  let raf = 0;
  const animating = () => state === 'RECORDING' || (state === 'PLAYING' && sessions[cur]?.kind === 'video') || now() < badgeUntil;
  function frameLoop() { raf = 0; draw(); if (animating()) raf = requestAnimationFrame(frameLoop); }
  function redraw() { if (!raf) raf = requestAnimationFrame(frameLoop); }

  function announce(text) { liveEl.textContent = text; }

  // A message crossing the internet between the phone and the frame, as an orange dot.
  const netEl = $('#net');
  function packet(dir) {
    if (!netEl) return;
    const p = document.createElement('span');
    p.className = 'packet ' + dir;
    p.addEventListener('animationend', () => p.remove());
    netEl.append(p);
    setTimeout(() => p.remove(), 2000);   // also when animations are off
  }
  const TRIP_MS = 850;                     // what a message takes to cross the line

  function describe(s) {
    const who = s.mine ? t('chat.youDative') : s.sender;
    if (s.kind === 'video') return t('live.video', who);
    return t(s.voice ? 'live.photoVoice' : 'live.photo', who);
  }

  // ------------------------------------------------------------------ frame logic
  function stopMedia() {
    audioEl.pause();
    audioEl.removeAttribute('src');
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
  }

  function show(i) {
    if (state === 'RECORDING') return;
    stopMedia();
    if (!sessions.length) { cur = -1; state = 'IDLE'; redraw(); return; }
    cur = (i + sessions.length) % sessions.length;
    state = 'WAITING';
    currentPlayed = false;
    badgeUntil = 0;
    slideStart = now();
    announce(describe(sessions[cur]));
    redraw();
  }

  function play() {
    const s = sessions[cur];
    state = 'PLAYING';
    currentPlayed = true;
    markStep(2);
    announce(t('live.playing'));
    if (s.kind === 'video') {
      videoEl.src = s.video;
      videoEl.muted = !!s.voice;            // a paired voice note replaces the clip's own sound
      videoEl.play().catch(finishPlaying);
    }
    if (s.voice) {
      audioEl.src = voiceUrl(s.voice);
      audioEl.play().catch(finishPlaying);
    }
    redraw();
  }

  function finishPlaying() {
    if (state !== 'PLAYING') return;
    stopMedia();
    state = 'WAITING';
    slideStart = now();
    redraw();
  }
  audioEl.addEventListener('ended', () => { if (sessions[cur]?.kind !== 'video') finishPlaying(); });
  videoEl.addEventListener('ended', finishPlaying);
  videoEl.addEventListener('playing', redraw);

  let recStart = 0, recorder = null, recChunks = [];
  function startRecording() {
    if (cur < 0 || state === 'RECORDING') return;
    stopMedia();
    state = 'RECORDING';
    recStart = now();
    recorder = null;
    if (micStream) {
      try {
        recorder = new MediaRecorder(micStream);
        recChunks = [];
        recorder.ondataavailable = e => { if (e.data.size) recChunks.push(e.data); };
        recorder.start();
      } catch (e) { recorder = null; }
    }
    announce(t('live.recording'));
    redraw();
  }

  function stopRecording() {
    if (state !== 'RECORDING') return;
    const secs = (now() - recStart) / 1000;
    const s = sessions[cur];
    const r = recorder;
    recorder = null;
    state = 'WAITING';
    slideStart = now();
    redraw();
    if (secs < MIN_REC_S) {
      if (r) r.stop();
      announce(t('live.short'));
      return;
    }
    if (r) {
      r.onstop = () => frameReply(s, { url: URL.createObjectURL(new Blob(recChunks, { type: r.mimeType })) });
      r.stop();
    } else {
      frameReply(s, { key: 'grandma-reply' });
    }
  }

  function frameReply(s, voice) {
    packet('to-chat');
    markStep(3);
    setTimeout(() => {
      addMsg({ fromFrame: true, kind: 'voice', voice, replyTo: s.voiceMsgId || s.msgId, time: clock() });
      announce(t('live.sent'));
      markStep(4);
    }, TRIP_MS);
  }

  // Buttons: act on press, like the GPIO callbacks; Reply records while held.
  const pressed = {};
  function keyDown(k) {
    if (pressed[k]) return;
    pressed[k] = true;
    frameEl.querySelector(`.key[data-key="${k}"]`).classList.add('pressed');
    if (k === 'rec') {
      if (state === 'WAITING' || state === 'PLAYING') startRecording();
      return;
    }
    if (state === 'RECORDING' || state === 'IDLE') return;
    if (k === 'left') show(cur - 1);
    else if (k === 'right') show(cur + 1);
    else if (k === 'play') {
      if (state === 'PLAYING') finishPlaying();
      else if (hasMedia(sessions[cur])) play();
      else { badgeUntil = now() + BADGE_MS; announce(t('live.noVoice')); redraw(); }
    }
  }
  function keyUp(k) {
    if (!pressed[k]) return;
    pressed[k] = false;
    frameEl.querySelector(`.key[data-key="${k}"]`).classList.remove('pressed');
    if (k === 'rec') stopRecording();
  }

  frameEl.querySelectorAll('.key').forEach(el => {
    const k = el.dataset.key;
    el.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      el.focus({ preventScroll: true });
      keyDown(k);
    });
    el.addEventListener('pointerup', () => keyUp(k));
    el.addEventListener('pointercancel', () => keyUp(k));
    el.addEventListener('contextmenu', e => e.preventDefault());
  });

  const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ' ': 'play', r: 'rec', R: 'rec' };
  function keyFor(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('key')) return e.target.dataset.key;
    return KEYMAP[e.key];
  }
  frameEl.addEventListener('keydown', e => {
    const k = keyFor(e);
    if (!k) return;
    e.preventDefault();
    if (!e.repeat) keyDown(k);
  });
  frameEl.addEventListener('keyup', e => {
    const k = keyFor(e);
    if (k) { e.preventDefault(); keyUp(k); }
  });
  window.addEventListener('blur', () => Object.keys(pressed).forEach(keyUp));

  // The slideshow moves on by itself, as on the frame (paused while the demo is off screen).
  setInterval(() => {
    if (state === 'WAITING' && visible && !document.hidden && sessions.length > 1 && now() - slideStart >= SLIDE_MS) show(cur + 1);
  }, 500);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) slideStart = now(); }).observe(frameEl);
  }

  // ------------------------------------------------------------------ chat
  function nameOf(m) {
    if (m.mine) return t('chat.you');
    if (m.fromFrame) return t('chat.frame');
    if (m.bot) return 'AmonaVision';
    return m.sender;
  }
  function summary(m) {
    if (m.kind === 'photo') return '📷 ' + t('chat.photo');
    if (m.kind === 'video') return '🎬 ' + t('chat.video');
    if (m.kind === 'voice') return '🎙️ ' + t('chat.voiceNote');
    return (m.textKey ? t(m.textKey) : m.text).replace(/\*/g, '').slice(0, 60);
  }
  function appendFormatted(el, str) {   // *bold*, as Telegram Markdown; built as nodes, never as HTML
    str.split(/(\*[^*\n]+\*)/).forEach(part => {
      if (/^\*[^*\n]+\*$/.test(part)) { const b = document.createElement('b'); b.textContent = part.slice(1, -1); el.append(b); }
      else if (part) el.append(part);
    });
  }

  function msgEl(m) {
    const el = document.createElement('div');
    el.className = 'msg' + (m.mine ? ' mine' : '') + (m.bot ? ' bot' : '') + (m.fromFrame ? ' from-frame' : '');
    el.id = 'm' + m.id;
    if (!m.mine) {
      const sender = document.createElement('div');
      sender.className = 'sender';
      sender.textContent = m.fromFrame ? t('chat.fromFrame') : nameOf(m);
      el.append(sender);
    }
    const parent = m.replyTo && messages.find(x => x.id === m.replyTo);
    if (parent) {
      const q = document.createElement('button');
      q.type = 'button';
      q.className = 'quote';
      q.dataset.goto = parent.id;
      q.textContent = `${nameOf(parent)}: ${summary(parent)}`;
      el.append(q);
    }
    if (m.kind === 'photo') {
      const img = document.createElement('img');
      img.src = m.src;
      img.alt = `${t('chat.photo')} – ${nameOf(m)}`;
      img.loading = 'lazy';
      img.addEventListener('load', keepBottom);
      el.append(img);
    } else if (m.kind === 'video') {
      const v = document.createElement('video');
      v.src = m.src;
      if (m.poster) v.poster = m.poster;
      v.controls = true;
      v.preload = 'none';
      v.playsInline = true;
      v.setAttribute('aria-label', `${t('chat.video')} – ${nameOf(m)}`);
      el.append(v);
    } else if (m.kind === 'voice') {
      const a = document.createElement('audio');
      a.src = voiceUrl(m.voice);
      a.controls = true;
      a.preload = 'none';
      a.setAttribute('aria-label', `${t('chat.voiceNote')} – ${nameOf(m)}`);
      el.append(a);
    } else {
      const d = document.createElement('div');
      d.className = 'text';
      appendFormatted(d, m.textKey ? t(m.textKey) : m.text);
      el.append(d);
    }
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.append(m.time);
    if (m.kind === 'photo' || m.kind === 'video') {
      const rb = document.createElement('button');
      rb.type = 'button';
      rb.className = 'reply-btn';
      rb.dataset.reply = m.id;
      rb.textContent = '↩ ' + t('chat.reply');
      meta.append(rb);
    }
    el.append(meta);
    return el;
  }

  let stick = true;
  msgsEl.addEventListener('scroll', () => { stick = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 80; });
  function keepBottom() { if (stick) msgsEl.scrollTop = msgsEl.scrollHeight; }

  function renderChat() {
    msgsEl.replaceChildren(...messages.map(msgEl));
    stick = true;
    keepBottom();
  }
  function addMsg(m) {
    m.id = msgSeq++;
    messages.push(m);
    msgsEl.append(msgEl(m));
    stick = true;
    keepBottom();
    return m;
  }
  function botSay(textKey, replyToId) {
    setTimeout(() => {
      packet('to-chat');
      setTimeout(() => addMsg({ bot: true, kind: 'text', textKey, replyTo: replyToId, time: clock() }), TRIP_MS);
    }, 500);
  }
  function setStatus(key) {
    statusEl.textContent = key ? t(key) : '';
    statusEl.dataset.key = key || '';
  }

  function setReply(id) {
    replyTo = id;
    const m = messages.find(x => x.id === id);
    $('#replyBar').hidden = !m;
    if (m) { $('#replyText').textContent = t('chat.replyTo', nameOf(m), summary(m)); $('#textInput').focus(); }
  }
  msgsEl.addEventListener('click', e => {
    const r = e.target.closest('[data-reply]');
    if (r) { setReply(+r.dataset.reply); return; }
    const q = e.target.closest('[data-goto]');
    if (q) {
      const el = document.getElementById('m' + q.dataset.goto);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 1200);
      }
    }
  });
  $('#replyCancel').addEventListener('click', () => setReply(null));

  // ------------------------------------------------------------------ the family sends things
  function sessionOfMsg(id) { return sessions.find(s => s.msgId === id); }

  async function sendPhoto(src, { sample = false } = {}) {
    let img;
    try { img = await loadImage(src); } catch (e) { setStatus('chat.badFile'); return; }
    setStatus(null);
    const m = addMsg({ mine: true, kind: 'photo', src, time: clock() });
    packet('to-frame');
    sessions.push({ kind: 'photo', mine: true, surface: compose(img), msgId: m.id });
    const idx = sessions.length - 1;
    setTimeout(() => show(idx), TRIP_MS);   // what the family sends shows up on the frame
    botSay('bot.photoSaved', m.id);
    markStep(1);
    if (!sample) setReply(null);
  }

  function videoStill(url) {
    return new Promise(resolve => {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
      v.addEventListener('loadeddata', () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); }, { once: true });
      v.addEventListener('seeked', () => resolve(v), { once: true });
      v.addEventListener('error', () => resolve(null), { once: true });
    });
  }

  async function sendVideo(url) {
    const still = await videoStill(url);
    if (!still) { setStatus('chat.badFile'); return; }
    setStatus(null);
    const surface = compose(still);
    const poster = document.createElement('canvas');
    poster.width = 480; poster.height = 270;
    poster.getContext('2d').drawImage(surface, 0, 0, 480, 270);
    const m = addMsg({ mine: true, kind: 'video', src: url, poster: poster.toDataURL('image/jpeg', 0.8), time: clock() });
    packet('to-frame');
    sessions.push({ kind: 'video', mine: true, video: url, surface, msgId: m.id });
    const idx = sessions.length - 1;
    setTimeout(() => show(idx), TRIP_MS);
    botSay('bot.videoSaved', m.id);
    markStep(1);
    setReply(null);
  }

  function sendVoice(url) {
    const target = replyTo && messages.find(x => x.id === replyTo);
    const m = addMsg({ mine: true, kind: 'voice', voice: { url }, replyTo: target ? target.id : null, time: clock() });
    packet('to-frame');
    setReply(null);
    const s = target && sessionOfMsg(target.id);
    if (!s) { botSay('bot.voiceNeedsReply', m.id); return; }
    s.voice = { url };
    s.voiceMsgId = m.id;
    botSay('bot.photoVoiceSaved', m.id);
    setTimeout(() => show(sessions.indexOf(s)), TRIP_MS);
  }

  function sendText(text) {
    const m = addMsg({ mine: true, kind: 'text', text, replyTo, time: clock() });
    packet('to-frame');
    setReply(null);
    if (text.startsWith('/')) {
      const cmd = text.slice(1).split(/[\s@]/)[0].toLowerCase();
      botSay(cmd === 'help' || cmd === 'start' ? 'bot.help' : 'bot.blocked', m.id);
    } else {
      botSay('bot.unknown', m.id);
    }
  }

  $('#composer').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#textInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendText(text);
  });

  $('#fileInput').addEventListener('change', e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE || !/^(image|video)\//.test(f.type)) { setStatus('chat.badFile'); return; }
    const url = URL.createObjectURL(f);   // stays in this browser
    if (f.type.startsWith('video/')) sendVideo(url); else sendPhoto(url);
  });

  sampleBtn.addEventListener('click', () => {
    if (sampleNext >= SAMPLES.length) return;
    sendPhoto(`media/photos/${SAMPLES[sampleNext++]}`, { sample: true });
    if (sampleNext >= SAMPLES.length) {
      sampleBtn.disabled = true;
      sampleBtn.dataset.i18n = 'step1.none';
      sampleBtn.textContent = t('step1.none');
    }
  });

  // Voice notes from the chat: hold the microphone button.
  const voiceBtn = $('#voiceBtn');
  let chatRec = null, chatRecStart = 0, chatChunks = [];
  voiceBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!micStream) { setStatus('chat.needMic'); return; }
    try { voiceBtn.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    try {
      chatRec = new MediaRecorder(micStream);
      chatChunks = [];
      chatRec.ondataavailable = ev => { if (ev.data.size) chatChunks.push(ev.data); };
      chatRec.start();
      chatRecStart = now();
      voiceBtn.classList.add('recording');
      setStatus('chat.recording');
    } catch (err) { chatRec = null; setStatus('demo.micUnavailable'); }
  });
  const voiceUp = () => {
    const r = chatRec;
    chatRec = null;
    voiceBtn.classList.remove('recording');
    if (!r) return;
    const secs = (now() - chatRecStart) / 1000;
    r.onstop = () => {
      if (secs < MIN_REC_S) { setStatus('chat.tooShort'); return; }
      setStatus(null);
      sendVoice(URL.createObjectURL(new Blob(chatChunks, { type: r.mimeType })));
    };
    r.stop();
  };
  voiceBtn.addEventListener('pointerup', voiceUp);
  voiceBtn.addEventListener('pointercancel', voiceUp);
  voiceBtn.addEventListener('contextmenu', e => e.preventDefault());

  // ------------------------------------------------------------------ microphone
  function setMicHint(key) { micHint.dataset.i18n = key; micHint.textContent = t(key); }
  micToggle.addEventListener('change', async () => {
    if (!micToggle.checked) {
      if (micStream) micStream.getTracks().forEach(tr => tr.stop());
      micStream = null;
      setMicHint('demo.micHint');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      micToggle.checked = false;
      setMicHint('demo.micUnavailable');
      return;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      setMicHint('demo.micHint');
    } catch (e) {
      micToggle.checked = false;
      setMicHint('demo.micDenied');
    }
  });

  // ------------------------------------------------------------------ steps
  function markStep(n) {
    const li = document.querySelector(`.step[data-step="${n}"]`);
    if (li) li.classList.add('done');
  }

  // ------------------------------------------------------------------ language
  AV.onLang(() => {
    if (state === 'PLAYING') finishPlaying();
    renderChat();
    if (replyTo) setReply(replyTo);
    if (statusEl.dataset.key) setStatus(statusEl.dataset.key);
    if (cur >= 0) announce(describe(sessions[cur]));
    redraw();
  });

  // ------------------------------------------------------------------ start
  async function seed() {
    for (const it of SEED) {
      const isVideo = it.kind === 'video';
      const src = isVideo ? `media/video/${it.file}.${VIDEO_EXT}` : `media/photos/${it.file}`;
      const stillSrc = isVideo ? `media/video/${it.file}.jpg` : src;
      const m = addMsg({ sender: it.sender, kind: it.kind, src, poster: isVideo ? stillSrc : null, time: it.time });
      const sess = { kind: it.kind, sender: it.sender, msgId: m.id, video: isVideo ? src : null, stillSrc };
      sessions.push(sess);
      addMsg({ bot: true, kind: 'text', textKey: isVideo ? 'bot.videoSaved' : 'bot.photoSaved', replyTo: m.id, time: it.time });
      if (it.voice) {
        const v = addMsg({ sender: it.sender, kind: 'voice', voice: { key: it.voice }, replyTo: m.id, time: it.time });
        addMsg({ bot: true, kind: 'text', textKey: 'bot.photoVoiceSaved', replyTo: v.id, time: it.time });
        sess.voice = { key: it.voice };
        sess.voiceMsgId = v.id;
      }
    }
    // The frame starts on the first photo; the others load behind it.
    await Promise.all(sessions.map(async (s, i) => {
      try { s.surface = compose(await loadImage(s.stillSrc)); } catch (e) { /* leave it black */ }
      if (i === 0) show(0);
    }));
    if (cur < 0) show(0);
  }

  const fontReady = document.fonts && document.fonts.load ? document.fonts.load(`700 30px ${FONT}`) : Promise.resolve();
  fontReady.catch(() => {}).then(redraw);
  redraw();
  seed();
})();
