// DOM references
const toggleDetoxSwitch = document.getElementById('toggleDetox');
const quickFilterStyle = document.getElementById('quickFilterStyle');
const filteredCountElement = document.getElementById('filteredCount');
const currentModeElement = document.getElementById('currentMode');
const messageElement = document.getElementById('message');

// Settings variables
let settings = {};
let detoxStatus = true;
let statsData = { filteredCount: 0 };

// Initialize popup
function initPopup() {
  // Load settings
  chrome.storage.sync.get(null, (items) => {
    settings = items;
    
    // Update UI to reflect current settings
    quickFilterStyle.value = settings.filterStyle || 'blur';
    currentModeElement.textContent = settings.filterMode ? 'Whitelist' : 'Blacklist';
    
    // Get current tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const activeTab = tabs[0];
      
      if (!activeTab || !activeTab.url || !activeTab.url.includes('youtube.com')) {
        showMessage('Please navigate to YouTube to use this extension.');
        toggleDetoxSwitch.disabled = true;
        quickFilterStyle.disabled = true;
        return;
      }
      
      // Get detox status from content script
      chrome.tabs.sendMessage(activeTab.id, {action: 'getStatus'}, (response) => {
        if (chrome.runtime.lastError || !response) {
          showMessage('YouTube page is still loading. Please try again.');
          return;
        }
        
        detoxStatus = response.status;
        toggleDetoxSwitch.checked = detoxStatus;
        
        // Get stats
        updateStats(activeTab.id);
      });
    });
  });
}

// Update statistics
function updateStats(tabId) {
  chrome.tabs.sendMessage(tabId, {action: 'getStats'}, (response) => {
    if (chrome.runtime.lastError || !response) {
      filteredCountElement.textContent = '0';
      return;
    }
    
    statsData = response;
    filteredCountElement.textContent = response.filteredCount || '0';
  });
}

// Show message to user
function showMessage(msg) {
  messageElement.textContent = msg;
}

// Toggle detox on/off
toggleDetoxSwitch.addEventListener('change', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const activeTab = tabs[0];
    
    if (!activeTab || !activeTab.url.includes('youtube.com')) {
      showMessage('Please navigate to a YouTube page first.');
      return;
    }
    
    chrome.tabs.sendMessage(activeTab.id, {action: 'toggleDetox'}, (response) => {
      if (chrome.runtime.lastError || !response) {
        showMessage('Error communicating with YouTube page.');
        return;
      }
      
      detoxStatus = response.status;
      toggleDetoxSwitch.checked = detoxStatus;
      
      // Update stats after toggle
      setTimeout(() => updateStats(activeTab.id), 500);
    });
  });
});

// Change filter style
quickFilterStyle.addEventListener('change', (e) => {
  const newStyle = e.target.value;
  
  // Update settings
  settings.filterStyle = newStyle;
  chrome.storage.sync.set({filterStyle: newStyle}, () => {
    // Apply changes immediately
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'settingsUpdated'});
      }
    });
  });
});

// Open options page
document.getElementById('options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Open dashboard page
document.getElementById('dashboard').addEventListener('click', () => {
  chrome.tabs.create({url: 'dashboard.html'});
});

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup);
