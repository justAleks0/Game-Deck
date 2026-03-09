/*
 Game Deck - Wii Channels style
 - Grid layout for games and shortcuts
 - Direct click to open tools or activate shortcut
*/

const BUTTON_SOUND_URLS = [
  "https://github.com/justAleks0/waste-files/raw/6aa812751c01728491f6182f09cc2f721bbd1e48/sfx/button%201%20new.mp3",
  "https://github.com/justAleks0/waste-files/raw/b3f9a5c537caa08dedf4e506e6a536ec772dace1/sfx/button%202.mp3",
  "https://github.com/justAleks0/waste-files/raw/b3f9a5c537caa08dedf4e506e6a536ec772dace1/sfx/button%203.mp3"
];

const BUTTON_BASE_VOLUME = 0.32;
let buttonAudioPool = [];

/* Insert / cassette lock sound for new shortcut creation */
const INSERT_SOUND_URL = "https://github.com/justAleks0/waste-files/raw/d6773a4fb25f5a507c8b6ff6339c3590a0faca9d/sfx/insert.mp3";
let insertAudio = null;

function preloadButtonSounds(){
  buttonAudioPool = BUTTON_SOUND_URLS.map(url=>{
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = BUTTON_BASE_VOLUME;
    // kick off loading
    try{
      audio.load();
    }catch(e){
      // ignore load errors
    }
    return audio;
  });
}

function playButtonSound(){
  if(!buttonAudioPool.length) return;
  const idx = Math.floor(Math.random() * buttonAudioPool.length);
  const audio = buttonAudioPool[idx];
  if(!audio) return;

  // slight randomization for realism
  const volJitter = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
  const rateJitter = 0.96 + Math.random() * 0.08; // 0.96 - 1.04
  audio.volume = Math.max(0, Math.min(1, BUTTON_BASE_VOLUME * volJitter));
  audio.playbackRate = rateJitter;

  try{
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(()=>{});
  }catch(e){
    // ignore playback errors (e.g. autoplay restrictions)
  }
}

/* Preload the insert sound used for new shortcut creation */
function preloadInsertSound(){
  try{
    insertAudio = new Audio(INSERT_SOUND_URL);
    insertAudio.preload = "auto";
    insertAudio.volume = 0.42;
    insertAudio.load();
  }catch(e){
    insertAudio = null;
  }
}

/* Play the insert sound once, restarting from the beginning each time */
function playInsertSound(){
  if(!insertAudio) return;
  try{
    insertAudio.pause();
    insertAudio.currentTime = 0;
    insertAudio.play().catch(()=>{});
  }catch(e){
    // ignore playback errors
  }
}

const GAMES = [
  {
    name: "Honkai Star Rail",
    image: "https://cdn2.steamgriddb.com/thumb/14219e4acfc4c50d323a47c2a6994299.jpg",
    studio: "HoYoVerse",
    year: 2023,
    tools: [
      { label: "Characters", href: "https://www.prydwen.gg/star-rail/characters" },
      { label: "Light Cones", href: "https://www.prydwen.gg/star-rail/light-cones" },
      { label: "Tier List", href: "https://www.prydwen.gg/star-rail/tier-list" }
    ]
  },
  {
    name: "Genshin Impact",
    image: "https://cdn2.steamgriddb.com/thumb/17ac85cc7b94b7e29577acb5f9b38aa7.jpg",
    studio: "HoYoVerse",
    year: 2020,
    tools: [
      { label: "Characters", href: "https://game8.co/games/Genshin-Impact/archives/296707" },
      { label: "Weapons", href: "https://game8.co/games/Genshin-Impact/archives/297497" },
      { label: "Tier List", href: "https://game8.co/games/Genshin-Impact/archives/297465" }
    ]
  },
  {
    name: "Zenless Zone Zero",
    image: "https://cdn2.steamgriddb.com/thumb/97657e12f1b8cbf71b6837f02b23d423.jpg",
    studio: "HoYoVerse",
    year: 2024,
    tools: [
      { label: "Characters", href: "https://www.prydwen.gg/zenless/characters" },
      { label: "W-Engines", href: "https://www.prydwen.gg/zenless/w-engines" },
      { label: "Tier List", href: "https://www.prydwen.gg/zenless/tier-list" }
    ]
  },
  {
    name: "Wuthering Waves",
    image: "https://cdn2.steamgriddb.com/thumb/7cee9e13ee29834be975c2164736ad4d.jpg",
    studio: "Kuro Games",
    year: 2024,
    tools: [
      { label: "Characters", href: "https://www.prydwen.gg/wuthering-waves/characters/" },
      { label: "Weapons", href: "https://www.prydwen.gg/wuthering-waves/weapons" },
      { label: "Tier List", href: "https://www.prydwen.gg/wuthering-waves/tier-list" }
    ]
  }
];

const CUSTOM_STORAGE_KEY = 'customShortcutsV1';
const CUSTOM_MAIN_GAMES_KEY = 'customMainGamesV1';
const BUILTIN_IMAGES_KEY = 'builtinGameImagesV1';
const BUILTIN_ORDER_KEY = 'builtinOrderV1';
const SHARE_CODE_PREFIX = 'GT1-';

function encodeShareCode(obj){
  try{
    const json = JSON.stringify(obj);
    const uriSafe = encodeURIComponent(json);
    const b64 = btoa(uriSafe);
    return SHARE_CODE_PREFIX + b64;
  }catch(e){
    return '';
  }
}

function decodeShareCode(code){
  if(typeof code !== 'string') throw new Error('Invalid code');
  code = code.trim();
  if(!code.startsWith(SHARE_CODE_PREFIX)) throw new Error('Unknown format');
  const payload = code.slice(SHARE_CODE_PREFIX.length);
  const json = decodeURIComponent(atob(payload));
  const obj = JSON.parse(json);
  if(
    !obj ||
    (obj.kind !== 'shortcut' &&
     obj.kind !== 'game' &&
     obj.kind !== 'profile')
  ){
    throw new Error('Invalid payload');
  }
  return obj;
}

function loadCustomGames(){
  try{
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if(!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  }catch(e){
    return [];
  }
}

function loadCustomMainGames(){
  try{
    const raw = localStorage.getItem(CUSTOM_MAIN_GAMES_KEY);
    if(!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  }catch(e){
    return [];
  }
}

function loadBuiltinImages(){
  try{
    const raw = localStorage.getItem(BUILTIN_IMAGES_KEY);
    if(!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  }catch(e){
    return {};
  }
}

function persistBuiltinImages(){
  try{
    localStorage.setItem(BUILTIN_IMAGES_KEY, JSON.stringify(BUILTIN_IMAGES));
  }catch(e){
    // ignore storage errors
  }
}

function loadBuiltinOrder(){
  try{
    const raw = localStorage.getItem(BUILTIN_ORDER_KEY);
    if(!raw) return null;
    const names = JSON.parse(raw);
    if(!Array.isArray(names)) return null;

    const byName = new Map(GAMES.map(g => [g.name, g]));
    const used = new Set();
    const ordered = [];

    names.forEach(name => {
      if(typeof name !== 'string') return;
      const game = byName.get(name);
      if(game && !used.has(name)){
        used.add(name);
        ordered.push(game);
      }
    });

    // append any new / missing games in their original order
    GAMES.forEach(g => {
      if(!used.has(g.name)){
        ordered.push(g);
      }
    });

    return ordered;
  }catch(e){
    return null;
  }
}

function persistBuiltinOrder(){
  try{
    const names = BUILTIN_GAMES.map(g => g.name);
    localStorage.setItem(BUILTIN_ORDER_KEY, JSON.stringify(names));
  }catch(e){
    // ignore storage errors
  }
}

function persistCustomGames(){
  try{
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(CUSTOM_GAMES));
  }catch(e){
    // ignore storage errors
  }
}

function persistCustomMainGames(){
  try{
    localStorage.setItem(CUSTOM_MAIN_GAMES_KEY, JSON.stringify(CUSTOM_MAIN_GAMES));
  }catch(e){
    // ignore storage errors
  }
}

let CUSTOM_GAMES = loadCustomGames();          // used for shortcuts section
let CUSTOM_MAIN_GAMES = loadCustomMainGames(); // used for extra games in main carousel

// Built-in games are no longer used; keep these as empty for backwards-compat with old profile data.
let BUILTIN_IMAGES = {};
let BUILTIN_GAMES = [];
let FEATURED_GAMES = [];

function rebuildFeaturedGames(){
  // Only use your custom main games as featured content; built-ins are no longer shown
  FEATURED_GAMES = [...CUSTOM_MAIN_GAMES];
}

function updateClock(){
  if(!topSubtitle) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  topSubtitle.textContent = `${hh}:${mm}:${ss}`;
}

const appRoot = document.getElementById('app');
const mainGrid = document.getElementById('main-grid');
const mainViewport = document.querySelector('#main-layout .carousel-viewport');
const mainPrevBtn = document.getElementById('main-prev');
const mainNextBtn = document.getElementById('main-next');
const topSubtitle = document.getElementById('top-subtitle');

const customGrid = document.getElementById('custom-grid');
const customViewport = document.querySelector('#custom-main-layout .carousel-viewport');
const customPrevBtn = document.getElementById('custom-prev');
const customNextBtn = document.getElementById('custom-next');

let mainCarouselIndex = 0;
let customCarouselIndex = 0;

const toolsOverlay = document.getElementById('tools-overlay');
const toolsPanel = document.getElementById('tools-panel');
const toolsTitle = document.getElementById('tools-title');
const toolsSubtitle = document.getElementById('tools-subtitle');
const toolsList = document.getElementById('tools-list');
const toolsCloseBtn = document.getElementById('tools-close');
const toolsEditBtn = document.getElementById('tools-edit');

/* Profile export/import overlay */
const profileOverlay = document.getElementById('profile-overlay');
const profilePanel = document.getElementById('profile-panel');
const profileCloseBtn = document.getElementById('profile-close');
const profileCodeOutput = document.getElementById('profile-code-output');
const profileCodeInput = document.getElementById('profile-code-input');
const profileCopyBtn = document.getElementById('profile-copy');
const profileApplyBtn = document.getElementById('profile-apply');
const profileCancelBtn = document.getElementById('profile-cancel');
const profileQrImg = document.getElementById('profile-qr');

/* Reorder modal elements */
const reorderOverlay = document.getElementById('reorder-overlay');
const reorderPanel = document.getElementById('reorder-panel');
const reorderTitle = document.getElementById('reorder-title');
const reorderSubtitle = document.getElementById('reorder-subtitle');
const reorderListEl = document.getElementById('reorder-list');
const reorderCloseBtn = document.getElementById('reorder-close');
const reorderCancelBtn = document.getElementById('reorder-cancel');
const reorderSaveBtn = document.getElementById('reorder-save');

/* Reorder buttons */
const mainReorderBtn = document.getElementById('main-reorder');
const customReorderBtn = document.getElementById('custom-reorder');

/* Profile export/import buttons */
const profileExportBtn = document.getElementById('profile-export');
const profileImportBtn = document.getElementById('profile-import');

/* Custom create modal elements */
const customCreateOverlay = document.getElementById('custom-create-overlay');
const customCreatePanel = document.getElementById('custom-create-panel');
const customCreateCloseBtn = document.getElementById('custom-create-close');
const customNameInput = document.getElementById('custom-name');
const customNameSearchBtn = document.getElementById('custom-name-search');
const customImageInput = document.getElementById('custom-image');
const customLinkInput = document.getElementById('custom-link');
const customShareCodeInput = document.getElementById('custom-share-code');
const customCopyCodeBtn = document.getElementById('custom-copy-code');
const customImportCodeBtn = document.getElementById('custom-import-code');
const customShareCodeField = customShareCodeInput ? customShareCodeInput.closest('.field') : null;
const customInstantOpenInput = document.getElementById('custom-instant-open');
const customToolsListEl = document.getElementById('custom-tools-list');
const customAddToolBtn = document.getElementById('custom-add-tool');
const customCancelBtn = document.getElementById('custom-cancel');
const customSaveBtn = document.getElementById('custom-save');
const customCreateTitle = document.getElementById('custom-create-title');
const customEditingLabel = document.getElementById('custom-editing-label');
const customDeleteBtn = document.getElementById('custom-delete');
const customQrImg = document.getElementById('custom-qr');
const customQrField = document.getElementById('custom-qr-field');
const toast = document.getElementById('toast');

/* Shortcut vs game-specific form sections */
const shortcutOnlyEls = document.querySelectorAll('.shortcut-only');
const gameOnlyEls = document.querySelectorAll('.game-only');

/* Choice modal elements */
const choiceOverlay = document.getElementById('choice-overlay');
const choicePanel = document.getElementById('choice-panel');
const choiceTitleEl = document.getElementById('choice-title');
const choiceMessageEl = document.getElementById('choice-message');
const choiceOptionsEl = document.getElementById('choice-options');
let choiceResolver = null;

let scrollLockCount = 0;
let savedScrollY = 0;

function lockScroll(){
  if(scrollLockCount === 0){
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${savedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    // blur the whole page content when a modal is active
    body.classList.add('modal-open');
  }
  scrollLockCount++;
}

function unlockScroll(){
  if(scrollLockCount > 0){
    scrollLockCount--;
    if(scrollLockCount === 0){
      const body = document.body;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.classList.remove('modal-open');
      window.scrollTo(0, savedScrollY);
    }
  }
}

let toolsOpen = false;
let customCreateOpen = false;
let reorderOpen = false;
let profileOpen = false;
let choiceOpen = false;
let reorderContext = null; // 'featured' | 'shortcuts'
let toolsContext = null; // { type: 'game' | 'shortcut', index: number }
let editingMode = false;
let editingIndex = null;
let editingKind = 'shortcut'; // 'shortcut' | 'game' | 'builtin'
let editingBuiltinName = null;
let toastTimer = null;

function createCard(game, idx){
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.index = idx;
  el.tabIndex = 0;

  const isCustomMain = CUSTOM_MAIN_GAMES.includes(game);

  let longPressTimer = null;
  let longPressTriggered = false;

  function clearLongPressTimer(){
    if(longPressTimer !== null){
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function scheduleLongPress(){
    clearLongPressTimer();
    longPressTriggered = false;
    longPressTimer = setTimeout(()=>{
      longPressTriggered = true;
      const customIndex = CUSTOM_MAIN_GAMES.indexOf(game);
      if(customIndex !== -1){
        // long-press on a custom main game -> open full game editor
        openCustomCreateModal(customIndex, 'game');
      }else{
        // long-press on a built-in game -> open cover image editor
        const featuredIndex = FEATURED_GAMES.indexOf(game);
        if(featuredIndex !== -1){
          openCustomCreateModal(featuredIndex, 'builtin');
        }
      }
    }, 500);
  }

  el.innerHTML = `
    <img src="${game.image}" alt="${escapeHtml(game.name)} poster">
    <div class="card-label">${escapeHtml(game.name)}</div>
    ${isCustomMain ? `
      <button type="button" class="custom-edit" aria-label="Edit game">✎</button>
      <button type="button" class="custom-delete" aria-label="Delete game">✕</button>
    ` : ``}
  `;

  // click: open tools directly (grid layout)
  el.addEventListener('click', ()=>{
    if(longPressTriggered){
      longPressTriggered = false;
      return;
    }
    openToolsForGame(idx);
  });

  el.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      openToolsForGame(idx);
    }
  });

  // allow edit/delete and hold-to-edit for custom main games
  if(isCustomMain){
    const deleteBtn = el.querySelector('.custom-delete');
    const editBtn = el.querySelector('.custom-edit');

    const getCustomIndex = () => CUSTOM_MAIN_GAMES.indexOf(game);

    if(deleteBtn){
      deleteBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const customIndex = getCustomIndex();
        if(customIndex === -1) return;
        const confirmed = window.confirm('Delete this custom game? This cannot be undone.');
        if(!confirmed) return;
        CUSTOM_MAIN_GAMES.splice(customIndex, 1);
        persistCustomMainGames();
        rebuildFeaturedGames();
        renderFeaturedGames();
      });
    }

    if(editBtn){
      editBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const customIndex = getCustomIndex();
        if(customIndex === -1) return;
        openCustomCreateModal(customIndex, 'game');
      });
    }
  }

  // long-press to edit (works for both built-in and custom main games)
  el.addEventListener('touchstart', (e)=>{
    if(e.touches.length === 1){
      scheduleLongPress();
    }
  }, {passive:true});
  el.addEventListener('touchend', clearLongPressTimer, {passive:true});
  el.addEventListener('touchmove', clearLongPressTimer, {passive:true});

  el.addEventListener('mousedown', (e)=>{
    if(e.button !== 0) return;
    scheduleLongPress();
  });
  ['mouseup','mouseleave'].forEach(ev=>{
    el.addEventListener(ev, clearLongPressTimer);
  });

  return el;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

function openTools(game){
  if(!game) return;

  // populate tools content
  toolsTitle.textContent = game.name;
  toolsSubtitle.textContent = 'Game Tools';
  toolsList.innerHTML = '';

  const tools = Array.isArray(game.tools) ? game.tools : [];
  if(tools.length){
    tools.forEach(t=>{
      const btn = document.createElement('a');
      const href = (t.href || '').trim();
      const isDisabled = !href || href === '#';
      btn.className = 'tool-link' + (isDisabled ? ' disabled' : '');
      btn.textContent = t.label;
      btn.href = href || '#';
      if(isDisabled){
        btn.setAttribute('aria-disabled','true');
        btn.tabIndex = -1;
        btn.addEventListener('click', (e)=>e.preventDefault());
      }else{
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
      }
      toolsList.appendChild(btn);
    });
  }else{
    const empty = document.createElement('div');
    empty.className = 'tool-empty';
    empty.textContent = 'No tools available for this game yet.';
    toolsList.appendChild(empty);
  }

  // Ensure a JSON export button exists at the bottom of the tools panel
  let exportBtn = document.getElementById('tools-export-json');
  if(!exportBtn && toolsPanel){
    exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.id = 'tools-export-json';
    exportBtn.className = 'pill-btn';
    exportBtn.style.marginTop = '8px';
    exportBtn.style.alignSelf = 'flex-end';
    exportBtn.textContent = 'Export JSON';
    toolsPanel.appendChild(exportBtn);

    exportBtn.addEventListener('click', ()=>{
      if(!toolsContext){
        showToast('No card selected to export');
        return;
      }
      const { type, index } = toolsContext;
      if(type === 'game'){
        if(typeof index === 'number' && index >= 0 && CUSTOM_MAIN_GAMES[index]){
          exportCardAsJson('game', CUSTOM_MAIN_GAMES[index]);
        }else if(toolsContext && typeof toolsContext.index === 'number' && CUSTOM_MAIN_GAMES[toolsContext.index]){
          exportCardAsJson('game', CUSTOM_MAIN_GAMES[toolsContext.index]);
        }else{
          showToast('No game card found to export');
        }
      }else if(type === 'shortcut'){
        if(typeof index === 'number' && index >= 0 && CUSTOM_GAMES[index]){
          exportCardAsJson('shortcut', CUSTOM_GAMES[index]);
        }else if(toolsContext && toolsContext.type === 'shortcut' && CUSTOM_GAMES[toolsContext.index]){
          // Fallback: centered shortcut
          exportCardAsJson('shortcut', CUSTOM_GAMES[toolsContext.index]);
        }else{
          showToast('No shortcut card found to export');
        }
      }else{
        showToast('Unsupported card type for export');
      }
    });
  }

  toolsOverlay.classList.add('open');
  toolsOverlay.setAttribute('aria-hidden','false');
  try{
    toolsPanel.focus();
  }catch(e){
    // ignore focus errors on non-focusable elements
  }
  lockScroll();
  if(!toolsOpen){
    history.pushState({tools:true}, '');
  }
  toolsOpen = true;
}

function openToolLink(href){
  const url = (href || '').trim();
  if(!url || url === '#') return;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function showToast(message){
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  if(toastTimer){
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(()=>{
    toast.classList.remove('visible');
  }, 2600);
}

function openToolsForGame(index){
  const game = FEATURED_GAMES[index];
  if(!game) return;

  // Determine if this is one of your custom main games (all featured games are built from CUSTOM_MAIN_GAMES)
  const customIndex = CUSTOM_MAIN_GAMES.indexOf(game);
  toolsContext = {
    type: 'game',
    index: customIndex
  };

  openTools(game);
}

function openToolsForCustomGame(index){
  const game = CUSTOM_GAMES[index];
  toolsContext = {
    type: 'shortcut',
    index
  };
  openTools(game);
}

function activateCustomShortcut(index){
  const shortcut = CUSTOM_GAMES[index];
  if(!shortcut) return;

  // Prefer the explicit shortcut link; fall back to first legacy tool href if present
  const explicitLink = (shortcut.link || '').trim();
  const legacyToolHref = Array.isArray(shortcut.tools) && shortcut.tools.length
    ? (shortcut.tools[0].href || '').trim()
    : '';

  const target = explicitLink || legacyToolHref;

  if(!target){
    showToast('No link set for this shortcut yet. Edit it to add one.');
    return;
  }

  openToolLink(target);
}

function hideTools(){
  toolsOverlay.classList.remove('open');
  toolsOverlay.setAttribute('aria-hidden','true');
  toolsOpen = false;
  toolsContext = null;
  unlockScroll();
}

/** Scroll viewport so the given card is centered; camera follows focus */
function scrollToCenterCard(viewport, card){
  if(!viewport || !card || !viewport.contains(card)) return;
  const track = card.closest('.carousel-track');
  if(!track) return;
  const cardCenter = card.offsetLeft + card.offsetWidth / 2;
  const viewportWidth = viewport.clientWidth;
  const scrollLeft = Math.max(0, cardCenter - viewportWidth / 2);
  viewport.scrollTo({ left: scrollLeft, behavior: 'smooth' });
}

function setupCarouselFollowFocus(viewport, getGrid, updateCenter, setIndex){
  if(!viewport || !getGrid) return;
  viewport.addEventListener('focusin', (e)=>{
    const card = e.target.closest ? e.target.closest('.card') : null;
    if(!card || !viewport.contains(card)) return;
    scrollToCenterCard(viewport, card);
    const grid = getGrid();
    if(grid){
      const cards = grid.querySelectorAll('.card');
      const idx = Array.from(cards).indexOf(card);
      if(idx >= 0 && setIndex) setIndex(idx);
    }
    updateCenter();
  });
}

function updateMainCarouselCenter(){
  if(!mainViewport || !mainGrid) return;
  const cards = mainGrid.querySelectorAll('.card');
  if(!cards.length) return;
  const vpCenter = mainViewport.scrollLeft + mainViewport.clientWidth / 2;
  let bestIdx = 0;
  let bestDist = Infinity;
  cards.forEach((c, i)=>{
    const cardCenter = c.offsetLeft + c.offsetWidth / 2;
    const d = Math.abs(cardCenter - vpCenter);
    if(d < bestDist){ bestDist = d; bestIdx = i; }
  });
  mainCarouselIndex = bestIdx;
  cards.forEach((c, i)=>{
    c.classList.toggle('center', i === bestIdx);
  });
}

function updateCustomCarouselCenter(){
  if(!customViewport || !customGrid) return;
  const cards = customGrid.querySelectorAll('.card');
  if(!cards.length) return;
  const vpCenter = customViewport.scrollLeft + customViewport.clientWidth / 2;
  let bestIdx = 0;
  let bestDist = Infinity;
  cards.forEach((c, i)=>{
    const cardCenter = c.offsetLeft + c.offsetWidth / 2;
    const d = Math.abs(cardCenter - vpCenter);
    if(d < bestDist){ bestDist = d; bestIdx = i; }
  });
  customCarouselIndex = bestIdx;
  cards.forEach((c, i)=>{
    c.classList.toggle('center', i === bestIdx);
  });
}

function scrollMainToIndex(i){
  if(!mainViewport || !mainGrid) return;
  const cards = mainGrid.querySelectorAll('.card');
  const target = cards[i];
  if(!target) return;
  const targetLeft = target.offsetLeft;
  const targetWidth = target.offsetWidth;
  const viewportWidth = mainViewport.clientWidth;
  const scrollLeft = Math.max(0, targetLeft - (viewportWidth / 2) + (targetWidth / 2));
  mainViewport.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  mainCarouselIndex = i;
  cards.forEach((c, idx)=> c.classList.toggle('center', idx === i));
}

function scrollCustomToIndex(i){
  if(!customViewport || !customGrid) return;
  const cards = customGrid.querySelectorAll('.card');
  const target = cards[i];
  if(!target) return;
  const targetLeft = target.offsetLeft;
  const targetWidth = target.offsetWidth;
  const viewportWidth = customViewport.clientWidth;
  const scrollLeft = Math.max(0, targetLeft - (viewportWidth / 2) + (targetWidth / 2));
  customViewport.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  customCarouselIndex = i;
  cards.forEach((c, idx)=> c.classList.toggle('center', idx === i));
}

function renderFeaturedGames(){
  if(!mainGrid) return;
  mainGrid.innerHTML = '';

  FEATURED_GAMES.forEach((g, i)=>{
    const c = createCard(g, i);
    mainGrid.appendChild(c);
  });

  const addGameCard = document.createElement('button');
  addGameCard.type = 'button';
  addGameCard.className = 'card';
  addGameCard.setAttribute('aria-label','Add custom game');
  addGameCard.innerHTML = `
    <div class="card-label" style="width:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">+</div>
  `;
  addGameCard.addEventListener('click', handleAddCustomMainGame);
  mainGrid.appendChild(addGameCard);

  mainCarouselIndex = 0;
  requestAnimationFrame(()=>{
    setTimeout(updateMainCarouselCenter, 50);
  });
}

function mount(){
  rebuildFeaturedGames();
  renderFeaturedGames();
  hookEvents();
  renderCustomGames();
}

function renderCustomGames(){
  if(!customGrid) return;
  customGrid.innerHTML = '';

  CUSTOM_GAMES.forEach((g, idx)=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.index = idx;
    el.tabIndex = 0;
    const imgUrl = g.image || 'https://via.placeholder.com/374x512.png?text=Shortcut';
    el.innerHTML = `
      <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(g.name)} cover">
      <div class="card-label">${escapeHtml(g.name)}</div>
      <button type="button" class="custom-edit" aria-label="Edit shortcut">✎</button>
      <button type="button" class="custom-delete" aria-label="Delete shortcut">✕</button>
    `;

    let longPressTimer = null;
    let longPressTriggered = false;

    function clearLongPressTimer(){
      if(longPressTimer !== null){
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    function scheduleLongPress(){
      clearLongPressTimer();
      longPressTriggered = false;
      longPressTimer = setTimeout(()=>{
        longPressTriggered = true;
        // Long-press on a shortcut now opens the tools panel,
        // where you can export this shortcut as JSON.
        openToolsForCustomGame(idx);
      }, 500);
    }

    el.addEventListener('click', ()=>{
      if(longPressTriggered){
        longPressTriggered = false;
        return;
      }
      activateCustomShortcut(idx);
    });

    el.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        activateCustomShortcut(idx);
      }
    });

    el.addEventListener('touchstart', (e)=>{
      if(e.touches.length === 1){
        scheduleLongPress();
      }
    }, {passive:true});
    el.addEventListener('touchend', clearLongPressTimer, {passive:true});
    el.addEventListener('touchmove', clearLongPressTimer, {passive:true});

    el.addEventListener('mousedown', (e)=>{
      if(e.button !== 0) return;
      scheduleLongPress();
    });
    ['mouseup','mouseleave'].forEach(ev=>{
      el.addEventListener(ev, clearLongPressTimer);
    });

    const deleteBtn = el.querySelector('.custom-delete');
    deleteBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      CUSTOM_GAMES.splice(idx, 1);
      persistCustomGames();
      rebuildFeaturedGames();
      renderFeaturedGames();
      renderCustomGames();
    });

    const editBtn = el.querySelector('.custom-edit');
    editBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      openCustomCreateModal(idx, 'shortcut');
    });
    customGrid.appendChild(el);
  });

  const addCard = document.createElement('button');
  addCard.type = 'button';
  addCard.className = 'card';
  addCard.innerHTML = `
    <div class="card-label" style="width:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">+</div>
  `;
  addCard.addEventListener('click', handleAddCustomShortcut);
  customGrid.appendChild(addCard);

  customCarouselIndex = 0;
  requestAnimationFrame(()=>{
    setTimeout(updateCustomCarouselCenter, 50);
  });
}

function handleAddCustomGame(){
  // kept for backwards compatibility – treat as adding a shortcut
  openCustomCreateModal(null, 'shortcut');
}

function handleAddCustomShortcut(){
  openCustomCreateModal(null, 'shortcut');
}

function handleAddCustomMainGame(){
  openCustomCreateModal(null, 'game');
}

window.addEventListener('popstate', ()=>{
  if(toolsOpen){
    hideTools();
  } else if(customCreateOpen){
    closeCustomCreateModal();
  } else if(reorderOpen){
    closeReorderModal();
  } else if(profileOpen){
    closeProfileOverlay();
  }
});

function buildSharePayload(kind, item){
  if(kind === 'shortcut'){
    return {
      kind: 'shortcut',
      name: item.name || '',
      image: item.image || '',
      link: (item.link || '').trim()
    };
  }
  // game
  return {
    kind: 'game',
    name: item.name || '',
    image: item.image || '',
    studio: item.studio || 'Custom',
    year: item.year || new Date().getFullYear(),
    instantOpenOnSingleTool: item.instantOpenOnSingleTool !== false,
    tools: Array.isArray(item.tools) ? item.tools.map(t=>({
      label: t.label || '',
      href: (t.href || '').trim()
    })) : []
  };
}

/* --- Per-card JSON export helpers --- */

function sanitizeFilename(name){
  return (name || 'card')
    .toString()
    .trim()
    .replace(/[\\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 64) || 'card';
}

function exportCardAsJson(kind, item){
  if(!item) return;
  const payload = buildSharePayload(kind, item);
  const safeName = sanitizeFilename(item.name || (kind === 'shortcut' ? 'shortcut' : 'game'));
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Card exported as JSON');
}

/* --- Duplicate detection + merge helpers for cards --- */

function normalizeNameForCompare(name){
  return String(name || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findSimilarByName(list, targetName){
  const targetNorm = normalizeNameForCompare(targetName);
  if(!targetNorm) return -1;
  for(let i=0;i<list.length;i++){
    const n = normalizeNameForCompare(list[i] && list[i].name);
    if(!n) continue;
    if(n === targetNorm || n.includes(targetNorm) || targetNorm.includes(n)){
      return i;
    }
  }
  return -1;
}

function showChoiceModal({ title, message, choices }){
  return new Promise((resolve)=>{
    if(!choiceOverlay || !choicePanel) return resolve(null);
    choiceResolver = resolve;

    choiceTitleEl.textContent = title || 'Conflict Detected';
    choiceMessageEl.textContent = message || '';
    choiceOptionsEl.innerHTML = '';

    choices.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = c.label;
      // Default to primary if not specified, but usually we specify
      if(c.style === 'secondary'){
        btn.className = 'secondary-btn';
      } else if (c.style === 'danger') {
        btn.className = 'pill-btn'; // Fallback or custom danger style
        btn.style.borderColor = '#ef4444';
        btn.style.color = '#ef4444';
      } else {
        btn.className = 'primary-btn';
      }
      
      btn.addEventListener('click', ()=>{
        closeChoiceModal();
        resolve(c.value);
      });
      choiceOptionsEl.appendChild(btn);
    });

    choiceOverlay.classList.add('open');
    choiceOverlay.setAttribute('aria-hidden','false');
    choiceOpen = true;
    lockScroll();
  });
}

function closeChoiceModal(){
  if(!choiceOverlay) return;
  choiceOverlay.classList.remove('open');
  choiceOverlay.setAttribute('aria-hidden','true');
  choiceOpen = false;
  unlockScroll();
  if(choiceResolver) choiceResolver = null;
}

async function mergeShortcutCards(existingCard, newCard){
  const merged = {...existingCard};
  // Prefer a non-empty image from the new card
  if(newCard.image && newCard.image.trim()){
    merged.image = newCard.image.trim();
  }
  const oldLink = (existingCard.link || '').trim();
  const newLink = (newCard.link || '').trim();
  if(oldLink && newLink && oldLink !== newLink){
    const choice = await showChoiceModal({
      title: 'Link Conflict',
      message: `Shortcut links differ for "${existingCard.name || 'Shortcut'}".`,
      choices: [
        { label: 'Use new link', value: 'new', style: 'primary' },
        { label: 'Keep old link', value: 'old', style: 'secondary' }
      ]
    });
    
    if(choice === 'new'){
      merged.link = newLink;
    }else{
      merged.link = oldLink;
    }
  }else if(newLink && !oldLink){
    merged.link = newLink;
  }else{
    merged.link = oldLink || newLink || '';
  }
  return merged;
}

async function mergeGameCards(existingGame, newGame){
  const merged = {...existingGame};

  // Prefer new image if present
  if(newGame.image && newGame.image.trim()){
    merged.image = newGame.image.trim();
  }

  // Studio / year – keep existing if set, otherwise use new
  merged.studio = existingGame.studio || newGame.studio || 'Custom';
  merged.year = existingGame.year || newGame.year || new Date().getFullYear();

  // instantOpen flag – prefer explicit value from new card if present
  if(typeof newGame.instantOpenOnSingleTool === 'boolean'){
    merged.instantOpenOnSingleTool = newGame.instantOpenOnSingleTool;
  }else if(typeof existingGame.instantOpenOnSingleTool === 'boolean'){
    merged.instantOpenOnSingleTool = existingGame.instantOpenOnSingleTool;
  }else{
    merged.instantOpenOnSingleTool = true;
  }

  const existingTools = Array.isArray(existingGame.tools) ? [...existingGame.tools] : [];
  const newTools = Array.isArray(newGame.tools) ? newGame.tools : [];

  const norm = (label)=>normalizeNameForCompare(label);

  for (const newTool of newTools) {
    const newLabel = newTool.label || '';
    const newNorm = norm(newLabel);
    if(!newNorm){
      // unnamed tool – just append if it has some URL
      if((newTool.href || '').trim()){
        existingTools.push({...newTool});
      }
      continue;
    }

    const matchIndex = existingTools.findIndex(t=>{
      const tNorm = norm(t.label || '');
      return tNorm && (tNorm === newNorm || tNorm.includes(newNorm) || newNorm.includes(tNorm));
    });

    if(matchIndex === -1){
      // brand new tool name
      existingTools.push({...newTool});
      continue;
    }

    const existingTool = existingTools[matchIndex];
    
    const choice = await showChoiceModal({
      title: 'Button Conflict',
      message: `Both cards have a "${existingTool.label || 'Unnamed'}" button.`,
      choices: [
        { label: 'Replace (use new)', value: 'replace', style: 'primary' },
        { label: 'Rename new (keep both)', value: 'rename', style: 'secondary' },
        { label: 'Keep old (ignore new)', value: 'ignore', style: 'secondary' }
      ]
    });

    if(choice === 'replace'){
      // Replace existing with new
      existingTools[matchIndex] = {...newTool};
    }else if(choice === 'rename'){
      // Keep both, but rename the new one to avoid duplicates
      const baseLabel = newTool.label || existingTool.label || 'Button';
      let candidate = baseLabel + ' (alt)';
      // make sure the new label is unique in current list
      let suffix = 2;
      while(existingTools.some(t => (t.label || '') === candidate)){
        candidate = baseLabel + ' (' + suffix + ')';
        suffix++;
      }
      existingTools.push({
        ...newTool,
        label: candidate
      });
    }
    // else ignore
  }

  merged.tools = existingTools;
  return merged;
}

/* Profile export/import helpers */

function buildProfilePayload(){
  return {
    kind: 'profile',
    v: 1,
    customShortcuts: CUSTOM_GAMES,
    customMainGames: CUSTOM_MAIN_GAMES,
    // Keep these fields for backwards compatibility, but they are no longer used.
    builtinImages: BUILTIN_IMAGES,
    builtinOrder: BUILTIN_GAMES.map(g => g.name)
  };
}

function applyProfilePayload(data){
  // basic shape checks
  const shortcuts = Array.isArray(data.customShortcuts) ? data.customShortcuts : [];
  const mainGames = Array.isArray(data.customMainGames) ? data.customMainGames : [];

  CUSTOM_GAMES = shortcuts;
  CUSTOM_MAIN_GAMES = mainGames;

  // Built-in games are no longer used; ignore any imported builtin data
  BUILTIN_IMAGES = {};
  BUILTIN_GAMES = [];

  persistCustomGames();
  persistCustomMainGames();
  rebuildFeaturedGames();
  renderFeaturedGames();
  renderCustomGames();
}

function setProfileQr(code){
  if(!profileQrImg) return;
  // If code is too long, QR might fail or be too dense to scan
  if(code.length > 1800){
    profileQrImg.src = '';
    profileQrImg.alt = 'Profile too large for QR';
    showToast('Profile too large for QR, use Copy instead');
    return;
  }
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(code);
  profileQrImg.src = qrUrl;
  profileQrImg.alt = 'Profile QR code';
}

function setCustomQr(code){
  if(!customQrImg || !customQrField) return;
  if(!code || code.length > 1800){
    customQrImg.src = '';
    customQrField.classList.remove('visible');
    return;
  }
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(code);
  customQrImg.src = qrUrl;
  customQrImg.alt = 'Share QR code';
  customQrField.classList.add('visible');
}

function openProfileOverlay(mode){
  if(!profileOverlay || !profilePanel) return;

  // Clear previous state
  profileCodeOutput.value = '';
  profileCodeInput.value = '';
  profileQrImg.src = '';

  if(mode === 'export'){
    const payload = buildProfilePayload();
    const code = encodeShareCode(payload);
    if(!code){
      showToast('Profile export failed');
      return;
    }
    profileCodeOutput.value = code;
    setProfileQr(code);
  }else{
    // import mode: just focus the input
    requestAnimationFrame(()=>{
      profileCodeInput.focus();
    });
  }

  profileOverlay.classList.add('open');
  profileOverlay.setAttribute('aria-hidden','false');
  profileOpen = true;
  lockScroll();
  try{
    profilePanel.focus();
  }catch(e){}
  history.pushState({profile:true}, '');
}

function closeProfileOverlay(){
  if(!profileOverlay) return;
  profileOverlay.classList.remove('open');
  profileOverlay.setAttribute('aria-hidden','true');
  profileOpen = false;
  unlockScroll();
}

/* Reorder modal logic */

function openReorderModal(context){
  if(!reorderOverlay || !reorderPanel) return;
  reorderContext = context === 'featured' ? 'featured' : 'shortcuts';
  reorderListEl.innerHTML = '';

  if(reorderContext === 'featured'){
    // Only your custom main games are featured now
    const items = CUSTOM_MAIN_GAMES;
    items.forEach((g, idx)=>{
      const row = document.createElement('div');
      row.className = 'reorder-row';

      row.dataset.source = 'custom';
      row.dataset.index = idx;

      row.innerHTML = `
        <div class="reorder-label">${escapeHtml(g.name || 'Untitled')}</div>
        <button type="button" class="reorder-move" data-dir="up" aria-label="Move up">▲</button>
        <button type="button" class="reorder-move" data-dir="down" aria-label="Move down">▼</button>
        <button type="button" class="reorder-delete" aria-label="Delete card">✕</button>
      `;
      attachReorderRowHandlers(row);
      reorderListEl.appendChild(row);
    });
    if(!items.length){
      const empty = document.createElement('div');
      empty.className = 'tool-empty';
      empty.textContent = 'No games to reorder yet.';
      reorderListEl.appendChild(empty);
    }
    reorderTitle.textContent = 'Reorder games';
    reorderSubtitle.textContent = 'Order of all featured games';
  }else{
    const items = CUSTOM_GAMES;
    items.forEach((g, idx)=>{
      const row = document.createElement('div');
      row.className = 'reorder-row';
      row.dataset.index = idx;
      row.innerHTML = `
        <div class="reorder-label">${escapeHtml(g.name || 'Untitled')}</div>
        <button type="button" class="reorder-move" data-dir="up" aria-label="Move up">▲</button>
        <button type="button" class="reorder-move" data-dir="down" aria-label="Move down">▼</button>
      `;
      attachReorderRowHandlers(row);
      reorderListEl.appendChild(row);
    });
    if(!items.length){
      const empty = document.createElement('div');
      empty.className = 'tool-empty';
      empty.textContent = 'No shortcuts to reorder yet.';
      reorderListEl.appendChild(empty);
    }
    reorderTitle.textContent = 'Reorder shortcuts';
    reorderSubtitle.textContent = 'Order in the shortcuts grid';
  }

  reorderOverlay.classList.add('open');
  reorderOverlay.setAttribute('aria-hidden','false');
  reorderOpen = true;
  lockScroll();
  try{
    reorderPanel.focus();
  }catch(e){}
  history.pushState({reorder:true}, '');
}

function closeReorderModal(){
  if(!reorderOverlay) return;
  reorderOverlay.classList.remove('open');
  reorderOverlay.setAttribute('aria-hidden','true');
  reorderOpen = false;
  reorderContext = null;
  unlockScroll();
}

function attachReorderRowHandlers(row){
  const moveBtns = row.querySelectorAll('.reorder-move');
  moveBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const dir = btn.dataset.dir === 'up' ? -1 : 1;
      const rows = Array.from(reorderListEl.querySelectorAll('.reorder-row'));
      const index = rows.indexOf(row);
      const newIndex = index + dir;
      if(newIndex < 0 || newIndex >= rows.length) return;
      const reference = dir === -1 ? rows[newIndex] : rows[newIndex].nextSibling;
      reorderListEl.insertBefore(row, reference);
    });
  });

  const deleteBtn = row.querySelector('.reorder-delete');
  if(deleteBtn){
    deleteBtn.addEventListener('click', ()=>{
      // Toggle deleted state; we keep the row so the user can undo before saving
      const isDeleted = row.classList.toggle('deleted');
      row.dataset.deleted = isDeleted ? 'true' : 'false';
    });
  }
}

function openCustomCreateModal(editIndex = null, kind = 'shortcut'){
  if(!customCreateOverlay || !customCreatePanel) return;

  editingKind = (kind === 'game' || kind === 'builtin') ? kind : 'shortcut';
  editingBuiltinName = null;

  // Reset common field state
  if(customNameInput){
    customNameInput.disabled = false;
  }
  if(customLinkInput){
    customLinkInput.disabled = false;
  }
  if(customInstantOpenInput){
    customInstantOpenInput.disabled = false;
  }
  if(customShareCodeField){
    customShareCodeField.style.display = '';
  }
  if(customImportCodeBtn){
    customImportCodeBtn.style.display = '';
  }
  if(customAddToolBtn){
    customAddToolBtn.style.display = '';
  }
  if(customDeleteBtn){
    customDeleteBtn.style.display = '';
  }

  // Toggle which fields are visible based on mode
  shortcutOnlyEls.forEach(el=>{
    el.style.display = editingKind === 'shortcut' ? '' : 'none';
  });
  gameOnlyEls.forEach(el=>{
    el.style.display = editingKind === 'game' ? '' : 'none';
  });

  if(editingKind === 'game'){
    // editing custom main games
    const hasValidIndex = (typeof editIndex === 'number') && CUSTOM_MAIN_GAMES[editIndex];
    editingIndex = hasValidIndex ? editIndex : null;
    editingMode = !!CUSTOM_MAIN_GAMES[editingIndex];
  }else if(editingKind === 'builtin'){
    // editing a built-in game: only allow changing the cover image
    const game = (typeof editIndex === 'number') ? FEATURED_GAMES[editIndex] : null;
    editingIndex = null;
    editingMode = !!game;
    customToolsListEl.innerHTML = '';
    if(game){
      editingBuiltinName = game.name || null;
      customNameInput.value = game.name || '';
      customNameInput.disabled = true;
      customImageInput.value = (BUILTIN_IMAGES && editingBuiltinName && BUILTIN_IMAGES[editingBuiltinName]) || game.image || '';
      if(customLinkInput){
        customLinkInput.value = '';
        customLinkInput.disabled = true;
      }
      if(customInstantOpenInput){
        customInstantOpenInput.disabled = true;
      }
      // hide shortcut/game-specific sections and sharing for built-ins
      shortcutOnlyEls.forEach(el=>{ el.style.display = 'none'; });
      gameOnlyEls.forEach(el=>{ el.style.display = 'none'; });
      if(customShareCodeField){
        customShareCodeField.style.display = 'none';
      }
      if(customImportCodeBtn){
        customImportCodeBtn.style.display = 'none';
      }
      if(customAddToolBtn){
        customAddToolBtn.style.display = 'none';
      }
      if(customDeleteBtn){
        customDeleteBtn.style.display = 'none';
      }
      if(customCreateTitle){
        customCreateTitle.textContent = 'Change cover image';
      }
      if(customEditingLabel){
        customEditingLabel.textContent = 'BUILT-IN GAME';
        customEditingLabel.classList.add('active');
      }
    }
  }else{
    // editing shortcuts (bottom section)
    const hasValidIndex = (typeof editIndex === 'number') && CUSTOM_GAMES[editIndex];
    editingIndex = hasValidIndex ? editIndex : null;
    editingMode = !!CUSTOM_GAMES[editingIndex];
  }

  customToolsListEl.innerHTML = '';

  if(editingKind === 'builtin'){
    // already populated above; nothing else to do
  }else if(editingMode){
    const item = editingKind === 'game'
      ? CUSTOM_MAIN_GAMES[editingIndex]
      : CUSTOM_GAMES[editingIndex];
    customNameInput.value = item.name || '';
    customImageInput.value = item.image || '';

    if(editingKind === 'shortcut'){
      // For shortcuts, just a single link; fall back to first legacy tool if present
      const legacyHref = Array.isArray(item.tools) && item.tools.length
        ? (item.tools[0].href || '').trim()
        : '';
      customLinkInput.value = (item.link || '').trim() || legacyHref;
    }else{
      // For games, keep multi-tool behavior
      if(customInstantOpenInput){
        customInstantOpenInput.checked = item.instantOpenOnSingleTool !== false;
      }
      const tools = Array.isArray(item.tools) ? item.tools : [];
      if(tools.length){
        tools.forEach(t=>{
          addCustomToolRow(t.label || '', (t.href || '').trim());
        });
      }else{
        addCustomToolRow();
      }
    }

    // Share code for existing item
    if(customShareCodeInput){
      const payload = buildSharePayload(editingKind, item);
      const code = encodeShareCode(payload);
      customShareCodeInput.value = code;
      setCustomQr(code);
    }

    if(customCreateTitle){
      customCreateTitle.textContent = editingKind === 'game' ? 'Edit game' : 'Edit shortcut';
    }
    if(customEditingLabel){
      customEditingLabel.textContent = editingKind === 'game' ? 'EDITING GAME' : 'EDITING';
      customEditingLabel.classList.add('active');
    }
    if(customDeleteBtn) customDeleteBtn.style.display = '';
  }else{
    editingIndex = null;
    customNameInput.value = '';
    customImageInput.value = '';
    if(customLinkInput){
      customLinkInput.value = '';
    }
    if(customShareCodeInput){
      customShareCodeInput.value = '';
    }
    setCustomQr('');
    if(customInstantOpenInput){
      customInstantOpenInput.checked = true;
    }

    // Only pre-populate tools list when in game mode
    if(editingKind === 'game'){
      addCustomToolRow();
    }

    if(customCreateTitle){
      customCreateTitle.textContent = editingKind === 'game' ? 'New game' : 'New shortcut';
    }
    if(customEditingLabel){
      customEditingLabel.textContent = editingKind === 'game' ? 'EDITING GAME' : 'EDITING';
      customEditingLabel.classList.remove('active');
    }
    if(customDeleteBtn) customDeleteBtn.style.display = 'none';
  }

  customCreateOverlay.classList.add('open');
  customCreateOverlay.setAttribute('aria-hidden','false');
  customCreateOpen = true;
  requestAnimationFrame(()=> {
    customNameInput.focus();
  });

  lockScroll();
  history.pushState({customCreate:true}, '');
}

function closeCustomCreateModal(){
  if(!customCreateOverlay) return;
  customCreateOverlay.classList.remove('open');
  customCreateOverlay.setAttribute('aria-hidden','true');
  customCreateOpen = false;
  editingMode = false;
  editingIndex = null;
  editingKind = 'shortcut';
  editingBuiltinName = null;
  unlockScroll();
}

function addCustomToolRow(label = '', href = ''){
  const row = document.createElement('div');
  row.className = 'custom-tool-row';
  row.innerHTML = `
    <input type="text" class="tool-label-input" placeholder="Tool name" value="${escapeHtml(label)}">
    <input type="url" class="tool-link-input" placeholder="https://link.to/tool" value="${escapeHtml(href)}">
    <button type="button" class="custom-tool-move" data-dir="up" aria-label="Move tool up">▲</button>
    <button type="button" class="custom-tool-move" data-dir="down" aria-label="Move tool down">▼</button>
    <button type="button" class="custom-tool-remove" aria-label="Remove tool">✕</button>
  `;
  const removeBtn = row.querySelector('.custom-tool-remove');
  removeBtn.addEventListener('click', ()=>{
    row.remove();
    if(!customToolsListEl.querySelector('.custom-tool-row')){
      // keep at least one row visible
      addCustomToolRow();
    }
  });

  const moveBtns = row.querySelectorAll('.custom-tool-move');
  moveBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const dir = btn.dataset.dir === 'up' ? -1 : 1;
      const rows = Array.from(customToolsListEl.querySelectorAll('.custom-tool-row'));
      const index = rows.indexOf(row);
      const newIndex = index + dir;
      if(newIndex < 0 || newIndex >= rows.length) return;
      const reference = dir === -1 ? rows[newIndex] : rows[newIndex].nextSibling;
      customToolsListEl.insertBefore(row, reference);
    });
  });

  customToolsListEl.appendChild(row);
}

function hookEvents(){
  if(mainReorderBtn){
    mainReorderBtn.addEventListener('click', ()=>{
      openReorderModal('featured');
    });
  }
  if(mainPrevBtn && mainViewport){
    mainPrevBtn.addEventListener('click', ()=>{
      const n = mainGrid ? mainGrid.querySelectorAll('.card').length : 0;
      if(n === 0) return;
      mainCarouselIndex = (mainCarouselIndex - 1 + n) % n;
      scrollMainToIndex(mainCarouselIndex);
    });
  }
  if(mainNextBtn && mainViewport){
    mainNextBtn.addEventListener('click', ()=>{
      const n = mainGrid ? mainGrid.querySelectorAll('.card').length : 0;
      if(n === 0) return;
      mainCarouselIndex = (mainCarouselIndex + 1) % n;
      scrollMainToIndex(mainCarouselIndex);
    });
  }
  if(mainViewport){
    let mainScrollT;
    mainViewport.addEventListener('scroll', ()=>{
      if(mainScrollT) clearTimeout(mainScrollT);
      mainScrollT = setTimeout(updateMainCarouselCenter, 80);
    }, {passive:true});
    setupCarouselFollowFocus(mainViewport, ()=>mainGrid, updateMainCarouselCenter, (i)=>{ mainCarouselIndex = i; });
  }
  if(customViewport){
    let customScrollT;
    customViewport.addEventListener('scroll', ()=>{
      if(customScrollT) clearTimeout(customScrollT);
      customScrollT = setTimeout(updateCustomCarouselCenter, 80);
    }, {passive:true});
    setupCarouselFollowFocus(customViewport, ()=>customGrid, updateCustomCarouselCenter, (i)=>{ customCarouselIndex = i; });
  }
  window.addEventListener('resize', ()=>{
    updateMainCarouselCenter();
    updateCustomCarouselCenter();
  });
  if(customPrevBtn && customViewport){
    customPrevBtn.addEventListener('click', ()=>{
      const n = customGrid ? customGrid.querySelectorAll('.card').length : 0;
      if(n === 0) return;
      customCarouselIndex = (customCarouselIndex - 1 + n) % n;
      scrollCustomToIndex(customCarouselIndex);
    });
  }
  if(customNextBtn && customViewport){
    customNextBtn.addEventListener('click', ()=>{
      const n = customGrid ? customGrid.querySelectorAll('.card').length : 0;
      if(n === 0) return;
      customCarouselIndex = (customCarouselIndex + 1) % n;
      scrollCustomToIndex(customCarouselIndex);
    });
  }
  if(customReorderBtn){
    customReorderBtn.addEventListener('click', ()=>{
      openReorderModal('shortcuts');
    });
  }
  if(profileExportBtn){
    profileExportBtn.addEventListener('click', ()=>{
      openProfileOverlay('export');
    });
  }
  if(profileImportBtn){
    profileImportBtn.addEventListener('click', ()=>{
      openProfileOverlay('import');
    });
  }
  if(profileCloseBtn){
    profileCloseBtn.addEventListener('click', ()=>{
      if(profileOpen){
        history.back();
      }
    });
  }
  if(profileCancelBtn){
    profileCancelBtn.addEventListener('click', ()=>{
      if(profileOpen){
        history.back();
      }
    });
  }
  if(profileCopyBtn && profileCodeOutput){
    profileCopyBtn.addEventListener('click', ()=>{
      const value = (profileCodeOutput.value || '').trim();
      if(!value) return;
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(value).then(()=>{
          showToast('Profile code copied');
        }).catch(()=>{
          profileCodeOutput.select();
          try{
            document.execCommand('copy');
            showToast('Profile code copied');
          }catch(e){
            showToast('Copy failed');
          }
        });
      }else{
        profileCodeOutput.select();
        try{
          document.execCommand('copy');
          showToast('Profile code copied');
        }catch(e){
          showToast('Copy failed');
        }
      }
    });
  }
  if(profileApplyBtn && profileCodeInput){
    profileApplyBtn.addEventListener('click', ()=>{
      const raw = (profileCodeInput.value || '').trim();
      if(!raw){
        showToast('Paste a profile code first');
        return;
      }
      let data;
      try{
        data = decodeShareCode(raw);
      }catch(e){
        showToast('Invalid profile code');
        return;
      }
      if(!data || data.kind !== 'profile'){
        showToast('This code is not a profile');
        return;
      }
      const confirmed = window.confirm('Importing will replace your current setup. Continue?');
      if(!confirmed) return;
      applyProfilePayload(data);
      showToast('Profile imported');
      closeProfileOverlay();
      if(profileOpen){
        history.back();
      }
    });
  }
  if(profileOverlay){
    profileOverlay.addEventListener('click', (e)=>{
      if(e.target === profileOverlay && profileOpen){
        history.back();
      }
    });
  }
  // tools overlay interactions
  toolsCloseBtn.addEventListener('click', ()=>{
    if(toolsOpen){
      history.back();
    }
  });

  if(toolsEditBtn){
    toolsEditBtn.addEventListener('click', ()=>{
      if(!toolsOpen) return;
      if(!toolsContext || typeof toolsContext.index !== 'number' || toolsContext.index < 0){
        showToast('Nothing to edit for this card');
        return;
      }
      const { type, index } = toolsContext;

      // Close tools panel before opening editor
      hideTools();

      if(type === 'game'){
        openCustomCreateModal(index, 'game');
      }else if(type === 'shortcut'){
        openCustomCreateModal(index, 'shortcut');
      }
    });
  }

  if(reorderCloseBtn){
    reorderCloseBtn.addEventListener('click', ()=>{
      if(reorderOpen){
        history.back();
      }
    });
  }
  if(reorderCancelBtn){
    reorderCancelBtn.addEventListener('click', ()=>{
      if(reorderOpen){
        history.back();
      }
    });
  }

  toolsOverlay.addEventListener('click', (e)=>{
    if(e.target === toolsOverlay && toolsOpen){
      history.back();
    }
  });

  if(reorderOverlay){
    reorderOverlay.addEventListener('click', (e)=>{
      if(e.target === reorderOverlay && reorderOpen){
        history.back();
      }
    });
  }

  window.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && choiceOpen){
      closeChoiceModal();
    } else if(e.key === 'Escape' && toolsOpen){
      history.back();
    } else if(e.key === 'Escape' && customCreateOpen){
      history.back();
    } else if(e.key === 'Escape' && reorderOpen){
      history.back();
    } else if(e.key === 'Escape' && profileOpen){
      history.back();
    }
  });

  // custom create modal interactions
  if(customCreateCloseBtn){
    customCreateCloseBtn.addEventListener('click', ()=>{
      if(customCreateOpen){
        history.back();
      }
    });
  }
  if(customCancelBtn){
    customCancelBtn.addEventListener('click', ()=>{
      if(customCreateOpen){
        history.back();
      }
    });
  }
  if(customCreateOverlay){
    customCreateOverlay.addEventListener('click', (e)=>{
      if(e.target === customCreateOverlay && customCreateOpen){
        history.back();
      }
    });
  }
  if(customNameSearchBtn){
    customNameSearchBtn.addEventListener('click', ()=>{
      const name = (customNameInput.value || '').trim();
      // Open marketplace first so the overlay is visible
      openMarketplace();

      if(!name){
        if(marketplaceSearchInput){
          marketplaceSearchInput.value = '';
          marketplaceSearchQuery = '';
          renderMarketplaceRecords();
          marketplaceSearchInput.focus();
        }
        showToast('Type a name above, then search the marketplace.');
        return;
      }

      // Choose tab based on what you are creating
      if(editingKind === 'shortcut'){
        setMarketplaceFilter('shortcuts');
      }else{
        setMarketplaceFilter('games');
      }

      if(marketplaceSearchInput){
        marketplaceSearchInput.value = name;
        marketplaceSearchQuery = name.toLowerCase();
        renderMarketplaceRecords();
        marketplaceSearchInput.focus();
        marketplaceSearchInput.select();
      }

      showToast(`Searching marketplace for "${name}".`);
    });
  }
  if(customCopyCodeBtn && customShareCodeInput){
    customCopyCodeBtn.addEventListener('click', ()=>{
      const value = (customShareCodeInput.value || '').trim();
      if(!value) return;
      try{
        navigator.clipboard.writeText(value).then(()=>{
          showToast('Share code copied');
        }).catch(()=>{
          customShareCodeInput.select();
          document.execCommand('copy');
          showToast('Share code copied');
        });
      }catch(e){
        // ignore
      }
    });
  }
  if(customImportCodeBtn){
    customImportCodeBtn.addEventListener('click', ()=>{
      const raw = window.prompt('Paste share code:');
      if(!raw) return;
      let data;
      try{
        data = decodeShareCode(raw);
      }catch(e){
        showToast('Invalid share code');
        return;
      }

      // Switch mode based on imported kind
      editingKind = data.kind === 'game' ? 'game' : 'shortcut';

      shortcutOnlyEls.forEach(el=>{
        el.style.display = editingKind === 'shortcut' ? '' : 'none';
      });
      gameOnlyEls.forEach(el=>{
        el.style.display = editingKind === 'game' ? '' : 'none';
      });

      editingMode = false;
      editingIndex = null;

      // Populate fields from decoded data
      customNameInput.value = data.name || '';
      customImageInput.value = data.image || '';
      if(editingKind === 'shortcut'){
        if(customLinkInput){
          customLinkInput.value = (data.link || '').trim();
        }
      }else{
        if(customInstantOpenInput){
          customInstantOpenInput.checked = data.instantOpenOnSingleTool !== false;
        }
        customToolsListEl.innerHTML = '';
        const tools = Array.isArray(data.tools) ? data.tools : [];
        if(tools.length){
          tools.forEach(t=>{
            addCustomToolRow(t.label || '', (t.href || '').trim());
          });
        }else{
          addCustomToolRow();
        }
      }

      if(customShareCodeInput){
        const payload = buildSharePayload(editingKind, data);
        const code = encodeShareCode(payload);
        customShareCodeInput.value = code;
        setCustomQr(code);
      }

      if(customCreateTitle){
        customCreateTitle.textContent = editingKind === 'game' ? 'New game' : 'New shortcut';
      }
      if(customEditingLabel){
        customEditingLabel.classList.remove('active');
      }
      if(customDeleteBtn){
        customDeleteBtn.style.display = 'none';
      }
      showToast('Loaded from share code');
    });
  }
  if(customDeleteBtn){
    customDeleteBtn.addEventListener('click', ()=>{
      if(!editingMode || editingIndex === null) return;

      if(editingKind === 'game'){
        if(!CUSTOM_MAIN_GAMES[editingIndex]) return;
        const confirmed = window.confirm('Delete this custom game? This cannot be undone.');
        if(!confirmed) return;
        CUSTOM_MAIN_GAMES.splice(editingIndex, 1);
        persistCustomMainGames();
        rebuildFeaturedGames();
        renderFeaturedGames();
        closeCustomCreateModal();
      }else{
        if(!CUSTOM_GAMES[editingIndex]) return;
        const confirmed = window.confirm('Delete this shortcut? This cannot be undone.');
        if(!confirmed) return;
        CUSTOM_GAMES.splice(editingIndex, 1);
        persistCustomGames();
        rebuildFeaturedGames();
        renderFeaturedGames();
        closeCustomCreateModal();
        renderCustomGames();
      }
    });
  }
  if(customAddToolBtn){
    customAddToolBtn.addEventListener('click', ()=>{
      addCustomToolRow();
    });
  }
  if(customSaveBtn){
    customSaveBtn.addEventListener('click', async ()=>{
      const name = (customNameInput.value || '').trim();
      const image = (customImageInput.value || '').trim();

      if(editingKind === 'builtin'){
        if(!editingBuiltinName){
          closeCustomCreateModal();
          return;
        }
        if(!image){
          customImageInput.focus();
          return;
        }
        BUILTIN_IMAGES[editingBuiltinName] = image;
        persistBuiltinImages();
        rebuildFeaturedGames();
        renderFeaturedGames();
        closeCustomCreateModal();
        return;
      }

      if(!name){
        customNameInput.focus();
        return;
      }

      if(editingKind === 'game'){
        const instantOpen = customInstantOpenInput ? !!customInstantOpenInput.checked : true;
        const toolRows = Array.from(customToolsListEl.querySelectorAll('.custom-tool-row'));
        const tools = [];
        toolRows.forEach(row=>{
          const labelInput = row.querySelector('.tool-label-input');
          const linkInput = row.querySelector('.tool-link-input');
          const label = (labelInput.value || '').trim();
          const href = (linkInput.value || '').trim();
          if(label){
            tools.push({
              label,
              href: href || '#'
            });
          }
        });

        const payload = {
          name,
          image: image || 'https://via.placeholder.com/600x900.png?text=Game',
          studio: 'Custom',
          year: new Date().getFullYear(),
          tools,
          instantOpenOnSingleTool: instantOpen
        };

        // custom game for main carousel
        if(editingMode && editingIndex !== null && CUSTOM_MAIN_GAMES[editingIndex]){
          CUSTOM_MAIN_GAMES[editingIndex] = payload;
          persistCustomMainGames();
          rebuildFeaturedGames();
          renderFeaturedGames();
          closeCustomCreateModal();
        }else{
          // New game – check for existing with same / similar name
          const existingIndex = findSimilarByName(CUSTOM_MAIN_GAMES, name);
          if(existingIndex !== -1){
            const existing = CUSTOM_MAIN_GAMES[existingIndex];
            const choice = await showChoiceModal({
              title: 'Duplicate Game',
              message: `You already have a game called "${existing.name || name}".`,
              choices: [
                { label: 'Merge', value: 'merge', style: 'primary' },
                { label: 'Overwrite', value: 'overwrite', style: 'danger' },
                { label: 'Cancel', value: 'cancel', style: 'secondary' }
              ]
            });
            
            if(choice === 'overwrite'){
              CUSTOM_MAIN_GAMES[existingIndex] = payload;
              persistCustomMainGames();
              rebuildFeaturedGames();
              renderFeaturedGames();
              closeCustomCreateModal();
            }else if(choice === 'merge'){
              const merged = await mergeGameCards(existing, payload);
              CUSTOM_MAIN_GAMES[existingIndex] = merged;
              persistCustomMainGames();
              rebuildFeaturedGames();
              renderFeaturedGames();
              closeCustomCreateModal();
            }else{
              // keep old / cancel (do nothing, user can rename or cancel manually)
            }
          }else{
            CUSTOM_MAIN_GAMES.push(payload);
            persistCustomMainGames();
            rebuildFeaturedGames();
            renderFeaturedGames();
            closeCustomCreateModal();
          }
          // no insert sound for games – only for shortcuts
        }
      }else{
        // Shortcut: just a single link target
        const link = (customLinkInput.value || '').trim();
        if(!link){
          customLinkInput.focus();
          return;
        }

        const payload = {
          name,
          image: image || 'https://via.placeholder.com/374x512.png?text=Shortcut',
          studio: 'Custom',
          year: new Date().getFullYear(),
          link
        };

        if(editingMode && editingIndex !== null && CUSTOM_GAMES[editingIndex]){
          // Editing existing shortcut: update but do not play creation sound
          CUSTOM_GAMES[editingIndex] = payload;
          persistCustomGames();
          rebuildFeaturedGames();
          renderFeaturedGames();
          closeCustomCreateModal();
          renderCustomGames();
        }else{
          // New shortcut – check for existing with same / similar name
          const existingIndex = findSimilarByName(CUSTOM_GAMES, name);
          if(existingIndex !== -1){
            const existing = CUSTOM_GAMES[existingIndex];
            const choice = await showChoiceModal({
              title: 'Duplicate Shortcut',
              message: `You already have a shortcut called "${existing.name || name}".`,
              choices: [
                { label: 'Merge', value: 'merge', style: 'primary' },
                { label: 'Overwrite', value: 'overwrite', style: 'danger' },
                { label: 'Cancel', value: 'cancel', style: 'secondary' }
              ]
            });

            if(choice === 'overwrite'){
              CUSTOM_GAMES[existingIndex] = payload;
              persistCustomGames();
              rebuildFeaturedGames();
              renderFeaturedGames();
              closeCustomCreateModal();
              renderCustomGames();
            }else if(choice === 'merge'){
              const merged = await mergeShortcutCards(existing, payload);
              CUSTOM_GAMES[existingIndex] = merged;
              persistCustomGames();
              rebuildFeaturedGames();
              renderFeaturedGames();
              closeCustomCreateModal();
              renderCustomGames();
            }else{
              // keep old / cancel
            }
          }else{
            // Creating a brand new shortcut: append and play insert sound
            CUSTOM_GAMES.push(payload);
            playInsertSound();
            persistCustomGames();
            rebuildFeaturedGames();
            renderFeaturedGames();
            closeCustomCreateModal();
            renderCustomGames();
          }
        }
      }
    });
  }

  if(reorderSaveBtn){
    reorderSaveBtn.addEventListener('click', ()=>{
      if(!reorderOpen || !reorderContext) return;
      const rows = Array.from(reorderListEl.querySelectorAll('.reorder-row'));
      if(reorderContext === 'featured'){
        const newCustom = [];

        rows.forEach(row=>{
          if(row.dataset.deleted === 'true') return;
          const idx = parseInt(row.dataset.index, 10);
          if(Number.isNaN(idx)) return;
          if(CUSTOM_MAIN_GAMES[idx]) newCustom.push(CUSTOM_MAIN_GAMES[idx]);
        });

        // Apply new array (deleted items are dropped automatically)
        CUSTOM_MAIN_GAMES = newCustom;
        persistCustomMainGames();
        rebuildFeaturedGames();
        renderFeaturedGames();
      }else if(reorderContext === 'shortcuts'){
        const newOrder = [];
        rows.forEach(row=>{
          const idx = parseInt(row.dataset.index, 10);
          if(!Number.isNaN(idx) && CUSTOM_GAMES[idx]){
            newOrder.push(CUSTOM_GAMES[idx]);
          }
        });
        if(newOrder.length === CUSTOM_GAMES.length){
          CUSTOM_GAMES = newOrder;
          persistCustomGames();
          rebuildFeaturedGames();
          renderFeaturedGames();
          renderCustomGames();
        }
      }
      closeReorderModal();
    });
  }

  // global button/clickable control sound feedback
  document.addEventListener('click', (e)=>{
    const target = e.target.closest('button,[role="button"],a.tool-link');
    if(!target) return;
    if(target.matches('button') && target.disabled) return;
    playButtonSound();
  });
}

preloadButtonSounds();
preloadInsertSound();
updateClock();
setInterval(updateClock, 1000);
mount();

/**
 * Desktop-only warning banner
 */
const DESKTOP_WARNING_KEY = 'desktopWarningDismissedV1';

function isLikelyDesktop(){
  const ua = navigator.userAgent || '';
  const isTouchDevice = (navigator.maxTouchPoints || 0) > 0;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSmallViewport = window.innerWidth <= 900;
  // Treat as desktop when not a mobile UA, has no touch, and viewport is reasonably wide
  return !isMobileUA && !isTouchDevice && !isSmallViewport;
}

(function initDesktopWarning(){
  const banner = document.getElementById('desktop-warning');
  const dismissBtn = document.getElementById('desktop-warning-dismiss');
  if(!banner || !dismissBtn) return;

  const dismissed = (()=> {
    try{
      return localStorage.getItem(DESKTOP_WARNING_KEY) === '1';
    }catch(e){
      return false;
    }
  })();

  if(isLikelyDesktop() && !dismissed){
    banner.classList.remove('hidden');
    document.body.classList.add('desktop-warning-visible');
  }

  dismissBtn.addEventListener('click', ()=>{
    banner.classList.add('hidden');
    document.body.classList.remove('desktop-warning-visible');
    try{
      localStorage.setItem(DESKTOP_WARNING_KEY, '1');
    }catch(e){
      // ignore
    }
  });
})();

/**
 * Mobile virtual keyboard handling
 * - Uses visualViewport (when available) to translate #app instead of resizing the page.
 * - Keeps the focused input in view while keeping headers/navbars visually stable.
 * - Desktop behavior is unchanged.
 */
(function initMobileKeyboardHandling(){
  if(!appRoot) return;

  const vv = window.visualViewport;
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  const isSmallScreen = window.innerWidth <= 900;

  // Only enable on touch + small screens and when visualViewport is available
  if(!vv || !isTouch || !isSmallScreen) return;

  let baselineHeight = vv.height;
  let keyboardVisible = false;
  let rafPending = false;
  let lastTarget = null;

  function isEditable(el){
    if(!el) return false;
    if(el.tagName === 'INPUT') return true;
    if(el.tagName === 'TEXTAREA') return true;
    const role = el.getAttribute('role');
    if(role === 'textbox') return true;
    return false;
  }

  function updateLastTarget(){
    const active = document.activeElement;
    lastTarget = isEditable(active) ? active : null;
  }

  document.addEventListener('focusin', updateLastTarget);
  document.addEventListener('focusout', ()=>{
    // When focus leaves inputs, we can let the keyboard handling relax
    lastTarget = null;
  });

  function applyKeyboardAdjustment(){
    rafPending = false;
    if(!lastTarget){
      // No focused input – reset any transform when keyboard hides
      if(!keyboardVisible){
        appRoot.style.transform = '';
      }
      return;
    }

    const viewportHeight = vv.height;
    const fullHeight = baselineHeight;

    // Heuristic: consider keyboard visible when viewport shrinks a bit
    keyboardVisible = viewportHeight < fullHeight - 40;

    if(!keyboardVisible){
      appRoot.style.transform = '';
      return;
    }

    // Compute how much we need to lift #app so that the focused input is visible
    const rect = lastTarget.getBoundingClientRect();
    const safePadding = 16; // px between input bottom and viewport bottom
    const maxLift = 260;    // avoid sliding the entire UI off-screen

    const overlap = (rect.bottom + safePadding) - viewportHeight;

    if(overlap > 0){
      const lift = Math.min(overlap, maxLift);
      appRoot.style.transform = `translateY(${-lift}px)`;
    }else{
      // If there's room, gently ease back toward normal to avoid extra blank space
      // but don't snap abruptly.
      appRoot.style.transform = '';
    }
  }

  function onViewportChange(){
    // Keep initial "desktop" height as baseline for this orientation
    if(vv.height > baselineHeight){
      baselineHeight = vv.height;
    }

    if(rafPending) return;
    rafPending = true;
    requestAnimationFrame(applyKeyboardAdjustment);
  }

  vv.addEventListener('resize', onViewportChange);
  vv.addEventListener('scroll', onViewportChange);

  // Clean-up on page hide/unload to avoid leaks
  window.addEventListener('beforeunload', ()=>{
    vv.removeEventListener('resize', onViewportChange);
    vv.removeEventListener('scroll', onViewportChange);
    document.removeEventListener('focusin', updateLastTarget);
  });
})();

/**
 * --- GitHub JSON–based Marketplace (read-only) ---
 *
 * Replaces the database/WebsimSocket marketplace with a simple reader for
 * JSON card files hosted in:
 *   https://github.com/justAleks0/Game-Deck/tree/main/Cards/Games
 *   https://github.com/justAleks0/Game-Deck/tree/main/Cards/Shortcuts
 */

 // Header / footer containers
const footerLeft = document.getElementById('footer-left');
const footerActions = document.getElementById('footer-actions');
const topBar = document.getElementById('top-bar');

// Create a header actions container and move profile buttons into it (if not already done)
let headerActions = document.getElementById('header-actions');
if (!headerActions && topBar) {
  headerActions = document.createElement('div');
  headerActions.id = 'header-actions';
  topBar.appendChild(headerActions);

  if (profileExportBtn) {
    headerActions.appendChild(profileExportBtn);
  }
  if (profileImportBtn) {
    headerActions.appendChild(profileImportBtn);
  }
}

// Background Music (unchanged)
const BGM_URL = "Elevator Music.mp3";
const bgmAudio = new Audio(BGM_URL);
bgmAudio.loop = true;
bgmAudio.volume = 0.25;

let isBgmMuted = false;
try {
  isBgmMuted = localStorage.getItem('bgmMutedV1') === 'true';
} catch(e) {}

function updateBgmState(){
  if(isBgmMuted){
    bgmAudio.pause();
  }else{
    const p = bgmAudio.play();
    if(p !== undefined){
      p.catch(() => {
        // Autoplay blocked, wait for interaction
        const resume = () => {
          if(!isBgmMuted) bgmAudio.play().catch(()=>{});
          window.removeEventListener('click', resume);
          window.removeEventListener('keydown', resume);
          window.removeEventListener('touchstart', resume);
        };
        window.addEventListener('click', resume);
        window.addEventListener('keydown', resume);
        window.addEventListener('touchstart', resume);
      });
    }
  }
}
updateBgmState();

// Dark mode toggle
const DARK_THEME_KEY = 'gameDeckDarkThemeV1';
function applyDarkTheme(dark){
  if(dark){
    document.body.setAttribute('data-theme', 'dark');
  }else{
    document.body.removeAttribute('data-theme');
  }
  try{ localStorage.setItem(DARK_THEME_KEY, dark ? '1' : '0'); }catch(e){}
}
let isDarkTheme = false;
try{ isDarkTheme = localStorage.getItem(DARK_THEME_KEY) === '1'; }catch(e){}
applyDarkTheme(isDarkTheme);

if(headerActions){
  const darkBtn = document.createElement('button');
  darkBtn.type = 'button';
  darkBtn.className = 'pill-btn';
  darkBtn.setAttribute('aria-label', isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode');
  darkBtn.textContent = isDarkTheme ? '☀' : '🌙';
  darkBtn.style.minWidth = '40px';
  darkBtn.addEventListener('click', ()=>{
    isDarkTheme = !isDarkTheme;
    applyDarkTheme(isDarkTheme);
    darkBtn.textContent = isDarkTheme ? '☀' : '🌙';
    darkBtn.setAttribute('aria-label', isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode');
  });
  headerActions.appendChild(darkBtn);
}

// Inject BGM toggle button
if(headerActions){
  const bgmBtn = document.createElement('button');
  bgmBtn.type = 'button';
  bgmBtn.className = 'pill-btn';
  bgmBtn.style.minWidth = '46px';
  bgmBtn.textContent = isBgmMuted ? '♪ OFF' : '♪ ON';
  bgmBtn.addEventListener('click', ()=>{
    isBgmMuted = !isBgmMuted;
    try{ localStorage.setItem('bgmMutedV1', isBgmMuted); }catch(e){}
    bgmBtn.textContent = isBgmMuted ? '♪ OFF' : '♪ ON';
    updateBgmState();
  });
  headerActions.appendChild(bgmBtn);
}

 // Inject marketplace button into header actions (fallback to footer-left if needed)
let marketplaceBtn = null;
const marketplaceContainer = headerActions || footerLeft;
if (marketplaceContainer) {
  marketplaceBtn = document.createElement('button');
  marketplaceBtn.type = 'button';
  marketplaceBtn.className = 'pill-btn';
  marketplaceBtn.id = 'marketplace-open';
  marketplaceBtn.textContent = 'Marketplace';
  marketplaceContainer.appendChild(marketplaceBtn);

  // Card Maker button to open the standalone card-maker page
  const cardMakerBtn = document.createElement('button');
  cardMakerBtn.type = 'button';
  cardMakerBtn.className = 'pill-btn';
  cardMakerBtn.id = 'card-maker-open';
  cardMakerBtn.textContent = 'Card Maker';
  cardMakerBtn.addEventListener('click', () => {
    window.location.href = 'card maker.html';
  });
  marketplaceContainer.appendChild(cardMakerBtn);
}

// Build a simple, read-only marketplace overlay
const marketplaceOverlay = document.createElement('div');
marketplaceOverlay.id = 'marketplace-overlay';
marketplaceOverlay.setAttribute('aria-hidden', 'true');
marketplaceOverlay.innerHTML = `
  <div id="marketplace-panel" role="dialog" aria-modal="true" aria-labelledby="marketplace-title" tabindex="-1">
    <div class="marketplace-header">
      <div class="marketplace-title-block">
        <div id="marketplace-title">Marketplace</div>
        <div id="marketplace-subtitle">Cards from GitHub (read-only)</div>
      </div>
      <button id="marketplace-close" type="button" aria-label="Close marketplace">✕</button>
    </div>

    <div class="marketplace-search-row">
      <input
        id="marketplace-search-input"
        type="text"
        autocomplete="off"
        placeholder="Search by name or description"
      />
      <button id="marketplace-search-clear" type="button" class="pill-btn">Clear</button>
    </div>

    <div class="marketplace-row tabs-row">
      <div id="marketplace-tabs">
        <button id="marketplace-tab-games" type="button" class="pill-btn marketplace-tab marketplace-tab-active">Games</button>
        <button id="marketplace-tab-shortcuts" type="button" class="pill-btn marketplace-tab">Shortcuts</button>
      </div>
      <button id="marketplace-refresh" class="pill-btn">Refresh</button>
    </div>

    <div id="marketplace-list"></div>

    <div class="marketplace-footer">
      <button id="marketplace-close-bottom" class="secondary-btn">Close</button>
    </div>
  </div>
`;
document.body.appendChild(marketplaceOverlay);

// DOM references for marketplace
const marketplacePanel = document.getElementById('marketplace-panel');
const marketplaceClose = document.getElementById('marketplace-close');
const marketplaceCloseBottom = document.getElementById('marketplace-close-bottom');
const marketplaceList = document.getElementById('marketplace-list');
const marketplaceSearchInput = document.getElementById('marketplace-search-input');
const marketplaceSearchClearBtn = document.getElementById('marketplace-search-clear');
const marketplaceRefreshBtn = document.getElementById('marketplace-refresh');
const marketplaceTabGames = document.getElementById('marketplace-tab-games');
const marketplaceTabShortcuts = document.getElementById('marketplace-tab-shortcuts');

let marketplaceOpen = false;
let marketplaceFilter = 'games'; // 'games' | 'shortcuts'
let marketplaceSearchQuery = '';

// In-memory cache of GitHub cards
let githubMarketplace = {
  games: [],
  shortcuts: [],
  loadedGames: false,
  loadedShortcuts: false
};

// GitHub API helpers
const GITHUB_API_BASE = 'https://api.github.com/repos/justAleks0/Game-Deck/contents/Cards';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/justAleks0/Game-Deck/main/Cards';

async function fetchGithubDirectory(dir){
  const url = `${GITHUB_API_BASE}/${dir}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
  if(!res.ok){
    throw new Error(`GitHub API error for ${dir}: ${res.status}`);
  }
  return res.json();
}

async function fetchJsonFile(path){
  const url = `${GITHUB_RAW_BASE}/${path}`;
  const res = await fetch(url);
  if(!res.ok){
    throw new Error(`Failed to fetch card ${path}: ${res.status}`);
  }
  return res.json();
}

function normalizeGithubCardPayload(payload, kindFallback){
  const kind = payload.kind || kindFallback;
  const common = {
    name: payload.name || 'Untitled',
    image: payload.image || '',
    description: payload.description || '',
    kind
  };
  if(kind === 'shortcut'){
    return {
      ...common,
      link: (payload.link || '').trim(),
      tools: Array.isArray(payload.tools) ? payload.tools : []
    };
  }
  // game
  return {
    ...common,
    studio: payload.studio || 'Custom',
    year: payload.year || new Date().getFullYear(),
    instantOpenOnSingleTool: payload.instantOpenOnSingleTool !== false,
    tools: Array.isArray(payload.tools) ? payload.tools : []
  };
}

async function loadGithubCards(kind){
  try{
    const dir = kind === 'games' ? 'Games' : 'Shortcuts';
    const entries = await fetchGithubDirectory(dir);
    const jsonFiles = (entries || []).filter(e => e && e.type === 'file' && /\.json$/i.test(e.name));

    const cards = [];
    for(const file of jsonFiles){
      const relativePath = `${dir}/${file.name}`;
      try{
        const payload = await fetchJsonFile(relativePath);
        const normalized = normalizeGithubCardPayload(payload, kind === 'games' ? 'game' : 'shortcut');
        cards.push({
          id: relativePath,
          path: relativePath,
          sourceUrl: file.html_url || `https://github.com/justAleks0/Game-Deck/blob/main/Cards/${relativePath}`,
          payload: normalized
        });
      }catch(e){
        // Skip malformed files but don't break the whole list
        console.warn('Failed to load card', relativePath, e);
      }
    }

    if(kind === 'games'){
      githubMarketplace.games = cards;
      githubMarketplace.loadedGames = true;
    }else{
      githubMarketplace.shortcuts = cards;
      githubMarketplace.loadedShortcuts = true;
    }
  }catch(e){
    console.error('GitHub marketplace load failed', e);
    showToast('Failed to load marketplace from GitHub');
  }
}

function setMarketplaceFilter(filter){
  marketplaceFilter = filter;
  if(marketplaceTabGames){
    marketplaceTabGames.classList.toggle('marketplace-tab-active', filter === 'games');
  }
  if(marketplaceTabShortcuts){
    marketplaceTabShortcuts.classList.toggle('marketplace-tab-active', filter === 'shortcuts');
  }
  renderMarketplaceRecords();
}

function getCurrentGithubList(){
  if(marketplaceFilter === 'shortcuts'){
    return githubMarketplace.shortcuts || [];
  }
  return githubMarketplace.games || [];
}

function showMarketplaceLoading(){
  if(!marketplaceList) return;
  marketplaceList.innerHTML = '<div class="marketplace-loading"><div class="marketplace-spinner" aria-hidden="true"></div><span>Loading from GitHub…</span></div>';
}

function renderMarketplaceRecords(){
  if(!marketplaceList) return;
  const list = getCurrentGithubList();
  marketplaceList.innerHTML = '';

  const search = (marketplaceSearchQuery || '').trim().toLowerCase();

  const filtered = list.filter(item=>{
    const p = item.payload || {};
    if(!search) return true;
    const parts = [
      p.name,
      p.description,
      p.studio,
      p.kind
    ];
    if(Array.isArray(p.tools)){
      p.tools.forEach(t=>{
        if(t && typeof t === 'object'){
          parts.push(t.label, t.href);
        }
      });
    }
    const haystack = parts.filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(search);
  });

  if(filtered.length === 0){
    const empty = document.createElement('div');
    empty.className = 'tool-empty marketplace-empty';
    if(search){
      empty.textContent = 'No cards match your search.';
    }else{
      empty.textContent = 'No cards found in this category.';
    }
    marketplaceList.appendChild(empty);
    return;
  }

  filtered.forEach(item=>{
    const p = item.payload || {};
    const li = document.createElement('div');
    li.className = 'marketplace-row-item';

    const left = document.createElement('div');
    left.className = 'marketplace-left';

    const img = document.createElement('img');
    img.className = 'marketplace-thumb';
    img.src = p.image || 'https://via.placeholder.com/120x160.png?text=Card';
    img.alt = p.name || 'Card';

    const meta = document.createElement('div');
    meta.className = 'marketplace-meta';

    const desc = (p.description || '').slice(0, 160);

    meta.innerHTML = `
      <div class="marketplace-title-text" title="${escapeHtml(p.name || 'Untitled')}">
        ${escapeHtml(p.name || 'Untitled')}
      </div>
      <div class="marketplace-meta-text">
        ${escapeHtml(p.kind || (marketplaceFilter === 'games' ? 'game' : 'shortcut'))}
      </div>
      <div class="marketplace-desc-text">
        ${escapeHtml(desc)}
      </div>
    `;

    left.appendChild(img);
    left.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'marketplace-right';

    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'pill-btn marketplace-action-btn';
    importBtn.textContent = 'Import';
    importBtn.addEventListener('click', async ()=>{
      await importGithubCard(item);
    });

    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'pill-btn marketplace-action-btn';
    viewBtn.textContent = 'View JSON';
    viewBtn.addEventListener('click', ()=>{
      // Toggle an inline JSON viewer inside this list item
      let existing = li.querySelector('.marketplace-json-view');
      if(existing){
        existing.remove();
        return;
      }
      const pre = document.createElement('pre');
      pre.className = 'marketplace-json-view';
      pre.textContent = JSON.stringify(item.payload || {}, null, 2);
      pre.style.marginTop = '6px';
      pre.style.padding = '6px';
      pre.style.borderRadius = '2px';
      pre.style.background = '#050609';
      pre.style.border = '1px solid rgba(31,41,55,0.9)';
      pre.style.fontSize = '10px';
      pre.style.maxHeight = '200px';
      pre.style.overflow = 'auto';
      pre.style.whiteSpace = 'pre';
      li.appendChild(pre);
    });

    actions.appendChild(importBtn);
    actions.appendChild(viewBtn);

    li.appendChild(left);
    li.appendChild(actions);
    marketplaceList.appendChild(li);
  });
}

async function importGithubCard(item){
  const p = item && item.payload;
  if(!p) return;

  if(p.kind === 'shortcut'){
    const shortcut = {
      name: p.name || 'Shortcut',
      image: p.image || 'https://via.placeholder.com/374x512.png?text=Shortcut',
      studio: 'GitHub',
      year: new Date().getFullYear(),
      link: (p.link || '').trim()
    };

    if(!shortcut.link){
      showToast('This shortcut has no link defined yet.');
      return;
    }

    const name = shortcut.name || 'Shortcut';
    const existingIndex = findSimilarByName(CUSTOM_GAMES, name);
    if(existingIndex !== -1){
      const existing = CUSTOM_GAMES[existingIndex];
      const choice = await showChoiceModal({
        title: 'Duplicate Shortcut',
        message: `You already have a shortcut called "${existing.name || name}".`,
        choices: [
          { label: 'Merge', value: 'merge', style: 'primary' },
          { label: 'Overwrite', value: 'overwrite', style: 'danger' },
          { label: 'Cancel', value: 'cancel', style: 'secondary' }
        ]
      });
      if(choice === 'overwrite'){
        CUSTOM_GAMES[existingIndex] = shortcut;
      }else if(choice === 'merge'){
        const merged = await mergeShortcutCards(existing, shortcut);
        CUSTOM_GAMES[existingIndex] = merged;
      }else{
        showToast('Import cancelled');
        return;
      }
    }else{
      CUSTOM_GAMES.push(shortcut);
    }

    persistCustomGames();
    rebuildFeaturedGames();
    renderFeaturedGames();
    renderCustomGames();
    showToast('Shortcut imported from GitHub');
  }else{
    const game = {
      name: p.name || 'Game',
      image: p.image || 'https://via.placeholder.com/600x900.png?text=Game',
      studio: p.studio || 'GitHub',
      year: p.year || new Date().getFullYear(),
      instantOpenOnSingleTool: p.instantOpenOnSingleTool !== false,
      tools: Array.isArray(p.tools) ? p.tools.map(t => ({
        label: t && t.label ? String(t.label) : '',
        href: t && t.href ? String(t.href) : ''
      })) : []
    };

    const name = game.name || 'Game';
    const existingIndex = findSimilarByName(CUSTOM_MAIN_GAMES, name);
    if(existingIndex !== -1){
      const existing = CUSTOM_MAIN_GAMES[existingIndex];
      const choice = await showChoiceModal({
        title: 'Duplicate Game',
        message: `You already have a game called "${existing.name || name}".`,
        choices: [
          { label: 'Merge', value: 'merge', style: 'primary' },
          { label: 'Overwrite', value: 'overwrite', style: 'danger' },
          { label: 'Cancel', value: 'cancel', style: 'secondary' }
        ]
      });
      if(choice === 'overwrite'){
        CUSTOM_MAIN_GAMES[existingIndex] = game;
      }else if(choice === 'merge'){
        const merged = await mergeGameCards(existing, game);
        CUSTOM_MAIN_GAMES[existingIndex] = merged;
      }else{
        showToast('Import cancelled');
        return;
      }
    }else{
      CUSTOM_MAIN_GAMES.push(game);
    }

    persistCustomMainGames();
    rebuildFeaturedGames();
    renderFeaturedGames();
    showToast('Game imported from GitHub');
  }
}

// Open / close marketplace
function openMarketplace(){
  if(!marketplaceOverlay || !marketplacePanel) return;
  marketplaceOverlay.classList.add('open');
  marketplaceOverlay.style.opacity = 1;
  marketplaceOverlay.style.pointerEvents = 'auto';
  marketplaceOverlay.setAttribute('aria-hidden','false');
  marketplaceOpen = true;
  lockScroll();
  try{ marketplacePanel.focus(); }catch(e){}
  history.pushState({marketplace:true}, '');

  // Lazy-load GitHub data
  if(marketplaceFilter === 'games' && !githubMarketplace.loadedGames){
    showMarketplaceLoading();
    loadGithubCards('games').then(renderMarketplaceRecords);
  }else if(marketplaceFilter === 'shortcuts' && !githubMarketplace.loadedShortcuts){
    showMarketplaceLoading();
    loadGithubCards('shortcuts').then(renderMarketplaceRecords);
  }else{
    renderMarketplaceRecords();
  }
}

function closeMarketplace(){
  if(!marketplaceOverlay) return;
  marketplaceOverlay.classList.remove('open');
  marketplaceOverlay.style.opacity = 0;
  marketplaceOverlay.style.pointerEvents = 'none';
  marketplaceOverlay.setAttribute('aria-hidden','true');
  marketplaceOpen = false;
  unlockScroll();
}

// Wire up controls
if(marketplaceBtn){
  marketplaceBtn.addEventListener('click', openMarketplace);
}
if(marketplaceClose){
  marketplaceClose.addEventListener('click', ()=> history.back());
}
if(marketplaceCloseBottom){
  marketplaceCloseBottom.addEventListener('click', ()=> history.back());
}
if(marketplaceOverlay){
  marketplaceOverlay.addEventListener('click', (e)=>{
    if(e.target === marketplaceOverlay && marketplaceOpen){
      history.back();
    }
  });
}
if(marketplaceSearchInput){
  marketplaceSearchInput.addEventListener('input', ()=>{
    marketplaceSearchQuery = (marketplaceSearchInput.value || '').trim().toLowerCase();
    renderMarketplaceRecords();
  });
}
if(marketplaceSearchClearBtn){
  marketplaceSearchClearBtn.addEventListener('click', ()=>{
    if(!marketplaceSearchInput) return;
    marketplaceSearchInput.value = '';
    marketplaceSearchQuery = '';
    renderMarketplaceRecords();
    marketplaceSearchInput.focus();
  });
}
if(marketplaceRefreshBtn){
  marketplaceRefreshBtn.addEventListener('click', ()=>{
    showMarketplaceLoading();
    if(marketplaceFilter === 'games'){
      githubMarketplace.loadedGames = false;
      githubMarketplace.games = [];
      loadGithubCards('games').then(renderMarketplaceRecords);
    }else{
      githubMarketplace.loadedShortcuts = false;
      githubMarketplace.shortcuts = [];
      loadGithubCards('shortcuts').then(renderMarketplaceRecords);
    }
  });
}
if(marketplaceTabGames){
  marketplaceTabGames.addEventListener('click', ()=>{
    setMarketplaceFilter('games');
    if(!githubMarketplace.loadedGames){
      showMarketplaceLoading();
      loadGithubCards('games').then(renderMarketplaceRecords);
    }else{
      renderMarketplaceRecords();
    }
  });
}
if(marketplaceTabShortcuts){
  marketplaceTabShortcuts.addEventListener('click', ()=>{
    setMarketplaceFilter('shortcuts');
    if(!githubMarketplace.loadedShortcuts){
      showMarketplaceLoading();
      loadGithubCards('shortcuts').then(renderMarketplaceRecords);
    }else{
      renderMarketplaceRecords();
    }
  });
}

// Close marketplace on browser back
window.addEventListener('popstate', ()=>{
  if(marketplaceOpen){
    closeMarketplace();
  }
});
