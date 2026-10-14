// Atualização automática pelas releases do GitHub (repositório público, sem token).
// Baixa em segundo plano e só instala quando nenhuma tela está no meio de um quiz,
// para não cortar a pessoa que está respondendo. Depois de instalar, o app reabre sozinho.
const { app } = require('electron')

let autoUpdater = null
try {
  ;({ autoUpdater } = require('electron-updater'))
} catch {
  autoUpdater = null
}

const INTERVAL_MS = 30 * 60 * 1000
// Rede fora do ar no evento é normal: tenta de novo mais cedo, sem avisar ninguém.
const RETRY_MS = 5 * 60 * 1000

const state = { status: 'parado', version: '', ready: false, checking: false, retry: null }
let canInstall = () => true

async function check() {
  if (!autoUpdater || state.checking || state.ready) return
  state.checking = true
  clearTimeout(state.retry)
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    console.error('Falha ao buscar atualização:', error?.message || error)
    state.retry = setTimeout(check, RETRY_MS)
  } finally {
    state.checking = false
  }
}

// Chamado ao baixar a atualização e sempre que uma tela volta para o início.
function installIfIdle() {
  if (!state.ready || !canInstall()) return
  state.status = 'instalando'
  // isSilent = true: instala sem mostrar o instalador; isForceRunAfter = true: reabre o app.
  setImmediate(() => autoUpdater.quitAndInstall(true, true))
}

function setupAutoUpdater({ isIdle }) {
  canInstall = isIdle
  if (!autoUpdater || !app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => { state.status = 'verificando' })
  autoUpdater.on('update-not-available', () => { state.status = 'atualizado' })
  autoUpdater.on('update-available', (info) => {
    state.status = 'baixando'
    state.version = info?.version || ''
  })
  autoUpdater.on('update-downloaded', (info) => {
    state.status = 'pronto'
    state.version = info?.version || state.version
    state.ready = true
    installIfIdle()
  })
  autoUpdater.on('error', (error) => {
    state.status = 'erro'
    console.error('Erro na atualização:', error?.message || error)
  })

  check()
  setInterval(check, INTERVAL_MS)
}

const updateStatus = () => ({ status: state.status, versaoNova: state.version })

module.exports = { setupAutoUpdater, installIfIdle, updateStatus }
