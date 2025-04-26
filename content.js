let detoxOn = true;

// Listen for popup toggle messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggleDetox') {
    detoxOn = !detoxOn;
    applyDetox();
    sendResponse({status: detoxOn});
  }
});

// Main blurring logic
function applyDetox() {
  chrome.storage.sync.get(['keywords','channels'], ({keywords, channels}) => {
    document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer').forEach(el => {
      const title = el.querySelector('#video-title')?.textContent || '';
      const channel = el.querySelector('ytd-channel-name')?.textContent || '';
      const match = keywords.some(k => title.toLowerCase().includes(k.toLowerCase()))
                    || channels.some(c => channel.toLowerCase().includes(c.toLowerCase()));
      el.style.filter = (detoxOn && !match) ? 'blur(8px)' : '';
    });
  });
}

// Watch for dynamic content loading
const observer = new MutationObserver(applyDetox);
observer.observe(document.body, {childList: true, subtree: true});

// Initial apply
applyDetox();
