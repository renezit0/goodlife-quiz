// Lista de participantes do CONECTA, para identificar a pessoa pela matrícula no início do quiz.
// Nomes e matrículas NÃO vão no código (o repositório é público): a lista é lida do computador.
//   1. Cache do app CONECTA Check-in, se estiver instalado nesta máquina
//      (%APPDATA%\Conecta Check-in\roster.json, atualizado pelo próprio check-in).
//   2. Lista importada pela engrenagem (copiada para a pasta de dados do quiz).
//   3. Equipes baixadas da API do CONECTA (conecta.cjs), com login feito pela engrenagem.
// Vale a mais recente das duas.
const fs = require('node:fs')
const path = require('node:path')
const { app } = require('electron')

const importedFile = () => path.join(app.getPath('userData'), 'colaboradores.json')
const apiFile = () => path.join(app.getPath('userData'), 'colaboradores-api.json')
const checkinFile = () => path.join(app.getPath('appData'), 'Conecta Check-in', 'roster.json')

// "000123" e "123" são a mesma matrícula.
const matriculaKey = (value) => String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')

// Planilhas salvas pelo Excel costumam vir em Windows-1252, não UTF-8.
function readText(file) {
  const buffer = fs.readFileSync(file)
  const utf8 = buffer.toString('utf8')
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(buffer) : utf8
}

const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')
const age = (value) => {
  const years = Number.parseInt(value, 10)
  return Number.isFinite(years) && years > 0 ? years : null
}

function person(raw) {
  const matricula = matriculaKey(raw.matricula ?? raw.MAT ?? raw.mat)
  const nome = clean(raw.nome ?? raw.NOME)
  if (!matricula || !nome) return null
  const staff = raw.staff === true || /staff/i.test(String(raw.TIME ?? ''))
  return {
    matricula,
    nome,
    loja: clean(raw.loja_nome ?? raw.LOJA ?? raw.loja),
    lojaNumero: clean(raw.loja_numero ?? ''),
    time: staff ? 'STAFF' : clean(raw.grupo_nome ?? raw.TIME ?? raw.time),
    // Idade em anos (só a API do CONECTA manda): o quiz pula a pergunta de idade.
    idade: age(raw.idade),
  }
}

// Aceita o roster.json do check-in ({ pessoas: { matricula: {...} } }), uma lista JSON
// ou a planilha de times em CSV separado por ; (LOJA;MAT;NOME;DIA;TIME).
function parse(text, fileName = '') {
  const content = text.replace(/^﻿/, '')
  let rows
  if (/\.csv$/i.test(fileName) || !/^\s*[[{]/.test(content)) {
    const lines = content.split(/\r?\n/).filter((line) => line.trim())
    const header = (lines.shift() || '').split(';').map((cell) => cell.trim().toUpperCase())
    rows = lines.map((line) => Object.fromEntries(line.split(';').map((cell, index) => [header[index], cell])))
  } else {
    const data = JSON.parse(content)
    rows = Array.isArray(data) ? data : Object.values(data.pessoas || data.colaboradores || {})
  }
  const people = {}
  for (const row of rows) {
    const entry = person(row)
    if (entry) people[entry.matricula] = entry
  }
  return people
}

let cache = { file: null, mtimeMs: 0, people: {} }

function currentSource() {
  const sources = [
    { file: apiFile(), origem: 'API do CONECTA' },
    { file: importedFile(), origem: 'importada' },
    { file: checkinFile(), origem: 'CONECTA Check-in' },
  ]
    .map((source) => {
      try {
        return { ...source, mtimeMs: fs.statSync(source.file).mtimeMs }
      } catch {
        return null
      }
    })
    .filter(Boolean)
  return sources.sort((a, b) => b.mtimeMs - a.mtimeMs)[0] || null
}

function load() {
  const source = currentSource()
  if (!source) {
    cache = { file: null, mtimeMs: 0, people: {} }
    return { source: null, people: {} }
  }
  if (cache.file !== source.file || cache.mtimeMs !== source.mtimeMs) {
    try {
      cache = { file: source.file, mtimeMs: source.mtimeMs, people: parse(readText(source.file), source.file) }
    } catch (error) {
      console.error('Falha ao ler a lista de participantes:', error)
      cache = { file: source.file, mtimeMs: source.mtimeMs, people: {} }
    }
  }
  return { source, people: cache.people }
}

// Idades da lista baixada da API, para completar a pessoa quando a lista mais recente é outra
// (ex.: a do CONECTA Check-in, que não tem idade).
let ageCache = { mtimeMs: 0, ages: {} }
function apiAges() {
  try {
    const { mtimeMs } = fs.statSync(apiFile())
    if (ageCache.mtimeMs !== mtimeMs) {
      const people = parse(readText(apiFile()), apiFile())
      ageCache = { mtimeMs, ages: Object.fromEntries(Object.values(people).filter((p) => p.idade).map((p) => [p.matricula, p.idade])) }
    }
  } catch {
    ageCache = { mtimeMs: 0, ages: {} }
  }
  return ageCache.ages
}

function lookup(matricula) {
  const key = matriculaKey(matricula)
  const found = load().people[key]
  if (!found) return null
  return found.idade ? found : { ...found, idade: apiAges()[key] || null }
}

function info() {
  const { source, people } = load()
  return {
    total: Object.keys(people).length,
    origem: source?.origem || null,
    atualizadaEm: source ? new Date(source.mtimeMs).toLocaleString('pt-BR') : null,
  }
}

function importFrom(filePath) {
  const people = parse(readText(filePath), filePath)
  const total = Object.keys(people).length
  if (!total) throw new Error('Nenhuma pessoa encontrada no arquivo.')
  fs.mkdirSync(path.dirname(importedFile()), { recursive: true })
  fs.writeFileSync(importedFile(), JSON.stringify(Object.values(people)))
  return info()
}

module.exports = { lookup, info, importFrom, matriculaKey, person }
