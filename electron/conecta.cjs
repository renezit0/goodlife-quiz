// API do CONECTA (a mesma do app CONECTA Check-in): baixa as equipes para a lista de participantes
// e consulta uma matrícula que ainda não está na lista. Exige login de admin, RH ou marketing,
// feito uma vez pela engrenagem. A sessão fica cifrada pelo Windows (safeStorage) e é renovada
// sozinha com o "lembrar-me", como no Check-in.
const fs = require('node:fs')
const path = require('node:path')
const { app, safeStorage } = require('electron')

const API_BASE = 'https://api.seellbr.com/vendascall/api'
const SYNC_INTERVAL_MS = 15 * 60 * 1000

const sessionFile = () => path.join(app.getPath('userData'), 'conecta-sessao.json')
const rosterFile = () => path.join(app.getPath('userData'), 'colaboradores-api.json')

// ---------- Sessão ----------

const encrypt = (value) => (value && safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(value).toString('base64') : null)
const decrypt = (value) => {
  try {
    return value && safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(value, 'base64')) : null
  } catch {
    return null
  }
}

function readSession() {
  try {
    const raw = JSON.parse(fs.readFileSync(sessionFile(), 'utf8'))
    return { usuario: raw.usuario || '', token: decrypt(raw.token), rememberToken: decrypt(raw.rememberToken), ultimaSync: raw.ultimaSync || null, erro: raw.erro || '' }
  } catch {
    return { usuario: '', token: null, rememberToken: null, ultimaSync: null, erro: '' }
  }
}

function writeSession(session) {
  fs.mkdirSync(path.dirname(sessionFile()), { recursive: true })
  fs.writeFileSync(sessionFile(), JSON.stringify({
    usuario: session.usuario,
    token: encrypt(session.token),
    rememberToken: encrypt(session.rememberToken),
    ultimaSync: session.ultimaSync,
    erro: session.erro || '',
  }, null, 2))
}

let session = null
const current = () => (session ||= readSession())
const update = (patch) => {
  session = { ...current(), ...patch }
  writeSession(session)
}

// ---------- HTTP ----------

async function request(method, route, body, { timeoutMs = 8000, renew = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (current().token) headers.Authorization = `Bearer ${current().token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let response
  try {
    response = await fetch(`${API_BASE}${route}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    return { ok: false, offline: true, status: 0, mensagem: 'Sem conexão com a API do CONECTA.' }
  }
  let json = null
  try {
    json = await response.json()
  } catch {
    json = null
  }
  const result = { ok: response.ok, status: response.status, json, data: json?.data ?? json, mensagem: json?.mensagem || json?.message || `Erro ${response.status}` }
  if (response.status === 401 && renew && await renewSession()) return request(method, route, body, { timeoutMs, renew: false })
  return result
}

async function renewSession() {
  const remember = current().rememberToken
  if (!remember) return false
  const result = await request('POST', '/auth/verify-remember-token', { token: remember }, { timeoutMs: 15000, renew: false })
  if (!result.ok || !result.json?.token) return false
  update({ token: result.json.token })
  return true
}

// ---------- Equipes → lista de participantes ----------

// Mesmo formato do roster.json do Check-in, lido por roster.cjs.
function buildPeople(data) {
  const pessoas = {}
  for (const grupo of data?.grupos || []) {
    for (const membro of grupo.membros || []) {
      pessoas[String(membro.matricula)] = { ...membro, grupo: grupo.grupo, grupo_nome: grupo.nome, mitologia: grupo.mitologia, staff: false }
    }
  }
  for (const membro of data?.staff || []) {
    pessoas[String(membro.matricula)] = { ...membro, staff: true }
  }
  return pessoas
}

let syncing = null
async function sync() {
  if (!current().token && !current().rememberToken) return { ok: false, mensagem: 'Entre com uma conta do CONECTA.' }
  syncing ||= (async () => {
    const result = await request('GET', '/conecta/grupos', undefined, { timeoutMs: 30000 })
    if (!result.ok) {
      // Sem internet não é erro de conta: mantém a última lista baixada e tenta de novo depois.
      if (result.status === 401 || result.status === 403) update({ erro: 'Sessão expirada: entre de novo.' })
      return { ok: false, mensagem: result.mensagem }
    }
    const pessoas = buildPeople(result.data)
    const total = Object.keys(pessoas).length
    if (!total) return { ok: false, mensagem: 'A API não devolveu nenhuma pessoa.' }
    fs.mkdirSync(path.dirname(rosterFile()), { recursive: true })
    fs.writeFileSync(rosterFile(), JSON.stringify({ atualizado_em: new Date().toISOString(), pessoas }))
    update({ ultimaSync: new Date().toISOString(), erro: '' })
    return { ok: true, total }
  })().finally(() => { syncing = null })
  return syncing
}

async function login(usuario, senha) {
  session = { usuario: '', token: null, rememberToken: null, ultimaSync: null, erro: '' }
  const result = await request('POST', '/auth/login', { usuario, senha, lembrar: true }, { timeoutMs: 15000, renew: false })
  if (!result.ok || !result.json?.token) return { ok: false, mensagem: result.status === 0 ? result.mensagem : (result.mensagem || 'Usuário ou senha inválidos.') }
  update({ usuario, token: result.json.token, rememberToken: result.json.rememberToken || null })
  const synced = await sync()
  return synced.ok ? { ok: true, total: synced.total } : { ok: false, mensagem: synced.mensagem }
}

function logout() {
  session = { usuario: '', token: null, rememberToken: null, ultimaSync: null, erro: '' }
  fs.rmSync(sessionFile(), { force: true })
  fs.rmSync(rosterFile(), { force: true })
}

// Consulta online de uma matrícula que não está na lista baixada (ex.: incluída hoje).
async function lookupOnline(matricula) {
  if (!current().token && !current().rememberToken) return null
  const result = await request('GET', `/conecta/colaborador/${encodeURIComponent(matricula)}`, undefined, { timeoutMs: 4000 })
  const colaborador = result.ok ? result.data?.colaborador : null
  if (!colaborador) return null
  const grupo = result.data?.grupo
  return { ...colaborador, grupo: grupo?.grupo, grupo_nome: grupo?.nome, mitologia: grupo?.mitologia, staff: Boolean(colaborador.staff || grupo?.grupo === 0) }
}

function status() {
  const { usuario, token, rememberToken, ultimaSync, erro } = current()
  return {
    conectado: Boolean(token || rememberToken),
    usuario,
    ultimaSync: ultimaSync ? new Date(ultimaSync).toLocaleString('pt-BR') : null,
    erro,
  }
}

function startAutoSync() {
  if (status().conectado) sync().catch(() => {})
  setInterval(() => { if (status().conectado) sync().catch(() => {}) }, SYNC_INTERVAL_MS)
}

// Busca online por nome (pelo menos 2 letras), para quem ainda não está na lista baixada.
async function searchOnline(term) {
  if (!current().token && !current().rememberToken) return []
  const result = await request('GET', `/conecta/colaborador-busca?termo=${encodeURIComponent(term)}`, undefined, { timeoutMs: 5000 })
  return result.ok && Array.isArray(result.data?.colaboradores) ? result.data.colaboradores : []
}

module.exports = { login, logout, sync, lookupOnline, searchOnline, status, startAutoSync, rosterFile }
