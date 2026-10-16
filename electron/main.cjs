const { app, BrowserWindow, dialog, ipcMain, powerSaveBlocker, screen, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { setupAutoUpdater, installIfIdle, updateStatus } = require('./updater.cjs')
const touch = require('./touch.cjs')
const roster = require('./roster.cjs')
const conecta = require('./conecta.cjs')
const printing = require('./printing.cjs')
const estoque = require('./estoque.cjs')
const sexo = require('./sexo.cjs')

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

// Abre sozinho com o Windows: se alguém clicar no atalho de novo, não abre um segundo conjunto de telas.
if (!app.requestSingleInstanceLock()) app.exit(0)

// Sem isto, o Windows congela a pintura e o toque de uma tela coberta por outra janela
// (ex.: um aviso do sistema por cima), e o quiz daquela tela trava até ser descoberta.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
// Na linha de comando, --telas=3 e --janela valem só para aquela execução e passam por cima da configuração.
const argTelas = Number(process.argv.find((arg) => arg.startsWith('--telas='))?.split('=')[1])
const argJanela = process.argv.includes('--janela')

// ---------- Configuração (engrenagem no canto da tela) ----------

// impressoras: nome da impressora de cada tela ('' = padrão do Windows).
const defaults = { telas: 2, telaCheia: true, inatividadeSegundos: 60, escala: 100, senha: '', toqueCalibradoPara: '', imprimir: true, impressoras: {} }
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
    toqueCalibradoPara: typeof raw.toqueCalibradoPara === 'string' ? raw.toqueCalibradoPara : '',
    imprimir: raw.imprimir !== false,
    impressoras: Object.fromEntries(Object.entries(raw.impressoras && typeof raw.impressoras === 'object' ? raw.impressoras : {})
      .filter(([tela, nome]) => /^\d$/.test(tela) && typeof nome === 'string')),
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

const csvHeader = 'data_hora;tela;sessao;matricula;nome;loja;idade;idade_fonte;perfil;perfil_fonte;objetivo;detalhe;atividade;rotina;sono;resultado_perfil;produto;sugestao_2;sugestao_3\n'

// Um arquivo por dia (respostas-16-10-2026.csv), na pasta Documentos\GoodLife Quiz.
// GOODLIFE_RESPOSTAS aponta para um arquivo único, para testes.
const responsesDir = () => path.join(app.getPath('documents'), 'GoodLife Quiz')
const dayStamp = (date = new Date()) => date.toLocaleDateString('pt-BR').replace(/\//g, '-')
const responsesFile = (date = new Date()) =>
  process.env.GOODLIFE_RESPOSTAS || path.join(responsesDir(), `respostas-${dayStamp(date)}.csv`)

const csvCell = (value) => {
  const text = String(value ?? '')
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Quizzes concluídos = sessões distintas (revisar respostas repete a sessão).
function countSessions(file) {
  try {
    const rows = fs.readFileSync(file, 'utf8').split('\n').slice(1).filter(Boolean)
    return new Set(rows.map((row) => row.split(';')[2])).size
  } catch {
    return 0
  }
}

// Dias com respostas, do mais recente ao mais antigo, para a engrenagem.
function responseDays() {
  if (process.env.GOODLIFE_RESPOSTAS) {
    const file = process.env.GOODLIFE_RESPOSTAS
    return fs.existsSync(file) ? [{ dia: path.basename(file), arquivo: file, total: countSessions(file) }] : []
  }
  let names = []
  try {
    names = fs.readdirSync(responsesDir())
  } catch {
    return []
  }
  return names
    .map((name) => name.match(/^respostas-(\d{2})-(\d{2})-(\d{4})\.csv$/i))
    .filter(Boolean)
    .map(([name, dd, mm, yyyy]) => {
      const arquivo = path.join(responsesDir(), name)
      return { dia: `${dd}/${mm}/${yyyy}`, ordem: `${yyyy}${mm}${dd}`, arquivo, total: countSessions(arquivo) }
    })
    .sort((a, b) => b.ordem.localeCompare(a.ordem))
    .map(({ ordem, ...day }) => day)
}

// Todas as telas enviam para este único processo, que grava em série: dois votos
// ao mesmo tempo nunca se misturam no arquivo.
ipcMain.handle('quiz:response', (_event, response) => {
  const file = responsesFile()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  // Arquivo de uma versão anterior (colunas diferentes): guarda com outro nome e começa um novo.
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split('\n')[0] + '\n' !== csvHeader) {
    fs.renameSync(file, file.replace(/\.csv$/i, `-anterior-${Date.now()}.csv`))
  }
  if (!fs.existsSync(file)) fs.writeFileSync(file, '﻿' + csvHeader)
  const { answers = {}, pessoa = {} } = response
  const row = [
    new Date().toLocaleString('pt-BR'),
    response.screen,
    response.sessionId,
    pessoa.matricula,
    pessoa.nome,
    pessoa.loja,
    answers.age,
    response.ageSource,
    answers.gender,
    response.genderSource,
    answers.goal,
    answers.focus,
    answers.activity,
    answers.routine,
    answers.sleep,
    response.profileId,
    response.productName,
    response.alternatives?.[0],
    response.alternatives?.[1],
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
  // Arrastar uma imagem ou link com o dedo nunca troca a página do quiz.
  win.webContents.on('will-navigate', (event) => event.preventDefault())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  const contentsId = win.webContents.id
  win.on('closed', () => activeScreens.delete(contentsId))
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomFactor(config.escala / 100)
    // Tela touch: sem pinça para dar zoom e, no app instalado, sem cursor do mouse.
    win.webContents.setVisualZoomLevelLimits(1, 1)
    if (app.isPackaged) win.webContents.insertCSS('*, *::before, *::after { cursor: none !important; }')
  })

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
  imprimir: config.imprimir,
  impressoras: config.impressoras,
  participantes: roster.info(),
  sexo: sexo.info(),
  conecta: conecta.status(),
  limites: limits,
  monitores: screen.getAllDisplays().length,
  arquivoRespostas: responsesFile(),
  respostasPorDia: responseDays(),
  quizzesConcluidos: responseDays().reduce((sum, day) => sum + day.total, 0),
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

// Abre no Excel o arquivo de um dia (só os da lista da engrenagem).
ipcMain.handle('app:open-responses-day', (_event, arquivo) => {
  if (responseDays().some((day) => day.arquivo === arquivo)) shell.openPath(arquivo)
})

ipcMain.handle('app:quit', () => app.quit())

// ---------- Participantes (matrícula) ----------

// Primeiro a lista no computador (instantâneo, funciona sem internet); se não achar, pergunta à API.
// O sexo vem da API do CONECTA; se não vier, da planilha importada pela engrenagem (sexo.cjs).
const withSexo = (pessoa) => pessoa && { ...pessoa, sexo: pessoa.sexo || sexo.of(pessoa.matricula) }
ipcMain.handle('roster:lookup', async (_event, matricula) => {
  const local = roster.lookup(matricula)
  if (local) return withSexo(local)
  const online = await conecta.lookupOnline(roster.matriculaKey(matricula)).catch(() => null)
  return online ? withSexo(roster.person(online)) : null
})
ipcMain.handle('sexo:import', async (event) => {
  const parent = BrowserWindow.fromWebContents(event.sender)
  const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
    title: 'Importar planilha com o sexo dos participantes',
    filters: [{ name: 'Planilha (matrícula e sexo)', extensions: ['xlsx', 'xlsm', 'csv'] }],
    properties: ['openFile'],
  })
  if (canceled || !filePaths[0]) return { ...sexo.info(), cancelado: true }
  try {
    return await sexo.importFrom(filePaths[0])
  } catch (error) {
    return { ...sexo.info(), erro: error.message }
  }
})
ipcMain.handle('sexo:remove', () => sexo.remove())
ipcMain.handle('conecta:status', () => conecta.status())
ipcMain.handle('conecta:login', (_event, { usuario, senha } = {}) => conecta.login(String(usuario || '').trim(), String(senha || '')))
ipcMain.handle('conecta:sync', () => conecta.sync())
ipcMain.handle('conecta:logout', () => { conecta.logout(); return conecta.status() })
ipcMain.handle('roster:info', () => roster.info())
ipcMain.handle('roster:import', async (event) => {
  const parent = BrowserWindow.fromWebContents(event.sender)
  const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
    title: 'Importar lista de participantes',
    filters: [{ name: 'Lista de participantes', extensions: ['json', 'csv'] }],
    properties: ['openFile'],
  })
  if (canceled || !filePaths[0]) return { ...roster.info(), cancelado: true }
  try {
    return roster.importFrom(filePaths[0])
  } catch (error) {
    return { ...roster.info(), erro: error.message }
  }
})

// ---------- Estoque das vitaminas ----------

// Toda mudança vai para todas as telas, para a próxima sugestão já saber o que acabou.
const broadcastStock = (snapshot) => {
  windows.forEach((win) => !win.isDestroyed() && win.webContents.send('estoque:changed', snapshot))
  return snapshot
}
ipcMain.handle('estoque:get', () => estoque.snapshot())
ipcMain.handle('estoque:take', (_event, request) => broadcastStock(estoque.take(request)))
ipcMain.handle('estoque:update', (_event, patch) => broadcastStock(estoque.update(patch)))

// ---------- Impressão do cupom ----------

const screenOf = (sender) => String(windows.findIndex((win) => !win.isDestroyed() && win.webContents === sender) + 1 || 1)
const printerFor = (tela) => config.impressoras[String(tela)] || ''

ipcMain.handle('printer:list', (event) => printing.listPrinters(event.sender))

ipcMain.handle('print:receipt', async (event, html) => {
  if (!config.imprimir) return { ok: false, desligado: true }
  try {
    return await printing.printHtml({ html, deviceName: printerFor(screenOf(event.sender)) })
  } catch (error) {
    console.error('Falha ao imprimir o cupom:', error)
    return { ok: false, erro: error.message }
  }
})

// ---------- Toque em vários monitores ----------

// As telas do quiz ficam em tela cheia por cima de tudo e esconderiam a ferramenta do Windows:
// fecha as telas, calibra e reabre.
let calibrating = false
async function calibrateTouch() {
  if (calibrating) return
  calibrating = true
  const previous = windows
  windows = []
  activeScreens.clear()
  // Mantém o app vivo sem janelas enquanto a ferramenta do Windows está aberta.
  app.removeListener('window-all-closed', quitWhenNoWindows)
  previous.forEach((win) => !win.isDestroyed() && win.destroy())
  try {
    await touch.calibrate()
    config.toqueCalibradoPara = touch.displaysSignature()
    saveConfig()
  } finally {
    calibrating = false
    openWindows()
    app.on('window-all-closed', quitWhenNoWindows)
  }
}

ipcMain.handle('touch:calibrate', () => { setTimeout(calibrateTouch, 150) })

// Pede a calibração sozinho uma vez para cada conjunto de monitores (se a pessoa pular,
// não insiste a cada reinício; dá para refazer pela engrenagem).
async function calibrateIfNeeded() {
  if (!app.isPackaged || config.toqueCalibradoPara === touch.displaysSignature()) return
  if (await touch.needsCalibration()) await calibrateTouch()
}

app.whenReady().then(() => {
  loadConfig()
  // Totem: abre sozinho quando o Windows liga (só no app instalado, não no npm start).
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: true })
  // Enquanto o app está aberto, o Windows não apaga a tela, não liga a proteção de tela
  // e não entra em suspensão. Ao fechar o app, o Windows volta ao normal.
  powerSaveBlocker.start('prevent-display-sleep')
  openWindows()
  setupAutoUpdater({ isIdle: () => activeScreens.size === 0 })
  conecta.startAutoSync()
  calibrateIfNeeded().catch((error) => console.error('Falha ao verificar o toque:', error))
})

const quitWhenNoWindows = () => app.quit()
app.on('window-all-closed', quitWhenNoWindows)
