let detoxOn = true;
let settings = {
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

// Statistics tracking
let stats = {
  filteredCount: 0,
  pageLoads: 0,
  lastUpdate: Date.now()
};

// Load settings
function loadSettings() {
  chrome.storage.sync.get(settings, (items) => {
    settings = items;
    applyDetox();
  });
}

// Listen for popup toggle messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggleDetox') {
    detoxOn = !detoxOn;
    applyDetox();
    sendResponse({status: detoxOn});
  } else if (msg.action === 'getStatus') {
    sendResponse({status: detoxOn});
  } else if (msg.action === 'settingsUpdated') {
    loadSettings();
  } else if (msg.action === 'getStats') {
    sendResponse(stats);
  }
  return true; // Keep message channel open for async response
});

// Enhanced filtering logic
function applyDetox() {
  if (!detoxOn) {
    clearAllFilters();
    return;
  }

  // Reset current filtered count for this operation
  let currentFilteredCount = 0;

  document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer').forEach(videoElement => {
    const title = videoElement.querySelector('#video-title')?.textContent?.toLowerCase() || '';
    const channel = videoElement.querySelector('ytd-channel-name')?.textContent?.toLowerCase() || '';
    
    // Check for category (via video metadata or badges)
    const categoryBadges = videoElement.querySelectorAll('.ytd-thumbnail-badge-renderer') || [];
    let categoryMatch = false;
    
    if (settings.categories.gaming && (title.includes('game') || title.includes('gaming') || 
        Array.from(categoryBadges).some(badge => badge.textContent.toLowerCase().includes('gaming')))) {
      categoryMatch = true;
    }
    
    if (settings.categories.music && (title.includes('music') || title.includes('song') || 
        Array.from(categoryBadges).some(badge => badge.textContent.toLowerCase().includes('music')))) {
      categoryMatch = true;
    }
    
    if (settings.categories.news && (title.includes('news') || 
        Array.from(categoryBadges).some(badge => badge.textContent.toLowerCase().includes('news')))) {
      categoryMatch = true;
    }
    
    if (settings.categories.sports && (title.includes('sport') || title.includes('sports') || 
        Array.from(categoryBadges).some(badge => badge.textContent.toLowerCase().includes('sport')))) {
      categoryMatch = true;
    }
    
    // Keyword and channel matching
    const keywordMatch = settings.keywords.some(keyword => 
      title.includes(keyword.toLowerCase()));
    
    const channelMatch = settings.channels.some(channelName => 
      channel.includes(channelName.toLowerCase()));
    
    // Determine if the video should be filtered based on whitelist/blacklist mode
    let shouldFilter;
    
    if (settings.filterMode) {
      // Whitelist mode: filter if NOT matching
      shouldFilter = !(keywordMatch || channelMatch);
    } else {
      // Blacklist mode: filter if matching
      shouldFilter = keywordMatch || channelMatch || categoryMatch;
    }
    
    // Apply filter and update stats
    if (shouldFilter) {
      currentFilteredCount++;
    }
    
    applyFilterToElement(videoElement, shouldFilter);
  });
  
  // Update local stats
  if (currentFilteredCount > 0) {
    stats.filteredCount = currentFilteredCount;
    
    // Report to background script every 5 seconds at most
    const now = Date.now();
    if (now - stats.lastUpdate > 5000) {
      chrome.runtime.sendMessage({
        action: 'updateStats',
        count: currentFilteredCount
      });
      stats.lastUpdate = now;
    }
  }
}

// Apply the selected filter style to an element
function applyFilterToElement(element, shouldFilter) {
  // Reset any previously applied styles
  element.style.filter = '';
  element.style.opacity = '';
  element.style.border = '';
  element.style.display = '';
  
  if (!shouldFilter) return;
  
  switch (settings.filterStyle) {
    case 'blur':
      element.style.filter = `blur(${settings.blurAmount}px)`;
      break;
    case 'dim':
      element.style.opacity = (100 - settings.dimAmount) / 100;
      break;
    case 'hide':
      element.style.display = 'none';
      break;
    case 'border':
      element.style.border = `4px solid ${settings.borderColor}`;
      element.style.boxSizing = 'border-box';
      break;
  }
}

// Clear all applied filters
function clearAllFilters() {
  document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer').forEach(el => {
    el.style.filter = '';
    el.style.opacity = '';
    el.style.border = '';
    el.style.display = '';
  });
  
  // Reset stats when filters are cleared
  stats.filteredCount = 0;
}

// Watch for dynamic content loading
const observer = new MutationObserver(applyDetox);
observer.observe(document.body, {childList: true, subtree: true});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  for (let key in changes) {
    settings[key] = changes[key].newValue;
  }
  applyDetox();
});

// Track page loads for statistics
stats.pageLoads++;

// Load settings and apply initial filtering
loadSettings();
