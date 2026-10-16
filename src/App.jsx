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

// Com a idade no cadastro do CONECTA, a faixa vem pronta e a pergunta de idade não aparece.
const fixedAnswers = (pessoa) => {
  const age = faixaEtaria(pessoa?.idade)
  return age ? { age } : {}
}

// Grava a resposta e imprime o cupom (sugestão principal + 2). Devolve o resultado da impressão.
const finishQuiz = (answers, sessionId, pessoa) => {
  const result = getQuizRecommendation(products, answers)
  api?.saveResponse({
    screen: screenNumber,
    sessionId,
    pessoa: pessoa || {},
    answers,
    ageSource: fixedAnswers(pessoa).age ? 'matricula' : answers.age ? 'resposta' : '',
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
        recommend={getQuizRecommendation}
        onComplete={finishQuiz}
        lookupPerson={lookupPerson}
        fixedAnswers={fixedAnswers}
        onActiveChange={reportActive}
        idleResetMs={config.inatividadeSegundos * 1000}
      />
      <button type="button" className="gs-gear gs-restart" aria-label="Reiniciar" onClick={() => setQuizKey((key) => key + 1)}><RestartIcon /></button>
      <button type="button" className="gs-gear" aria-label="Configurações" onClick={openSettings}><GearIcon /></button>
      {settingsOpen && <SettingsPanel config={config} onClose={closeSettings} onSaved={setConfig} onTestPrint={testPrint} />}
    </>
  )
}
