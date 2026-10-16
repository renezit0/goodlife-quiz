// Sexo dos participantes, importado pela engrenagem de uma planilha (Excel ou CSV) com uma coluna
// de matrícula e uma de sexo. O cadastro da API do CONECTA não tem esse dado. Fica só neste
// computador, como a lista de participantes: o repositório e os instaladores são públicos.
// Com o sexo, o quiz não pergunta "Homem ou mulher?".
const fs = require('node:fs')
const path = require('node:path')
const { app } = require('electron')
const readXlsxFile = require('read-excel-file/node')

const file = () => path.join(app.getPath('userData'), 'sexo.json')

// "000123" e "123" são a mesma matrícula (como em roster.cjs).
const matriculaKey = (value) => String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')

const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase()
const sexoOf = (value) => {
  const text = normalize(value)
  if (['F', 'FEM', 'FEMININO', 'MULHER'].includes(text)) return 'F'
  if (['M', 'MASC', 'MASCULINO', 'HOMEM'].includes(text)) return 'M'
  return null
}

// Planilhas salvas pelo Excel costumam vir em Windows-1252, não UTF-8.
function readCsv(filePath) {
  const buffer = fs.readFileSync(filePath)
  const utf8 = buffer.toString('utf8')
  const text = (utf8.includes('�') ? new TextDecoder('windows-1252').decode(buffer) : utf8).replace(/^﻿/, '')
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const separator = (lines[0] || '').includes(';') ? ';' : ','
  return lines.map((line) => line.split(separator))
}

// Acha a linha de cabeçalho (a primeira com "MAT..." e "SEXO"/"GÊNERO") e lê as linhas de baixo.
function parse(rows) {
  const headerIndex = rows.findIndex((row) => row.some((cell) => /^MAT/.test(normalize(cell))) && row.some((cell) => /^(SEXO|GENERO)/.test(normalize(cell))))
  if (headerIndex < 0) throw new Error('A planilha precisa de uma coluna de matrícula (MAT) e uma de sexo.')
  const header = rows[headerIndex].map(normalize)
  const matCol = header.findIndex((cell) => /^MAT/.test(cell))
  const sexoCol = header.findIndex((cell) => /^(SEXO|GENERO)/.test(cell))
  const sexo = {}
  for (const row of rows.slice(headerIndex + 1)) {
    const matricula = matriculaKey(row[matCol])
    const value = sexoOf(row[sexoCol])
    if (matricula && value) sexo[matricula] = value
  }
  return sexo
}

let cache = null
function load() {
  if (cache) return cache
  try {
    cache = JSON.parse(fs.readFileSync(file(), 'utf8'))
  } catch {
    cache = { sexo: {}, atualizado_em: null }
  }
  return cache
}

async function importFrom(filePath) {
  const rows = /\.(xlsx|xlsm)$/i.test(filePath) ? await readXlsxFile(filePath) : readCsv(filePath)
  const sexo = parse(rows)
  if (!Object.keys(sexo).length) throw new Error('Nenhuma matrícula com sexo (F ou M) encontrada na planilha.')
  cache = { atualizado_em: new Date().toISOString(), sexo }
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify(cache))
  return info()
}

function remove() {
  cache = { sexo: {}, atualizado_em: null }
  fs.rmSync(file(), { force: true })
  return info()
}

const of = (matricula) => load().sexo[matriculaKey(matricula)] || null

function info() {
  const { sexo, atualizado_em: atualizadoEm } = load()
  return { total: Object.keys(sexo).length, atualizadaEm: atualizadoEm ? new Date(atualizadoEm).toLocaleString('pt-BR') : null }
}

module.exports = { importFrom, remove, of, info, parse }
