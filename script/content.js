// content.js
const links = document.querySelectorAll('.hsxa-host a');
const linkTexts = Array.from(links).map(link => link.textContent.trim());

// 将提取的链接文本存储到 Chrome Storage
chrome.storage.local.set({ linkTexts: linkTexts });