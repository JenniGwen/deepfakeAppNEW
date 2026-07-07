chrome.action.onClicked.addListener((tab) => {
  // Buka window kecil khusus untuk recorder agar tidak otomatis tertutup saat klik tempat lain
  chrome.windows.create({
      url: chrome.runtime.getURL("recorder.html"),
      type: "popup",
      width: 420,
      height: 550,
      focused: true
  });
});
