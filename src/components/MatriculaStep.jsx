import { useEffect, useState } from 'react'
import { mitologia, nomeMitologia, svgInsignia, temInsignia } from '../conecta/insignias'
import NameSearch from './NameSearch'
import './MatriculaStep.css'

const MAX_DIGITS = 8
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'apagar', '0', 'ok']

const firstName = (nome) => {
  const first = String(nome || '').trim().split(/\s+/)[0] || ''
  return first.charAt(0) + first.slice(1).toLowerCase()
}

function KeyIcon({ name }) {
  const paths = {
    apagar: <><path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7 6-7Z" /><path d="m12 9 6 6m0-6-6 6" /></>,
    ok: <path d="M5 12h14m-6-6 6 6-6 6" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

// Identificação do participante do CONECTA antes das perguntas.
// lookup(matricula) → pessoa da lista ou null. onDone({ matricula, nome, loja, time } | null).
// search(nome) → pessoas: quem não sabe a matrícula digita 1 e procura pelo nome.
const MATRICULA_BUSCA = '1'

export default function MatriculaStep({ lookup, search, onDone, disabled }) {
  const [digits, setDigits] = useState('')
  const [state, setState] = useState('typing') // typing | searching | found | missing | name
  const [person, setPerson] = useState(null)
  const [shake, setShake] = useState(0)

  const press = (key) => {
    if (disabled || state === 'searching') return
    if (key === 'apagar') {
      setDigits((value) => value.slice(0, -1))
      setState('typing')
    } else if (key === 'ok') {
      confirm()
    } else if (digits.length < MAX_DIGITS) {
      setDigits((value) => (state === 'missing' ? key : value + key))
      setState('typing')
    }
  }

  const confirm = async () => {
    if (!digits) return
    if (digits === MATRICULA_BUSCA && search) {
      setDigits('')
      setState('name')
      return
    }
    setState('searching')
    const found = await Promise.resolve(lookup?.(digits)).catch(() => null)
    if (found) {
      setPerson(found)
      setState('found')
    } else {
      setState('missing')
      setShake((value) => value + 1)
    }
  }

  // Teclado físico (USB) também funciona: números, Backspace e Enter.
  useEffect(() => {
    const onKey = (event) => {
      if (state === 'found' || state === 'name') return
      if (/^\d$/.test(event.key)) press(event.key)
      else if (event.key === 'Backspace') press('apagar')
      else if (event.key === 'Enter') press('ok')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (state === 'name') {
    return (
      <NameSearch
        search={search}
        disabled={disabled}
        onBack={() => setState('typing')}
        onPick={(found) => { setPerson(found); setDigits(found.matricula); setState('found') }}
      />
    )
  }

  if (state === 'found' && person) {
    return (
      <div className="mt mt--found">
        <span className="vq-eyebrow">PARTICIPANTE CONECTA 2026</span>
        {/* Insígnia do deus do time, na cor da mitologia (como no CONECTA Check-in); sem time, a inicial. */}
        {temInsignia(person)
          ? <div className={`mt-avatar mt-insignia mt-insignia--${mitologia(person)}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgInsignia(person, { strokeWidth: 1.8 }) }} />
          : <div className="mt-avatar" aria-hidden="true">{firstName(person.nome).charAt(0)}</div>}
        <h1 tabIndex={-1}>Olá, {firstName(person.nome)}!</h1>
        <p className="mt-person">{person.nome}</p>
        <div className="mt-tags">
          <span>Matrícula {person.matricula}</span>
          {person.loja && <span>{person.loja}</span>}
          {person.time && (
            <span className={temInsignia(person) ? `mt-tag-time mt-insignia--${mitologia(person)}` : ''}>
              {temInsignia(person) && <i aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgInsignia(person) }} />}
              {person.staff ? 'STAFF' : `Time ${person.time}`}{!person.staff && mitologia(person) ? ` · ${nomeMitologia[mitologia(person)]}` : ''}
            </span>
          )}
        </div>
        <div className="mt-actions">
          <button type="button" className="vq-primary" disabled={disabled} onClick={() => onDone(person)}>Sou eu, começar<KeyIcon name="ok" /></button>
          <button type="button" className="vq-text-button" disabled={disabled} onClick={() => { setDigits(''); setPerson(null); setState('typing') }}>Não sou eu</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt">
      <div className="mt-intro">
        <h1 tabIndex={-1}>Qual é a sua matrícula?</h1>
        <div key={shake} className={`mt-display ${state === 'missing' ? 'is-error' : ''} ${shake ? 'mt-shake' : ''}`} aria-live="polite">
          {digits ? <span className="mt-digits">{digits}</span> : <span className="mt-placeholder">Digite no teclado</span>}
          {state !== 'missing' && <span className="mt-caret" aria-hidden="true" />}
        </div>
        <p className={`mt-message ${state === 'missing' ? 'is-error' : ''}`}>
          {state === 'missing' ? `Não encontramos a matrícula ${digits}.` : state === 'searching' ? 'Procurando…' : 'É o número do seu crachá do CONECTA.'}
        </p>
        {search && <p className="mt-hint">Não sabe? Digite <b>1</b> e procure pelo nome.</p>}
        {state === 'missing' && (
          <button type="button" className="vq-text-button mt-skip" disabled={disabled} onClick={() => onDone({ matricula: digits, nome: '', loja: '', time: '' })}>Continuar assim mesmo</button>
        )}
      </div>
      <div className="mt-pad" role="group" aria-label="Teclado numérico">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`mt-key ${key === 'ok' ? 'mt-key--ok' : ''} ${key === 'apagar' ? 'mt-key--fn' : ''}`}
            aria-label={key === 'apagar' ? 'Apagar' : key === 'ok' ? 'Confirmar' : key}
            disabled={disabled || (key === 'ok' && !digits) || (key === 'apagar' && !digits)}
            onPointerDown={(event) => { event.preventDefault(); press(key) }}
          >
            {key === 'apagar' || key === 'ok' ? <KeyIcon name={key} /> : key}
          </button>
        ))}
      </div>
    </div>
  )
}
