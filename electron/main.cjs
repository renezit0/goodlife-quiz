const { app, BrowserWindow, ipcMain, screen, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { setupAutoUpdater, installIfIdle, updateStatus } = require('./updater.cjs')

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

// Sem isto, o Windows congela a pintura e o toque de uma tela coberta por outra janela
// (ex.: um aviso do sistema por cima), e o quiz daquela tela trava até ser descoberta.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
// Na linha de comando, --telas=3 e --janela valem só para aquela execução e passam por cima da configuração.
const argTelas = Number(process.argv.find((arg) => arg.startsWith('--telas='))?.split('=')[1])
const argJanela = process.argv.includes('--janela')

// ---------- Configuração (engrenagem no canto da tela) ----------

const defaults = { telas: 2, telaCheia: true, inatividadeSegundos: 60, escala: 100, senha: '' }
const limits = { telas: [1, 4], inatividadeSegundos: [15, 600], escala: [70, 150] }
const configFile = () => process.env.GOODLIFE_CONFIG || path.join(app.getPath('userData'), 'config.json')
let config = { ...defaults }

const clamp = (value, [min, max], fallback) => {
  const number = Math.round(Number(value))
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

function sanitize(raw) {
  return {
    telas: clamp(raw.telas, limits.telas, defaults.telas),
    telaCheia: raw.telaCheia !== false,
    inatividadeSegundos: clamp(raw.inatividadeSegundos, limits.inatividadeSegundos, defaults.inatividadeSegundos),
    escala: clamp(raw.escala, limits.escala, defaults.escala),
    senha: typeof raw.senha === 'string' && /^\d{4,8}$/.test(raw.senha) ? raw.senha : '',
  }
}

function loadConfig() {
  try {
    config = sanitize({ ...defaults, ...JSON.parse(fs.readFileSync(configFile(), 'utf8')) })
  } catch {
    config = { ...defaults }
  }
}

function saveConfig() {
  fs.mkdirSync(path.dirname(configFile()), { recursive: true })
  fs.writeFileSync(configFile(), JSON.stringify(config, null, 2))
}

const screenCount = () => (argTelas >= 1 ? Math.min(argTelas, 8) : config.telas)
const useFullscreen = () => !argJanela && config.telaCheia

// ---------- Respostas ----------

const csvHeader = 'data_hora;tela;sessao;sintoma;idade;perfil;objetivo;atividade;rotina;sono;resultado_perfil;produto\n'
const responsesFile = () =>
  process.env.GOODLIFE_RESPOSTAS || path.join(app.getPath('documents'), 'GoodLife Quiz', 'respostas.csv')

const csvCell = (value) => {
  const text = String(value ?? '')
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Quizzes concluídos = sessões distintas (revisar respostas repete a sessão).
function countSessions() {
  try {
    const rows = fs.readFileSync(responsesFile(), 'utf8').split('\n').slice(1).filter(Boolean)
    return new Set(rows.map((row) => row.split(';')[2])).size
  } catch {
    return 0
  }
}

// Todas as telas enviam para este único processo, que grava em série: dois votos
// ao mesmo tempo nunca se misturam no arquivo.
ipcMain.handle('quiz:response', (_event, response) => {
  const file = responsesFile()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, '﻿' + csvHeader)
  const { answers = {} } = response
  const row = [
    new Date().toLocaleString('pt-BR'),
    response.screen,
    response.sessionId,
    answers.symptom,
    answers.age,
    answers.gender,
    answers.goal,
    answers.activity,
    answers.routine,
    answers.sleep,
    response.profileId,
    response.productName,
  ].map(csvCell).join(';')
  fs.appendFileSync(file, row + '\n')
  return true
})

// ---------- Telas em uso (para não atualizar no meio de um quiz) ----------

const activeScreens = new Set()

ipcMain.on('quiz:active', (event, active) => {
  if (active) activeScreens.add(event.sender.id)
  else {
    activeScreens.delete(event.sender.id)
    installIfIdle()
  }
})

// ---------- Janelas ----------

let windows = []

// Com um monitor por tela, cada janela abre em tela cheia no seu monitor.
// Com menos monitores que telas (ou modo janela), elas dividem o monitor principal lado a lado.
function windowBounds(index, count) {
  const displays = screen.getAllDisplays()
  if (useFullscreen() && displays.length >= count) {
    return { bounds: displays[index].bounds, fullscreen: true }
  }
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea
  const slot = Math.floor(width / count)
  return { bounds: { x: x + slot * index, y, width: slot, height }, fullscreen: false }
}

function createQuizWindow(index, count) {
  const { bounds, fullscreen } = windowBounds(index, count)
  const win = new BrowserWindow({
    ...bounds,
    fullscreen,
    kiosk: fullscreen,
    autoHideMenuBar: true,
    backgroundColor: '#0b679c',
    title: `GoodLife Quiz - Tela ${index + 1}`,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      // Janela sem foco continua animando e respondendo normalmente.
      backgroundThrottling: false,
    },
  })
  win.setMenu(null)
  const contentsId = win.webContents.id
  win.on('closed', () => activeScreens.delete(contentsId))
  win.webContents.on('did-finish-load', () => win.webContents.setZoomFactor(config.escala / 100))

  const screenParam = { tela: String(index + 1) }
  if (DEV_SERVER_URL) win.loadURL(`${DEV_SERVER_URL}?${new URLSearchParams(screenParam)}`)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { query: screenParam })

  // Atalhos locais (não globais): Ctrl+Shift+Q fecha tudo, Ctrl+Shift+F alterna tela cheia.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !input.control || !input.shift) return
    const key = input.key.toLowerCase()
    if (key === 'q') {
      event.preventDefault()
      app.quit()
    } else if (key === 'f') {
      event.preventDefault()
      const next = !win.isFullScreen()
      win.setKiosk(next)
      win.setFullScreen(next)
    } else if (key === 'i' && DEV_SERVER_URL) {
      win.webContents.toggleDevTools()
    }
  })

  return win
}

// Abre o conjunto novo antes de fechar o antigo, para o app não encerrar no meio da troca.
function openWindows() {
  const previous = windows
  const count = screenCount()
  windows = Array.from({ length: count }, (_, index) => createQuizWindow(index, count))
  previous.forEach((win) => !win.isDestroyed() && win.destroy())
}

// ---------- Configurações via IPC ----------

const publicConfig = () => ({
  telas: config.telas,
  telaCheia: config.telaCheia,
  inatividadeSegundos: config.inatividadeSegundos,
  escala: config.escala,
  temSenha: Boolean(config.senha),
  limites: limits,
  monitores: screen.getAllDisplays().length,
  arquivoRespostas: responsesFile(),
  quizzesConcluidos: countSessions(),
  linhaDeComando: { telas: argTelas >= 1 ? argTelas : null, janela: argJanela },
  versao: app.getVersion(),
  atualizacao: updateStatus(),
})

ipcMain.handle('config:get', () => publicConfig())

ipcMain.handle('config:unlock', (_event, pin) => !config.senha || String(pin) === config.senha)

ipcMain.handle('config:save', (_event, patch) => {
  const before = config
  // senha: undefined mantém, '' remove, 4 a 8 dígitos troca.
  config = sanitize({ ...config, ...patch, senha: patch.senha === undefined ? config.senha : patch.senha })
  saveConfig()
  const layoutChanged = before.telas !== config.telas || before.telaCheia !== config.telaCheia
  if (layoutChanged) {
    setTimeout(openWindows, 150)
  } else {
    windows.forEach((win) => {
      win.webContents.setZoomFactor(config.escala / 100)
      win.webContents.send('config:changed', publicConfig())
    })
  }
  return { ...publicConfig(), reabrindo: layoutChanged }
})

ipcMain.handle('app:open-responses', () => {
  const file = responsesFile()
  if (fs.existsSync(file)) shell.showItemInFolder(file)
  else {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    shell.openPath(path.dirname(file))
  }
})

ipcMain.handle('app:quit', () => app.quit())

app.whenReady().then(() => {
  loadConfig()
  openWindows()
  setupAutoUpdater({ isIdle: () => activeScreens.size === 0 })
})

app.on('window-all-closed', () => app.quit())
