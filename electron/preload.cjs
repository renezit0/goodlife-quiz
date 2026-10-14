const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('goodlife', {
  saveResponse: (response) => ipcRenderer.invoke('quiz:response', response),
  setQuizActive: (active) => ipcRenderer.send('quiz:active', Boolean(active)),
  getConfig: () => ipcRenderer.invoke('config:get'),
  unlockConfig: (pin) => ipcRenderer.invoke('config:unlock', pin),
  saveConfig: (patch) => ipcRenderer.invoke('config:save', patch),
  openResponses: () => ipcRenderer.invoke('app:open-responses'),
  quit: () => ipcRenderer.invoke('app:quit'),
  calibrateTouch: () => ipcRenderer.invoke('touch:calibrate'),
  onConfigChanged: (callback) => {
    const listener = (_event, config) => callback(config)
    ipcRenderer.on('config:changed', listener)
    return () => ipcRenderer.removeListener('config:changed', listener)
  },
})
