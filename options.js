// Default settings
const defaultSettings = {
  keywords: [],
  channels: [],
  filterMode: false, // false = blacklist, true = whitelist
  filterStyle: 'blur',
  blurAmount: 8,
  dimAmount: 70,
  borderColor: '#ff0000',
  categories: {
    gaming: false,
    music: false,
    news: false,
    sports: false
  }
};

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    // Keywords and channels
    document.getElementById('keywords').value = (settings.keywords || []).join('\n');
    document.getElementById('channels').value = (settings.channels || []).join('\n');
    
    // Filter mode (blacklist/whitelist)
    document.getElementById('filterMode').checked = settings.filterMode;
    updateFilterModeText(settings.filterMode);
    
    // Filter style and appearance settings
    document.getElementById('filterStyle').value = settings.filterStyle;
    document.getElementById('blurAmount').value = settings.blurAmount;
    document.getElementById('blurValue').textContent = settings.blurAmount + 'px';
    document.getElementById('dimAmount').value = settings.dimAmount;
    document.getElementById('dimValue').textContent = settings.dimAmount + '%';
    document.getElementById('borderColor').value = settings.borderColor;
    
    // Category filters
    document.getElementById('catGaming').checked = settings.categories.gaming;
    document.getElementById('catMusic').checked = settings.categories.music;
    document.getElementById('catNews').checked = settings.categories.news;
    document.getElementById('catSports').checked = settings.categories.sports;
  });
});

// Update filter mode text based on toggle state
function updateFilterModeText(isWhitelist) {
  document.getElementById('filterModeText').textContent = 
    isWhitelist ? 'Whitelist Mode' : 'Blacklist Mode';
}

// Event listeners for interactive elements
document.getElementById('filterMode').addEventListener('change', (e) => {
  updateFilterModeText(e.target.checked);
});

document.getElementById('blurAmount').addEventListener('input', (e) => {
  document.getElementById('blurValue').textContent = e.target.value + 'px';
});

document.getElementById('dimAmount').addEventListener('input', (e) => {
  document.getElementById('dimValue').textContent = e.target.value + '%';
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
  const settings = {
    keywords: document.getElementById('keywords').value
              .split('\n').map(s => s.trim()).filter(Boolean),
    channels: document.getElementById('channels').value
              .split('\n').map(s => s.trim()).filter(Boolean),
    filterMode: document.getElementById('filterMode').checked,
    filterStyle: document.getElementById('filterStyle').value,
    blurAmount: parseInt(document.getElementById('blurAmount').value),
    dimAmount: parseInt(document.getElementById('dimAmount').value),
    borderColor: document.getElementById('borderColor').value,
    categories: {
      gaming: document.getElementById('catGaming').checked,
      music: document.getElementById('catMusic').checked,
      news: document.getElementById('catNews').checked,
      sports: document.getElementById('catSports').checked
    }
  };
  
  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  });
});
