// Estoque das vitaminas no evento (um computador só, com as suas telas). Cada quiz concluído
// baixa 1 unidade da sugestão principal; quando um produto acaba, o quiz sugere o próximo.
// As quantidades iniciais vêm da planilha (evento.js, mandadas pela tela): o arquivo guarda só
// o saldo de quem já mudou. "Revisar respostas" e concluir de novo não baixa duas vezes: a
// sessão devolve a unidade anterior se a sugestão mudar.
const fs = require('node:fs')
const path = require('node:path')
const { app } = require('electron')

const MAX_SESSIONS = 500
const file = () => path.join(app.getPath('userData'), 'estoque.json')

let state = null

function load() {
  if (state) return state
  try {
    const raw = JSON.parse(fs.readFileSync(file(), 'utf8'))
    state = {
      ativo: raw.ativo !== false,
      saldo: raw.saldo && typeof raw.saldo === 'object' ? raw.saldo : {},
      sessoes: raw.sessoes && typeof raw.sessoes === 'object' ? raw.sessoes : {},
    }
  } catch {
    state = { ativo: true, saldo: {}, sessoes: {} }
  }
  return state
}

function save() {
  // Só as últimas sessões importam (para "Revisar respostas"): o arquivo não cresce sem fim.
  const sessions = Object.entries(state.sessoes)
  if (sessions.length > MAX_SESSIONS) state.sessoes = Object.fromEntries(sessions.slice(-MAX_SESSIONS))
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify(state, null, 2))
}

const quantity = (value) => Math.max(0, Math.min(9999, Math.round(Number(value)) || 0))

// O que as telas recebem: ligado/desligado, saldo de cada código e qual código cada sessão levou.
const snapshot = () => ({ ativo: load().ativo, saldo: { ...load().saldo }, sessoes: { ...load().sessoes } })

// defaults: { código: quantidade da planilha }, para quem ainda não mudou.
function take({ sessionId, code, defaults = {} } = {}) {
  load()
  if (!state.ativo || !code || !sessionId) return snapshot()
  const previous = state.sessoes[sessionId]
  if (previous === code) return snapshot()
  const current = (key) => state.saldo[key] ?? quantity(defaults[key])
  if (previous) state.saldo[previous] = current(previous) + 1
  state.saldo[code] = Math.max(0, current(code) - 1)
  state.sessoes[sessionId] = code
  save()
  return snapshot()
}

// Pela engrenagem: liga/desliga e corrige quantidades. saldo null volta tudo para a planilha.
function update({ ativo, saldo } = {}) {
  load()
  if (typeof ativo === 'boolean') state.ativo = ativo
  if (saldo === null) state.saldo = {}
  else if (saldo && typeof saldo === 'object') {
    for (const [code, value] of Object.entries(saldo)) {
      if (/^\d{3,8}$/.test(code)) state.saldo[code] = quantity(value)
    }
  }
  save()
  return snapshot()
}

module.exports = { snapshot, take, update }
