const toggleBtn = document.getElementById('toggle');
const msgDiv = document.getElementById('message');

toggleBtn.addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleDetox'}, response => {
      if (chrome.runtime.lastError || !response) {
        msgDiv.textContent = 'Please navigate to a YouTube page first.';
      } else {
        toggleBtn.textContent = response.status ? 'Detox: ON' : 'Detox: OFF';
        msgDiv.textContent = '';
      }
    });
  });
});

document.getElementById('options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
