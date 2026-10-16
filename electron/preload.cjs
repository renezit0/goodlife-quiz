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
  lookupPerson: (matricula) => ipcRenderer.invoke('roster:lookup', matricula),
  rosterInfo: () => ipcRenderer.invoke('roster:info'),
  importRoster: () => ipcRenderer.invoke('roster:import'),
  importSexo: () => ipcRenderer.invoke('sexo:import'),
  removeSexo: () => ipcRenderer.invoke('sexo:remove'),
  conectaStatus: () => ipcRenderer.invoke('conecta:status'),
  conectaLogin: (usuario, senha) => ipcRenderer.invoke('conecta:login', { usuario, senha }),
  conectaSync: () => ipcRenderer.invoke('conecta:sync'),
  conectaLogout: () => ipcRenderer.invoke('conecta:logout'),
  listPrinters: () => ipcRenderer.invoke('printer:list'),
  printReceipt: (html) => ipcRenderer.invoke('print:receipt', html),
  openResponsesDay: (arquivo) => ipcRenderer.invoke('app:open-responses-day', arquivo),
  getStock: () => ipcRenderer.invoke('estoque:get'),
  takeStock: (request) => ipcRenderer.invoke('estoque:take', request),
  updateStock: (patch) => ipcRenderer.invoke('estoque:update', patch),
  onConfigChanged: (callback) => {
    const listener = (_event, config) => callback(config)
    ipcRenderer.on('config:changed', listener)
    return () => ipcRenderer.removeListener('config:changed', listener)
  },
  onStockChanged: (callback) => {
    const listener = (_event, snapshot) => callback(snapshot)
    ipcRenderer.on('estoque:changed', listener)
    return () => ipcRenderer.removeListener('estoque:changed', listener)
  },
})
