// Impressão térmica silenciosa na bobina de 79,5 mm, como na pré-venda (prevendacall).
// O HTML do cupom vem pronto do quiz; aqui só renderizamos numa janela oculta e imprimimos.
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { BrowserWindow } = require('electron')

// Micrômetros: largura da bobina x A4 de altura (a térmica corta no fim do conteúdo).
const PAGE_SIZE = { width: 79500, height: 297000 }

async function listPrinters(webContents) {
  const printers = await webContents.getPrintersAsync()
  return printers.map((printer) => ({
    name: printer.name,
    displayName: printer.displayName || printer.name,
    isDefault: Boolean(printer.isDefault),
  }))
}

async function printHtml({ html, deviceName }) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'goodlife-cupom-'))
  const htmlPath = path.join(tmpDir, 'cupom.html')
  await fs.writeFile(htmlPath, String(html), 'utf8')
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } })
  try {
    await win.loadFile(htmlPath)
    // Espera fontes e imagens (logos, foto do produto) antes de mandar para a impressora.
    await win.webContents.executeJavaScript(`Promise.all([
      document.fonts ? document.fonts.ready : null,
      ...[...document.images].map((img) => img.complete ? null : new Promise((done) => { img.onload = img.onerror = done })),
    ]).then(() => true)`)
    return await new Promise((resolve, reject) => {
      win.webContents.print({
        silent: true,
        printBackground: true,
        deviceName: String(deviceName || '').trim() || undefined,
        pageSize: PAGE_SIZE,
        margins: { marginType: 'none' },
        scaleFactor: 100,
      }, (success, failureReason) => {
        if (success) resolve({ ok: true })
        else reject(new Error(failureReason || 'Falha na impressão'))
      })
    })
  } finally {
    if (!win.isDestroyed()) win.destroy()
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

module.exports = { listPrinters, printHtml }
