const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload]: Script is executing!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => {
            ipcRenderer.send(channel, data);
        },
        on: (channel, func) => {
            ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
        },
        removeListener: (channel, func) => {
            ipcRenderer.removeListener(channel, func);
        }
    },
    isElectron: true
});
