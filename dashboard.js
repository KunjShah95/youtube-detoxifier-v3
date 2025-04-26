// Dashboard functionality
let settings = {};
let statsData = {
  totalFiltered: 0,
  dailyStats: {},
  sessionStartTime: 0
};
let dailyChart = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Setup tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
    });
  });
  
  // Load settings and stats
  loadAllData();
  
  // Setup conditional display for filter settings
  document.getElementById('dashFilterStyle').addEventListener('change', updateFilterSettingsVisibility);
  
  // Setup UI interactions
  setupEventListeners();
  
  // Update session time periodically
  setInterval(updateSessionTime, 60000); // Update every minute
});

// Load all settings and statistics
function loadAllData() {
  chrome.storage.sync.get(null, (items) => {
    settings = items;
    updateUIFromSettings();
  });
  
  chrome.runtime.sendMessage({action: 'getStats'}, (response) => {
    if (!response || !response.stats) return;
    
    statsData = response.stats;
    updateStatsDisplay();
    createOrUpdateChart();
  });
}

// Update UI elements to reflect current settings
function updateUIFromSettings() {
  // Filter style
  const filterStyleSelect = document.getElementById('dashFilterStyle');
  filterStyleSelect.value = settings.filterStyle || 'blur';
  
  // Filter mode
  const filterModeSelect = document.getElementById('dashFilterMode');
  filterModeSelect.value = settings.filterMode ? 'whitelist' : 'blacklist';
  updateFilterModeDescription(settings.filterMode);
  
  // Blur amount
  const blurSlider = document.getElementById('dashBlurAmount');
  blurSlider.value = settings.blurAmount || 8;
  document.getElementById('blurValueDisplay').textContent = `${blurSlider.value}px`;
  
  // Dim amount
  const dimSlider = document.getElementById('dashDimAmount');
  dimSlider.value = settings.dimAmount || 70;
  document.getElementById('dimValueDisplay').textContent = `${dimSlider.value}%`;
  
  // Border color
  const borderColorSelect = document.getElementById('dashBorderColor');
  borderColorSelect.value = settings.borderColor || '#ff0000';
  
  // Category checkboxes
  if (settings.categories) {
    document.getElementById('dashCatGaming').checked = settings.categories.gaming || false;
    document.getElementById('dashCatMusic').checked = settings.categories.music || false;
    document.getElementById('dashCatNews').checked = settings.categories.news || false;
    document.getElementById('dashCatSports').checked = settings.categories.sports || false;
  }
  
  // Export settings JSON
  document.getElementById('exportJson').value = JSON.stringify(settings, null, 2);
  
  // Show/hide settings based on current filter style
  updateFilterSettingsVisibility();
}

// Update statistics display
function updateStatsDisplay() {
  document.getElementById('totalFiltered').textContent = statsData.totalFiltered.toLocaleString() || '0';
  updateSessionTime();
}

// Update the session time display
function updateSessionTime() {
  if (!statsData.sessionStartTime) return;
  
  const sessionMs = Date.now() - statsData.sessionStartTime;
  const hours = Math.floor(sessionMs / (1000 * 60 * 60));
  const minutes = Math.floor((sessionMs % (1000 * 60 * 60)) / (1000 * 60));
  
  document.getElementById('sessionTime').textContent = `${hours}h ${minutes}m`;
}

// Create or update the daily statistics chart
function createOrUpdateChart() {
  const ctx = document.getElementById('dailyChart').getContext('2d');
  const noDataMessage = document.getElementById('noDataMessage');
  
  // Check if we have data
  const dailyStats = statsData.dailyStats || {};
  const labels = Object.keys(dailyStats).sort();
  
  if (labels.length === 0) {
    noDataMessage.style.display = 'block';
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  const data = labels.map(date => dailyStats[date]);
  
  // Calculate nice date labels
  const dateLabels = labels.map(dateStr => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });
  
  // Create or update chart
  if (dailyChart) {
    dailyChart.data.labels = dateLabels;
    dailyChart.data.datasets[0].data = data;
    dailyChart.update();
  } else {
    dailyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dateLabels,
        datasets: [{
          label: 'Videos Filtered',
          data: data,
          backgroundColor: 'rgba(204, 0, 0, 0.7)',
          borderColor: 'rgba(204, 0, 0, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }
}

// Show/hide settings based on selected filter style
function updateFilterSettingsVisibility() {
  const filterStyle = document.getElementById('dashFilterStyle').value;
  
  document.getElementById('blurSettings').style.display = 
    filterStyle === 'blur' ? 'block' : 'none';
  
  document.getElementById('dimSettings').style.display = 
    filterStyle === 'dim' ? 'block' : 'none';
  
  document.getElementById('borderSettings').style.display = 
    filterStyle === 'border' ? 'block' : 'none';
}

// Update filter mode description
function updateFilterModeDescription(isWhitelist) {
  const desc = document.getElementById('filterModeDesc');
  
  if (isWhitelist) {
    desc.textContent = 'In Whitelist mode, only videos matching your keywords/channels are shown.';
  } else {
    desc.textContent = 'In Blacklist mode, videos matching your keywords/channels are hidden.';
  }
}

// Setup all event listeners for interactive elements
function setupEventListeners() {
  // Blur amount slider
  document.getElementById('dashBlurAmount').addEventListener('input', (e) => {
    document.getElementById('blurValueDisplay').textContent = `${e.target.value}px`;
  });
  
  // Dim amount slider
  document.getElementById('dashDimAmount').addEventListener('input', (e) => {
    document.getElementById('dimValueDisplay').textContent = `${e.target.value}%`;
  });
  
  // Filter mode dropdown
  document.getElementById('dashFilterMode').addEventListener('change', (e) => {
    const isWhitelist = e.target.value === 'whitelist';
    updateFilterModeDescription(isWhitelist);
  });
  
  // Apply filter mode button
  document.getElementById('applyFilterMode').addEventListener('click', () => {
    const isWhitelist = document.getElementById('dashFilterMode').value === 'whitelist';
    chrome.storage.sync.set({ filterMode: isWhitelist }, () => {
      notifySettingsChanged();
    });
  });
  
  // Apply filter appearance settings button
  document.getElementById('applyFilterSettings').addEventListener('click', () => {
    const newSettings = {
      filterStyle: document.getElementById('dashFilterStyle').value,
      blurAmount: parseInt(document.getElementById('dashBlurAmount').value),
      dimAmount: parseInt(document.getElementById('dashDimAmount').value),
      borderColor: document.getElementById('dashBorderColor').value
    };
    
    chrome.storage.sync.set(newSettings, () => {
      notifySettingsChanged();
    });
  });
  
  // Apply category settings button
  document.getElementById('applyCategorySettings').addEventListener('click', () => {
    const categories = {
      gaming: document.getElementById('dashCatGaming').checked,
      music: document.getElementById('dashCatMusic').checked,
      news: document.getElementById('dashCatNews').checked,
      sports: document.getElementById('dashCatSports').checked
    };
    
    chrome.storage.sync.set({ categories: categories }, () => {
      notifySettingsChanged();
    });
  });
  
  // Copy export JSON button
  document.getElementById('copyExport').addEventListener('click', () => {
    const exportJson = document.getElementById('exportJson');
    exportJson.select();
    document.execCommand('copy');
    alert('Settings copied to clipboard!');
  });
  
  // Import settings button
  document.getElementById('applyImport').addEventListener('click', () => {
    const importText = document.getElementById('importJson').value;
    const importMsg = document.getElementById('importMessage');
    
    try {
      const importData = JSON.parse(importText);
      
      // Validate import data (basic check)
      if (typeof importData !== 'object') {
        throw new Error('Invalid settings format');
      }
      
      chrome.storage.sync.set(importData, () => {
        importMsg.textContent = 'Settings imported successfully!';
        importMsg.style.color = 'green';
        loadAllData(); // Reload UI with new settings
      });
    } catch (error) {
      importMsg.textContent = `Error: ${error.message}`;
      importMsg.style.color = '#c00';
    }
  });
}

// Notify content script about settings changes
function notifySettingsChanged() {
  chrome.tabs.query({url: '*://www.youtube.com/*'}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {action: 'settingsUpdated'})
        .catch(() => {}); // Ignore errors for tabs that can't receive messages
    });
  });
}