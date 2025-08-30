let allGames = [];
const CUSTOM_KEY = 'customGamesV1';
const SELECTED_TEMPLATES_KEY = 'selectedTemplatesV1';
let glitchTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    const base = (typeof companionGames !== 'undefined') ? companionGames : [];
    const filteredBase = base.filter(g => !['Pokémon Violet','Pokémon Legends: Arceus','RPG Maker MV/MZ',"Baldur's Gate 2","Baldur's Gate 3"].includes(g.game));
    initializeApp(filteredBase);
    
    // open Templates modal
    const openTemplatesBtn = document.getElementById('openTemplatesBtn');
    openTemplatesBtn?.addEventListener('click', ()=> document.getElementById('templatesModal')?.classList.add('active'));

    // embedded Suggest Template toggling
    const suggestTemplateBtn = document.getElementById('suggestTemplateBtn');
    const suggestSection = document.getElementById('suggestTemplateSection');
    if (suggestTemplateBtn && suggestSection) {
        suggestTemplateBtn.addEventListener('click', openTemplatesPanel);
    }

    // submission feedback for embedded form
    const suggestionForm = document.getElementById('suggestionForm');
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', (e) => {
            const submitBtn = suggestionForm.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
        });
    }

    // Add resource button functionality (embedded form)
    const addResBtn = document.getElementById('addResourceBtn');
    if (addResBtn) {
        addResBtn.addEventListener('click', () => {
            const container = document.getElementById('resourceFields');
            const resourceCount = container.children.length + 1;
            const newGroup = document.createElement('div');
            newGroup.className = 'resource-field-group';
            newGroup.innerHTML = `
                <h4>Resource ${resourceCount}</h4>
                <input type="text" class="res-title" placeholder="Guide Title" required>
                <input type="text" class="res-site" placeholder="Site Name" required>
                <input type="url" class="res-url" placeholder="URL" required>
            `;
            container.appendChild(newGroup);
        });
    }

    const tModal = document.getElementById('templatesModal');
    const tClose = tModal?.querySelector('.close-btn');
    tClose?.addEventListener('click', ()=> tModal.classList.remove('active'));
    tModal?.addEventListener('click', (e)=>{ if(e.target===tModal) tModal.classList.remove('active'); });
});

function initializeApp(templates) {
    const custom = getCustomGames();
    const selected = getSelectedTemplates();
    const addedFromTemplates = templates.filter(t => selected.includes(t.game)).map(t => ({...t, added:true}));
    allGames = [...addedFromTemplates, ...custom];
    renderTemplates(templates, selected);
    populateSeriesDropdown(allGames);
    renderGames(allGames);
    initHologramCards();
    startGlitchLoop();
    setupSearch();
    setupSeriesDropdown();
    initializeSettings();
    setupCustomModal();
    setupDeleteDelegation();
}

function populateSeriesDropdown(games) {
    const seriesDropdown = document.getElementById('seriesDropdown');
    const uniqueSeries = [...new Set(games.map(game => game.series))].sort();
    
    uniqueSeries.forEach(series => {
        const option = document.createElement('option');
        option.value = series;
        option.textContent = series;
        seriesDropdown.appendChild(option);
    });
}

function renderGames(games) {
    const gamesContainer = document.getElementById('gamesContainer');
    gamesContainer.innerHTML = '';
    
    if (games.length === 0) {
        const searchEmpty = (document.getElementById('searchInput')?.value.trim() === '');
        const seriesAll = (document.getElementById('seriesDropdown')?.value === 'all');
        if (searchEmpty && seriesAll) {
            gamesContainer.innerHTML = `<div class="tutorial"><h3>Welcome to Game Deck</h3><p>Add games to your deck to see guides, maps and tools here.</p><div class="tutorial-actions"><button class="action-btn" onclick="openTemplatesPanel()"><i class="fas fa-th-large"></i> Browse Templates</button><button class="action-btn" onclick="document.getElementById('customModal').classList.add('active')"><i class="fas fa-layer-group"></i> Add Custom Card</button></div><p class="tutorial-hint">Tip: Use the search bar or series dropdown anytime to quickly find things.</p></div>`;
        } else {
            gamesContainer.innerHTML = '<div class="no-results">No games found matching your criteria.</div>';
        }
        return;
    }
    
    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card' + (game.custom ? ' custom' : '');
        
        // Add background class if headerDisplay is "background"
        if (game.headerDisplay === 'background' && game.header) {
            gameCard.classList.add('background-header');
            if (game.header.endsWith('.webm')) {
                gameCard.innerHTML = `
                    <video class="background-video" autoplay loop muted playsinline>
                        <source src="${game.header}" type="video/webm">
                    </video>`;
            } else {
                gameCard.style.backgroundImage = `url(${game.header})`;
            }
        }

        const headerMedia = game.header ? createHeaderMedia(game.header) : '';
        
        gameCard.innerHTML += `
            ${game.headerDisplay === 'above' ? headerMedia : ''}
            <button class="delete-card-btn" style="${(game.custom || game.added)?'':'display:none'}" title="Remove from My Deck"><i class="fas fa-trash"></i></button>
            <div class="game-header">
                <img src="${game.icon}" alt="${game.game} icon" class="game-icon">
                <div class="game-info">
                    <h2 class="game-name">${game.game}</h2>
                    <div class="game-meta">
                        <span class="game-series">${game.series}</span>
                    </div>
                </div>
                <button class="toggle-btn">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="resources-container">
                <div class="resources-list">
                    ${game.headerDisplay === 'dropdown' ? headerMedia : ''}
                    ${game.resources.map(resource => `
                        <div class="resource-item">
                            <a href="${resource.url}" target="_blank" class="resource-link">
                                <div class="resource-info">
                                    <div class="resource-title">${resource.title}</div>
                                    <div class="resource-site">${resource.site}</div>
                                </div>
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="holo-overlays">
                <div class="holo-scan"></div><div class="holo-noise"></div><div class="holo-glow"></div>
            </div>
        `;
        
        const header = gameCard.querySelector('.game-header');
        header.addEventListener('click', () => {
            gameCard.classList.toggle('expanded');
        });
        
        const del = gameCard.querySelector('.delete-card-btn');
        if (del) del.addEventListener('click', (e)=>{ e.stopPropagation(); deleteCard(game); });
        
        gamesContainer.appendChild(gameCard);
    });
}

function createHeaderMedia(headerUrl) {
    if (headerUrl.endsWith('.webm')) {
        return `
            <video class="game-header-media" autoplay loop muted playsinline>
                <source src="${headerUrl}" type="video/webm">
            </video>`;
    }
    return `<img src="${headerUrl}" alt="Game banner" class="game-header-media">`;
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedSeries = document.getElementById('seriesDropdown').value;
        
        filterGames(searchTerm, selectedSeries);
    });
}

function setupSeriesDropdown() {
    const seriesDropdown = document.getElementById('seriesDropdown');
    
    seriesDropdown.addEventListener('change', () => {
        const selectedSeries = seriesDropdown.value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        filterGames(searchTerm, selectedSeries);
    });
}

function filterGames(searchTerm, series) {
    let filteredGames = allGames;
    
    if (series && series !== 'all') {
        filteredGames = filteredGames.filter(game => game.series === series);
    }
    
    if (searchTerm) {
        filteredGames = filteredGames.filter(game => 
            game.game.toLowerCase().includes(searchTerm) || 
            game.series.toLowerCase().includes(searchTerm) ||
            game.resources.some(resource => 
                resource.title.toLowerCase().includes(searchTerm) ||
                resource.site.toLowerCase().includes(searchTerm)
            )
        );
    }
    
    renderGames(filteredGames);
    initHologramCards();
}

function initializeSettings() {
    // Define all settings with their defaults
    const defaultSettings = {
        headerDisplay: 'dropdown',
        cardLayout: 'comfortable',
        fontSize: 'default',
        theme: 'system',
        cardBorder: 'rounded',
        linkDisplay: 'inline',
        gameSorting: 'alphabetical',
        dropdownDefault: 'collapsed',
        animationSpeed: 'smooth'
    };

    // Load all saved settings or use defaults
    const settings = {};
    Object.keys(defaultSettings).forEach(key => {
        settings[key] = localStorage.getItem(`${key}Setting`) || defaultSettings[key];
    });

    // Apply all settings on load
    applyAllSettings(settings);

    // Set up event listeners for all setting options
    const settingInputs = {};
    Object.keys(defaultSettings).forEach(key => {
        settingInputs[key] = document.getElementsByName(key);
    });

    // Check saved options and set up change listeners
    Object.entries(settingInputs).forEach(([settingName, inputs]) => {
        const savedValue = settings[settingName];
        inputs.forEach(input => {
            input.checked = input.value === savedValue;
            if (!input.disabled) {
                input.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        const value = e.target.value;
                        localStorage.setItem(`${settingName}Setting`, value);
                        applyAllSettings({
                            ...settings,
                            [settingName]: value
                        });
                    }
                });
            }
        });
    });

    // Reset button functionality
    document.getElementById('resetSettings').addEventListener('click', () => {
        if (confirm('Reset all settings to default values?')) {
            Object.keys(defaultSettings).forEach(key => {
                localStorage.removeItem(`${key}Setting`);
            });
            location.reload();
        }
    });

    // Modal controls
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = settingsModal.querySelector('.close-btn');
    
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });
    
    closeBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
    
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
}

function applyAllSettings(settings) {
    // Apply all existing settings
    applyHeaderDisplay(settings.headerDisplay);
    document.body.setAttribute('data-layout', settings.cardLayout);
    document.body.setAttribute('data-font-size', settings.fontSize);
    applyTheme(settings.theme);
    
    // Apply new settings
    document.body.setAttribute('data-border', settings.cardBorder);
    document.body.setAttribute('data-link-display', settings.linkDisplay);
    document.body.setAttribute('data-animation', settings.animationSpeed);
    
    // Apply dropdown state
    if (settings.dropdownDefault === 'expanded') {
        document.querySelectorAll('.game-card').forEach(card => {
            card.classList.add('expanded');
        });
    }
    
    // Apply sorting
    sortGames(settings.gameSorting);
}

function sortGames(sortMethod) {
    const container = document.getElementById('gamesContainer');
    const cards = Array.from(container.children);
    
    switch(sortMethod) {
        case 'alphabetical':
            cards.sort((a, b) => {
                const nameA = a.querySelector('.game-name').textContent;
                const nameB = b.querySelector('.game-name').textContent;
                return nameA.localeCompare(nameB);
            });
            break;
            
        case 'recent':
            // Assuming the array order in companionGames represents most recent first
            cards.sort((a, b) => {
                const nameA = a.querySelector('.game-name').textContent;
                const nameB = b.querySelector('.game-name').textContent;
                const indexA = companionGames.findIndex(g => g.game === nameA);
                const indexB = companionGames.findIndex(g => g.game === nameB);
                return indexA - indexB;
            });
            break;
    }
    
    // Reappend cards in new order
    cards.forEach(card => container.appendChild(card));
}

function applyTheme(theme) {
    if (theme === 'system') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        });
    } else {
        document.body.setAttribute('data-theme', theme);
    }
}

function applyHeaderDisplay(displayMode) {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        // Remove existing display classes
        card.classList.remove('background-header');
        
        // Reset any inline styles
        card.style.backgroundImage = '';
        
        // Get header elements
        const headerMedia = card.querySelector('.game-header-media');
        const backgroundVideo = card.querySelector('.background-video');
        
        // Remove existing header elements
        if (headerMedia) headerMedia.remove();
        if (backgroundVideo) backgroundVideo.remove();
        
        if (displayMode === 'hidden') return;
        
        // Get game data
        const gameTitle = card.querySelector('.game-name').textContent;
        const game = allGames.find(g => g.game === gameTitle);
        if (!game || !game.header) return;
        
        // Apply new display mode
        switch(displayMode) {
            case 'background':
                if (game.header.endsWith('.webm')) {
                    card.insertAdjacentHTML('afterbegin', `
                        <video class="background-video" autoplay loop muted playsinline>
                            <source src="${game.header}" type="video/webm">
                        </video>
                    `);
                } else {
                    card.style.backgroundImage = `url(${game.header})`;
                }
                card.classList.add('background-header');
                break;
                
            case 'above':
                card.querySelector('.game-header').insertAdjacentHTML('beforebegin', 
                    createHeaderMedia(game.header));
                break;
                
            case 'dropdown':
                card.querySelector('.resources-list').insertAdjacentHTML('afterbegin', 
                    createHeaderMedia(game.header));
                break;
        }
    });
}

function packageSuggestion() {
    const titles = [...document.querySelectorAll('.res-title')].map(el => el.value);
    const sites = [...document.querySelectorAll('.res-site')].map(el => el.value);
    const urls = [...document.querySelectorAll('.res-url')].map(el => el.value);

    const resources = titles.map((_, i) => ({
        title: titles[i],
        site: sites[i],
        url: urls[i]
    }));

    const json = {
        game: document.getElementById('gameInput').value,
        series: document.getElementById('seriesInput').value,
        icon: document.getElementById('iconInput').value,
        header: document.getElementById('headerInput').value,
        headerDisplay: document.getElementById('headerDisplayInput').value,
        credit: document.getElementById('creditInput').value,
        resources
    };

    document.getElementById('jsonData').value = JSON.stringify(json, null, 2);
    return true;
}

window.packageSuggestion = packageSuggestion;

function initHologramCards() {
    document.querySelectorAll('.game-card').forEach(card => {
        const update = (e) => {
            const r = card.getBoundingClientRect();
            const px = ((e.clientX ?? r.left + r.width/2) - r.left) / r.width;
            const py = ((e.clientY ?? r.top + r.height/2) - r.top) / r.height;
            card.style.setProperty('--rx', ((0.5 - py) * 12).toFixed(2) + 'deg');
            card.style.setProperty('--ry', ((px - 0.5) * 16).toFixed(2) + 'deg');
            card.style.setProperty('--tx', ((px - 0.5) * 8).toFixed(2) + 'px');
            card.style.setProperty('--ty', ((py - 0.5) * 8).toFixed(2) + 'px');
            card.style.setProperty('--glow-x', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--glow-y', (py * 100).toFixed(1) + '%');
        };
        card.addEventListener('mousemove', update);
        card.addEventListener('mouseleave', () => { card.style.cssText = ''; });
    });
}

function startGlitchLoop(){
    if (glitchTimer) clearInterval(glitchTimer);
    glitchTimer = setInterval(() => {
        const cards = document.querySelectorAll('.game-card');
        if (!cards.length) return;
        const c = cards[Math.floor(Math.random()*cards.length)];
        c.classList.add('glitch'); setTimeout(()=>c.classList.remove('glitch'), 220);
    }, 2500);
}

function getCustomGames(){ try{ return JSON.parse(localStorage.getItem(CUSTOM_KEY))||[];}catch{return[];} }
function saveCustomGames(list){ localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)); }
function addCustomGame(data){
  const list = getCustomGames();
  list.push({...data, custom:true});
  saveCustomGames(list);
  initializeApp([...(typeof companionGames!=='undefined'?companionGames:[]), ...list]);
}
function deleteCustomGame(id){
  const list = getCustomGames().filter(g=>g.id!==id);
  saveCustomGames(list);
  const base = (typeof companionGames !== 'undefined') ? companionGames : [];
  const filteredBase = base.filter(g => !['Pokémon Violet','Pokémon Legends: Arceus','RPG Maker MV/MZ',"Baldur's Gate 2","Baldur's Gate 3"].includes(g.game));
  initializeApp(filteredBase);
}

function setupCustomModal(){
  const btn = document.getElementById('addCustomBtn');
  const modal = document.getElementById('customModal');
  const closeBtns = modal.querySelectorAll('.close-btn');
  btn.addEventListener('click', ()=> modal.classList.add('active'));
  modal.addEventListener('click', e=>{ if(e.target===modal) modal.classList.remove('active'); });
  closeBtns.forEach(b=> b.addEventListener('click', ()=> modal.classList.remove('active')));
  document.getElementById('c_addRes').addEventListener('click', ()=>{
    const c = document.getElementById('c_resources'); const n = c.children.length+1;
    const d = document.createElement('div'); d.className='resource-field-group';
    d.innerHTML = `<h4>Resource ${n}</h4><input class="c_res_title" placeholder="Guide Title" required>
    <input class="c_res_site" placeholder="Site Name" required><input class="c_res_url" type="url" placeholder="URL" required>`;
    c.appendChild(d);
  });
  document.getElementById('customForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const titles=[...document.querySelectorAll('.c_res_title')].map(i=>i.value);
    const sites=[...document.querySelectorAll('.c_res_site')].map(i=>i.value);
    const urls=[...document.querySelectorAll('.c_res_url')].map(i=>i.value);
    const resources=titles.map((_,i)=>({title:titles[i],site:sites[i],url:urls[i]}));
    addCustomGame({
      id: Date.now(),
      game: document.getElementById('c_game').value,
      series: document.getElementById('c_series').value,
      icon: document.getElementById('c_icon').value,
      header: document.getElementById('c_header').value,
      headerDisplay: document.getElementById('c_headerDisplay').value,
      credit: 'You',
      resources
    });
    modal.classList.remove('active'); e.target.reset();
  });
}

function renderTemplates(templates, selected){
  const containers = document.querySelectorAll('.templates-container');
  containers.forEach(wrap=>{
    wrap.innerHTML = '';
    templates.forEach(t=>{
      const card = document.createElement('div'); card.className='template-card';
      card.innerHTML = `<div class="t-head"><img src="${t.icon}" alt="${t.game}"><div><div class="t-title">${t.game}</div><div class="t-series">${t.series}</div></div></div><div class="t-actions"><button class="add-btn"${selected.includes(t.game)?' disabled':''}>${selected.includes(t.game)?'Added':'Add to My Deck'}</button></div>`;
      card.querySelector('.add-btn')?.addEventListener('click', ()=>{ addTemplateToDeck(t.game); });
      wrap.appendChild(card);
    });
  });
}

function getSelectedTemplates(){ try{ return JSON.parse(localStorage.getItem(SELECTED_TEMPLATES_KEY))||[];}catch{return[];} }
function saveSelectedTemplates(list){ localStorage.setItem(SELECTED_TEMPLATES_KEY, JSON.stringify(list)); }
function addTemplateToDeck(gameName){
  const s = getSelectedTemplates(); if(!s.includes(gameName)){ s.push(gameName); saveSelectedTemplates(s); }
  const base = (typeof companionGames !== 'undefined') ? companionGames : [];
  const filteredBase = base.filter(g => !['Pokémon Violet','Pokémon Legends: Arceus','RPG Maker MV/MZ',"Baldur's Gate 2","Baldur's Gate 3"].includes(g.game));
  initializeApp(filteredBase);
}
function deleteCard(game){
  if (game.custom){ deleteCustomGame(game.id); return; }
  if (game.added){
    const s = getSelectedTemplates().filter(n=>n!==game.game); saveSelectedTemplates(s);
    const base = (typeof companionGames !== 'undefined') ? companionGames : [];
    const filteredBase = base.filter(g => !['Pokémon Violet','Pokémon Legends: Arceus','RPG Maker MV/MZ',"Baldur's Gate 2","Baldur's Gate 3"].includes(g.game));
    initializeApp(filteredBase);
  }
}

function setupDeleteDelegation() {
  const container = document.getElementById('gamesContainer');
  if (container._delBound) return;
  container._delBound = true;
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-card-btn');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const card = btn.closest('.game-card');
    const title = card?.querySelector('.game-name')?.textContent;
    const game = allGames.find(g => g.game === title);
    if (game) deleteCard(game);
  });
}

function openTemplatesPanel(){
  const tm = document.getElementById('templatesModal');
  tm?.classList.add('active');
}
window.openTemplatesPanel = openTemplatesPanel;