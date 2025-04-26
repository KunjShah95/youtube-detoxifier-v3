// Load saved lists
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['keywords','channels'], ({keywords, channels}) => {
    document.getElementById('keywords').value = (keywords || []).join('\n');
    document.getElementById('channels').value = (channels || []).join('\n');
  });
});

// Save lists
document.getElementById('save').addEventListener('click', () => {
  const kw = document.getElementById('keywords').value
               .split('\n').map(s => s.trim()).filter(Boolean);
  const ch = document.getElementById('channels').value
               .split('\n').map(s => s.trim()).filter(Boolean);
  chrome.storage.sync.set({keywords: kw, channels: ch}, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 2000);
  });
});
