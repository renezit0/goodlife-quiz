import { useCallback, useEffect, useState } from 'react'
import VitaminQuiz from './components/VitaminQuiz'
import SettingsPanel, { GearIcon, RestartIcon } from './components/SettingsPanel'
import { buildProducts, getQuizRecommendation, quizQuestions, resolveQuestions } from './quiz/recommendation'
import { faixaEtaria } from './quiz/perguntas'
import { htmlCupomQuiz } from './print/cupom'

// Cada janela do Electron é um processo próprio com o seu quiz: as telas não compartilham estado.
const screenNumber = new URLSearchParams(window.location.search).get('tela') || '1'
const products = buildProducts()
const api = window.goodlife
const reportActive = (active) => api?.setQuizActive?.(active)
const fallbackConfig = { inatividadeSegundos: 60 }

const lookupPerson = api?.lookupPerson ? (matricula) => api.lookupPerson(matricula) : undefined
const searchPerson = api?.searchPerson ? (term) => api.searchPerson(term) : undefined

// Com a idade no cadastro do CONECTA e o sexo na planilha importada, essas respostas vêm prontas
// e as perguntas de idade e de Homem/Mulher não aparecem.
const genderBySexo = { F: 'female', M: 'male' }
const fixedAnswers = (pessoa) => {
  const fixed = {}
  const age = faixaEtaria(pessoa?.idade)
  if (age) fixed.age = age
  if (genderBySexo[pessoa?.sexo]) fixed.gender = genderBySexo[pessoa.sexo]
  return fixed
}

// Estoque do evento: a quantidade da planilha (evento.js) e o saldo guardado pelo app, que vale
// para todas as telas deste computador (electron/estoque.cjs) e chega aqui a cada mudança.
const stockDefaults = Object.fromEntries(products.map((product) => [product.code, product.qtde || 0]))
let stock = { ativo: false, saldo: {}, sessoes: {} }
const stockOf = (code, snapshot = stock) => snapshot.saldo?.[code] ?? stockDefaults[code] ?? 0

// Sem estoque = saldo zero, menos o produto que esta mesma sessão já levou ("Revisar respostas").
const recommend = (list, answers, sessionId) => {
  const mine = stock.sessoes?.[sessionId]
  const indisponiveis = new Set(stock.ativo ? list.filter((p) => p.code !== mine && stockOf(p.code) <= 0).map((p) => p.code) : [])
  return getQuizRecommendation(list, answers, { indisponiveis })
}

// Grava a resposta, baixa 1 unidade da sugestão principal e imprime o cupom (sugestão + 2).
// Devolve o resultado da impressão.
const finishQuiz = (answers, sessionId, pessoa, result) => {
  if (stock.ativo && result.product && api?.takeStock) {
    api.takeStock({ sessionId, code: result.product.code, defaults: stockDefaults })
      .then((snapshot) => { stock = snapshot })
      .catch((error) => console.error('Falha ao baixar o estoque:', error))
  }
  api?.saveResponse({
    screen: screenNumber,
    sessionId,
    pessoa: pessoa || {},
    answers,
    ageSource: fixedAnswers(pessoa).age ? 'matricula' : answers.age ? 'resposta' : '',
    genderSource: fixedAnswers(pessoa).gender ? 'planilha' : answers.gender ? 'resposta' : '',
    profileId: result.profileId,
    productName: result.product?.name,
    alternatives: result.alternatives.map((product) => product.name),
  }).catch((error) => console.error('Falha ao gravar resposta:', error))
  if (!api?.printReceipt) return undefined
  const html = htmlCupomQuiz({ pessoa, result, answers, questions: resolveQuestions(answers), screen: screenNumber, sessionId })
  return api.printReceipt(html).catch((error) => ({ ok: false, erro: error.message }))
}

// Cupom de exemplo para o botão "Imprimir teste" da engrenagem.
const testPrint = () => {
  const answers = {}
  for (const question of resolveQuestions(answers)) answers[question.id] = question.options[0].id
  const result = getQuizRecommendation(products, answers)
  const pessoa = { matricula: '0000', nome: 'TESTE DE IMPRESSAO', loja: 'GOODLIFE', time: 'Teste' }
  return api.printReceipt(htmlCupomQuiz({ pessoa, result, answers, questions: resolveQuestions(answers), screen: screenNumber, sessionId: 'teste' }))
    .catch((error) => ({ ok: false, erro: error.message }))
}

export default function App() {
  const [config, setConfig] = useState(fallbackConfig)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Trocar a key remonta o quiz do zero: volta para a tela inicial desta tela.
  const [quizKey, setQuizKey] = useState(0)
  const [stockState, setStockState] = useState(stock)

  useEffect(() => {
    if (!api?.getStock) return undefined
    const apply = (snapshot) => {
      stock = snapshot
      setStockState(snapshot)
    }
    api.getStock().then(apply).catch(() => {})
    return api.onStockChanged(apply)
  }, [])

  useEffect(() => {
    if (!api?.getConfig) return undefined
    api.getConfig().then(setConfig)
    return api.onConfigChanged(setConfig)
  }, [])

  // Busca a configuração atualizada (contagem de respostas, monitores) a cada abertura.
  const openSettings = async () => {
    if (api?.getConfig) setConfig(await api.getConfig())
    setSettingsOpen(true)
  }
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  return (
    <>
      <VitaminQuiz
        key={quizKey}
        questions={quizQuestions}
        resolveQuestions={resolveQuestions}
        products={products}
        recommend={recommend}
        onComplete={finishQuiz}
        lookupPerson={lookupPerson}
        searchPerson={searchPerson}
        fixedAnswers={fixedAnswers}
        onActiveChange={reportActive}
        idleResetMs={config.inatividadeSegundos * 1000}
      />
      <button type="button" className="gs-gear gs-restart" aria-label="Reiniciar" onClick={() => setQuizKey((key) => key + 1)}><RestartIcon /></button>
      <button type="button" className="gs-gear" aria-label="Configurações" onClick={openSettings}><GearIcon /></button>
      {settingsOpen && <SettingsPanel config={config} onClose={closeSettings} onSaved={setConfig} onTestPrint={testPrint} products={products} stock={stockState} stockOf={stockOf} />}
    </>
  )
}
