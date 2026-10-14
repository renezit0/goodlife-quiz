// Toque em vários monitores no Windows.
// Sem configuração, o Windows manda o toque de TODOS os monitores touch para a tela principal:
// quem toca na tela 2 responde o quiz da tela 1. A associação de cada painel de toque ao seu
// monitor fica em HKLM\SOFTWARE\Microsoft\Wisp\Pen\Digimon e é feita pela ferramenta do próprio
// Windows (MultiDigiMon.exe -touch, a mesma de "Configurações do Tablet PC" → Configurar),
// que pede para tocar em cada tela uma vez.
const { execFile } = require('node:child_process')
const path = require('node:path')
const { screen } = require('electron')

const DIGIMON_KEY = 'HKLM\\SOFTWARE\\Microsoft\\Wisp\\Pen\\Digimon'
const CALIBRATION_TIMEOUT_MS = 5 * 60 * 1000

const run = (file, args, timeout = 15000) => new Promise((resolve) => {
  execFile(file, args, { windowsHide: true, timeout }, (error, stdout) => resolve({ error, stdout: String(stdout || '') }))
})

// Quantos painéis de toque já foram associados a um monitor.
async function mappedTouchPanels() {
  const { stdout } = await run('reg', ['query', DIGIMON_KEY])
  return stdout.split(/\r?\n/).filter((line) => /REG_SZ/.test(line)).length
}

const touchScreens = () => screen.getAllDisplays().filter((display) => display.touchSupport === 'available').length

// Identifica o conjunto de monitores, para pedir a calibração de novo só quando ele mudar.
const displaysSignature = () => screen.getAllDisplays()
  .map((display) => `${display.id}:${display.bounds.width}x${display.bounds.height}`)
  .sort()
  .join('|')

async function needsCalibration() {
  if (process.platform !== 'win32') return false
  if (screen.getAllDisplays().length < 2 || touchScreens() === 0) return false
  return (await mappedTouchPanels()) < Math.min(2, touchScreens())
}

// Abre a ferramenta do Windows e espera a pessoa terminar (ou fechar com Enter/Esc).
// Start-Process passa pelo ShellExecute, que mostra o aviso de administrador se o Windows pedir.
function calibrate() {
  const tool = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'MultiDigiMon.exe')
  return run('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    `Start-Process -FilePath '${tool}' -ArgumentList '-touch' -Wait`,
  ], CALIBRATION_TIMEOUT_MS)
}

module.exports = { needsCalibration, calibrate, displaysSignature, mappedTouchPanels }
