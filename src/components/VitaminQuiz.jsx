import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import callfarmaLogo from '../assets/callfarma-logo.png'
import goodlifeLogo from '../assets/logo-good-fim.png'
import MatriculaStep from './MatriculaStep'
import './VitaminQuiz.css'

// Se a janela parar de desenhar (coberta, minimizada), a animação não avança sozinha;
// o watchdog conclui a animação para o quiz nunca ficar travado esperando por ela.
function finishWithin(animation, ms) {
  const timer = setTimeout(() => {
    if (animation.playState === 'running' || animation.playState === 'paused') animation.finish()
  }, ms)
  const clear = () => clearTimeout(timer)
  animation.finished.then(clear, clear)
}

function Icon({ name, className = '' }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    heart: <path d="M20 9c0 5-8 10-8 10S4 14 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    user: <><circle cx="12" cy="8" r="3" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></>,
    spark: <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />,
    activity: <path d="M2 12h4l3-8 6 16 3-8h4" />,
    leaf: <><path d="M5 16C3 8 11 4 20 4c0 9-4 17-12 15" /><path d="m4 21 11-11" /></>,
    moon: <path d="M20.5 13A9 9 0 0 1 11 3.5 9 9 0 1 0 20.5 13Z" />,
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
    shield: <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    reset: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></>,
    none: <><circle cx="12" cy="12" r="8" /><path d="m6.5 17.5 11-11" /></>,
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.spark}</svg>
}

// lookupPerson: quando informado, o quiz começa pedindo a matrícula do participante.
// recommend(products, answers, sessionId) dá o resultado; onComplete(answers, sessionId, pessoa, result)
// pode devolver uma promessa { ok } da impressão do cupom.
// fixedAnswers(pessoa): respostas que já vêm do cadastro (a idade, pela matrícula); a pergunta
// delas não aparece.
export default function VitaminQuiz({ questions: questionList, resolveQuestions, products, recommend, onComplete, onActiveChange, lookupPerson, searchPerson, fixedAnswers, idleResetMs = 0 }) {
  const [started, setStarted] = useState(false)
  const [pessoa, setPessoa] = useState(null)
  const [printState, setPrintState] = useState(null) // null | printing | done | failed
  const askMatricula = Boolean(lookupPerson) && started && !pessoa
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [pending, setPending] = useState(null)
  const stageRef = useRef(null)
  const [transitioning, setTransitioning] = useState(false)
  const animationRef = useRef(null)
  const transitionIdRef = useRef(0)
  const entranceRef = useRef(null)
  const lockedRef = useRef(false)
  // Identifica cada rodada do quiz; "Revisar respostas" mantém a mesma sessão.
  const sessionRef = useRef(null)
  const newSession = () => { sessionRef.current = crypto.randomUUID().slice(0, 8) }
  const fixed = useMemo(() => fixedAnswers?.(pessoa) || {}, [fixedAnswers, pessoa])
  // Perguntas adaptativas: as opções de uma pergunta podem depender de uma resposta anterior.
  const resolve = (given) => (resolveQuestions ? resolveQuestions({ ...given, ...fixed }, questionList, fixed) : questionList)
  const questions = useMemo(() => resolve(answers), [answers, fixed, questionList, resolveQuestions]) // eslint-disable-line react-hooks/exhaustive-deps
  const complete = step >= questions.length
  const question = questions[step]
  const meta = question
  // Calculado uma vez, ao terminar: o estoque pode mudar (outra tela) enquanto a pessoa lê o resultado.
  const [result, setResult] = useState(null)
  const answeredCount = step
  const progress = Math.round(answeredCount / questions.length * 100)

  useEffect(() => {
    const oldTitle = document.title
    const oldBackground = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#0b679c'
    const theme = document.querySelector('meta[name="theme-color"]')
    const oldTheme = theme?.content
    document.title = 'Sua vitamina, seu momento | GoodLife'
    if (theme) theme.content = '#0b679c'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => {
      document.title = oldTitle
      document.body.style.backgroundColor = oldBackground
      if (theme) theme.content = oldTheme
      transitionIdRef.current += 1
      animationRef.current?.cancel()
    }
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    if (started) stage.querySelector('h1')?.focus({ preventScroll: true })
    const direction = entranceRef.current
    if (direction === null) return undefined
    entranceRef.current = null
    const animation = stage.animate([
      { opacity: 0, transform: `translateY(${direction * 10}px)` },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 260, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'both' })
    animationRef.current = animation
    finishWithin(animation, 1000)
    animation.finished.then(() => {
      animation.cancel()
      lockedRef.current = false
      setTransitioning(false)
    }).catch(() => {})
    return () => animation.cancel()
  }, [started, step, pessoa])

  // A single owner coordinates exit -> state update -> entrance. Only user actions start motion.
  const transitionTo = (commit, direction = 1, selectedId = null) => {
    if (lockedRef.current) return
    lockedRef.current = true
    setTransitioning(true)
    setPending(selectedId)
    const id = ++transitionIdRef.current
    const stage = stageRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !stage?.animate) {
      commit()
      setPending(null)
      setTransitioning(false)
      lockedRef.current = false
      return
    }
    const animation = stage.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: `translateY(${-direction * 8}px)` },
    ], { duration: 150, delay: selectedId ? 130 : 0, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' })
    animationRef.current = animation
    finishWithin(animation, 1000)
    animation.finished.then(() => {
      if (id !== transitionIdRef.current) return
      // Keep the outgoing scene hidden until React commits the next scene and
      // its layout effect installs the entrance animation, all before painting.
      flushSync(() => {
        entranceRef.current = direction
        commit()
        setPending(null)
      })
      animation.cancel()
    }).catch(() => {})
  }

  const choose = (optionId) => transitionTo(() => {
    const nextAnswers = {
      ...Object.fromEntries(questions.slice(0, step).filter((item) => answers[item.id]).map((item) => [item.id, answers[item.id]])),
      [question.id]: optionId,
    }
    setAnswers(nextAnswers)
    setStep((value) => value + 1)
    // A resposta pode tirar perguntas seguintes (ex.: objetivo sono pula a do sono): conta de novo.
    if (step + 1 >= resolve(nextAnswers).length) {
      const finalAnswers = { ...nextAnswers, ...fixed }
      const finalResult = recommend(products, finalAnswers, sessionRef.current)
      setResult(finalResult)
      const printing = onComplete?.(finalAnswers, sessionRef.current, pessoa, finalResult)
      if (printing?.then) {
        setPrintState('printing')
        printing.then((result) => setPrintState(result?.ok ? 'done' : result?.desligado ? null : 'failed'))
      }
    }
  }, 1, optionId)

  const goBack = () => transitionTo(() => {
    if (askMatricula) setStarted(false)
    else if (step === 0 && lookupPerson) setPessoa(null)
    else if (step === 0) setStarted(false)
    else setStep((value) => Math.max(0, value - 1))
  }, -1)

  // "Fazer nova pesquisa" e "Recomeçar": reinício completo, de volta à tela inicial.
  const reset = () => transitionTo(() => {
    setStarted(false)
    setPessoa(null)
    setPrintState(null)
    setResult(null)
    setStep(0)
    setAnswers({})
  }, -1)

  // Avisa quando alguém está respondendo (fora da tela inicial).
  useEffect(() => { onActiveChange?.(started) }, [started, onActiveChange])

  // Totem: se a pessoa sair no meio ou deixar o resultado na tela, volta para o início.
  useEffect(() => {
    if (!started || !idleResetMs) return undefined
    let timer
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => transitionTo(() => {
        setStarted(false)
        setPessoa(null)
        setPrintState(null)
        setResult(null)
        setStep(0)
        setAnswers({})
      }, -1), idleResetMs)
    }
    const events = ['pointerdown', 'keydown', 'wheel']
    events.forEach((name) => window.addEventListener(name, arm, { passive: true }))
    arm()
    return () => {
      clearTimeout(timer)
      events.forEach((name) => window.removeEventListener(name, arm))
    }
  }, [started, idleResetMs]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className={`vq ${started ? 'vq--started' : ''} ${complete ? 'vq--complete' : ''}`} id="descobrir">
      <header className="vq-header">
        <div className="vq-brands">
          <img className="vq-partner" src={callfarmaLogo} alt="CallFarma Farmácias" />
          <span className="vq-brand-divider" aria-hidden="true" />
          <div className="vq-logo"><img src={goodlifeLogo} alt="GoodLife Vida Saudável" /></div>
        </div>
      </header>

      <div className={`vq-layout ${started ? 'vq-layout--active' : ''}`}>
        <section className="vq-workspace" aria-label="Questionário de vitaminas">
          <div className="vq-progress-header"><span>{complete ? 'Seu resultado' : askMatricula ? 'Identificação' : started ? 'Vamos conhecer você' : 'Descubra sua vitamina'}</span><span>{askMatricula ? 'CONECTA 2026' : complete ? 'Pronto' : started ? `Pergunta ${step + 1}` : <><Icon name="clock" /> Cerca de 1 minuto</>}</span></div>
          <div className="vq-progress" role="progressbar" aria-label="Perguntas respondidas" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount} aria-valuetext={`${answeredCount} de ${questions.length} perguntas respondidas`}>
            {questions.map((item, index) => <span key={item.id} className={`${index < step ? 'is-complete' : ''} ${started && !askMatricula && index === step ? 'is-active' : ''}`} />)}
          </div>

          <div className="vq-stage" ref={stageRef} aria-busy={transitioning}>
            {!started ? (
              <div className="vq-welcome" key="welcome">
                <div className="vq-welcome-benefits" aria-hidden="true">
                  <span className="vq-welcome-benefit vq-welcome-benefit--one"><Icon name="bolt" />Mais energia</span>
                  <span className="vq-welcome-benefit vq-welcome-benefit--two"><Icon name="shield" />Imunidade</span>
                  <span className="vq-welcome-benefit vq-welcome-benefit--three"><Icon name="moon" />Sono de qualidade</span>
                  <span className="vq-welcome-benefit vq-welcome-benefit--four"><Icon name="heart" />Bem-estar diário</span>
                </div>
                <span className="vq-eyebrow">UM MINUTO PARA OLHAR PARA VOCÊ</span>
                <h1>Descubra sua<br />vitamina ideal.</h1>
                <p className="vq-intro-copy">Conte um pouco sobre você e descubra uma sugestão GoodLife que faz sentido para a sua rotina.</p>
                <span className="vq-start-pulse" aria-hidden="true" />
                <button className="vq-primary vq-primary--start" type="button" disabled={transitioning} onClick={() => transitionTo(() => { newSession(); setStarted(true) })}>INICIAR JÁ</button>
                <p className="vq-start-note">No seu ritmo. Uma pergunta de cada vez.</p>
              </div>
            ) : askMatricula ? (
              <MatriculaStep key="matricula" lookup={lookupPerson} search={searchPerson} disabled={transitioning} onDone={(found) => transitionTo(() => setPessoa(found))} />
            ) : !complete ? (
              <div className="vq-question" key={question.id}>
                <div className="vq-question-label"><span className="vq-section-icon"><Icon name={meta.icon} /></span><span className="vq-eyebrow">{meta.label}</span></div>
                <h1 tabIndex={-1}>{meta.title}</h1>
                <p className="vq-question-hint">{meta.hint}</p>
                <div className="vq-options" style={{ '--option-count': question.options.length }} role="group" aria-label={meta.title}>
                  {question.options.map((option) => <button
                    key={option.id}
                    type="button"
                    className={`vq-option ${pending === option.id ? 'is-selected' : ''} ${answers[question.id] === option.id && !pending ? 'was-selected' : ''}`}
                    aria-pressed={(pending || answers[question.id]) === option.id}
                    disabled={transitioning}
                    onClick={() => choose(option.id)}
                   
                  >
                    <span className="vq-option-icon"><Icon name={option.icon} /></span>
                    <span className="vq-option-copy"><strong>{option.label}</strong></span>
                    <span className="vq-option-radio"><Icon name="check" /></span>
                  </button>)}
                </div>
                <p className="vq-selection-note">Selecione uma opção para continuar.</p>
                <span className="sr-only" role="status">{pending ? 'Resposta registrada.' : ''}</span>
              </div>
            ) : (
              <div className="vq-result" key="result">
                <div className="vq-question-label"><span className="vq-section-icon"><Icon name="check" /></span><span className="vq-eyebrow">SUAS RESPOSTAS, SEU RESULTADO</span></div>
                <h1 tabIndex={-1}>{pessoa?.nome ? `${pessoa.nome.split(' ')[0].charAt(0)}${pessoa.nome.split(' ')[0].slice(1).toLowerCase()}, esta é a sua sugestão.` : 'Sua sugestão GoodLife.'}</h1>
                {result?.product ? <>
                  <p className="vq-question-hint">Com base nas suas respostas, conheça esta opção da linha GoodLife.</p>
                  <article className="vq-recommendation">
                    <div className="vq-result-image"><img src={result.product.image} alt={result.product.name} width="300" height="300" /><span>SUA SUGESTÃO GOODLIFE</span></div>
                    <div className="vq-result-info"><span className="vq-eyebrow">{result.product.line}</span><h2>{(result.product.officialName || result.product.name).replace(/^GOODLIFE\s+/i, '').toUpperCase()}</h2><p>{result.profile?.summary || result.product.description}</p><ul>{result.product.highlights.map((item) => <li key={item}><Icon name="check" />{item}</li>)}</ul></div>
                  </article>
                  <div className="vq-result-actions"><button className="vq-primary" type="button" disabled={transitioning} onClick={reset}>Fazer nova pesquisa<Icon name="reset" /></button>{printState && <p className={`vq-print vq-print--${printState}`} role="status"><Icon name={printState === 'failed' ? 'shield' : 'check'} />{printState === 'printing' ? 'Imprimindo seu cupom com mais 2 sugestões…' : printState === 'done' ? 'Pronto! Retire seu cupom na impressora.' : 'Não foi possível imprimir. Chame alguém da equipe.'}</p>}</div>
                </> : <><p className="vq-question-hint">Não encontramos um produto disponível para apresentar agora. Você pode iniciar uma nova pesquisa.</p><button className="vq-primary" type="button" disabled={transitioning} onClick={reset}>Fazer nova pesquisa<Icon name="reset" /></button></>}
              </div>
            )}
          </div>

          <footer className="vq-workspace-footer">
            {started ? <div className="vq-navigation">{!complete && <button type="button" className="vq-text-button" disabled={transitioning} onClick={goBack}><Icon name="back" />Voltar</button>}<span>{complete ? 'Concluído' : `${progress}% concluído`}</span>{!complete && step > 0 && <button className="vq-text-button vq-restart" type="button" disabled={transitioning} onClick={reset}>Recomeçar</button>}</div> : null}
            <p className="vq-disclaimer">Sugestão informativa. Consulte um profissional de saúde.</p>
          </footer>
        </section>
      </div>
      <footer className="vq-footer"><span>GoodLife · Vida Saudável</span></footer>
    </main>
  )
}
