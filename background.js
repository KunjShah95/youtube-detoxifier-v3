// Statistics tracking
let stats = {
  totalFiltered: 0,
  sessionStartTime: Date.now(),
  dailyStats: {} // Format: { "YYYY-MM-DD": filtered count }
};

// Load saved stats
chrome.storage.local.get(['detoxStats'], (result) => {
  if (result.detoxStats) {
    stats = { ...stats, ...result.detoxStats };
  }
  
  // Reset session start time on extension load
  stats.sessionStartTime = Date.now();
  saveStats();
});

// Save stats to storage
function saveStats() {
  chrome.storage.local.set({ detoxStats: stats });
}

// Update daily stats
function updateDailyStats(count) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  if (!stats.dailyStats[today]) {
    stats.dailyStats[today] = 0;
  }
  
  stats.dailyStats[today] += count;
  stats.totalFiltered += count;
  
  // Cleanup old stats (keep only last 30 days)
  const days = Object.keys(stats.dailyStats).sort();
  if (days.length > 30) {
    const toRemove = days.slice(0, days.length - 30);
    toRemove.forEach(day => delete stats.dailyStats[day]);
  }
  
  saveStats();
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStats') {
    updateDailyStats(message.count || 0);
    sendResponse({success: true});
  } else if (message.action === 'getStats') {
    sendResponse({stats: stats});
  }
  
  return true; // Keep message channel open for async response
});

// Initial setup on install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`YouTube Detoxifier ${details.reason === 'install' ? 'installed' : 'updated'} to v1.2`);
  
  // Set default settings if not already set
  chrome.storage.sync.get(null, (items) => {
    const defaults = {
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
    
    // Only set values that don't exist
    const newSettings = {};
    let needsUpdate = false;
    
    Object.keys(defaults).forEach(key => {
      if (items[key] === undefined) {
        newSettings[key] = defaults[key];
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      chrome.storage.sync.set(newSettings);
    }
  });
});
