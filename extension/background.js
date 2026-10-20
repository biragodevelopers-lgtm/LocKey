// LocKey Companion - Background Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startClipboardClearTimer') {
    const textToClear = request.text;
    
    // Attende 30 secondi
    setTimeout(async () => {
      try {
        // Ottiene la scheda attiva
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (val) => {
              navigator.clipboard.readText().then(currentText => {
                if (currentText === val) {
                  navigator.clipboard.writeText('');
                  console.log('Clipboard LocKey pulita con successo.');
                }
              }).catch(() => {
                // Se non riusciamo a leggere (mancano permessi temporanei), puliamo comunque per sicurezza
                navigator.clipboard.writeText('');
                console.log('Clipboard LocKey pulita via fallback.');
              });
            },
            args: [textToClear]
          });
        }
      } catch (err) {
        console.error('Errore durante la pulizia in background della clipboard:', err);
      }
    }, 30000);
  }
});
