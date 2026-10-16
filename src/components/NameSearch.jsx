import { useEffect, useRef, useState } from 'react'
import { mitologia, svgInsignia, temInsignia } from '../conecta/insignias'
import './NameSearch.css'

// Busca pelo nome, para quem não sabe a matrícula (abre ao digitar 1 no teclado da matrícula).
// search(term) → até 6 pessoas; onPick(pessoa) leva para o "Olá, Fulano!"; onBack volta à matrícula.
const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'apagar'],
]
const MAX_LENGTH = 40
const MIN_LETTERS = 3

const initials = (nome) => String(nome || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('')

function Icon({ name }) {
  const paths = {
    apagar: <><path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7 6-7Z" /><path d="m12 9 6 6m0-6-6 6" /></>,
    busca: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    voltar: <path d="M19 12H5m6-6-6 6 6 6" />,
    seguir: <path d="m9 6 6 6-6 6" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function NameSearch({ search, onPick, onBack, disabled }) {
  const [text, setText] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | searching | done
  const requestRef = useRef(0)
  const letters = text.replace(/\s/g, '').length

  // Procura enquanto digita (com uma pausa curta); respostas atrasadas de buscas antigas são ignoradas.
  useEffect(() => {
    if (letters < MIN_LETTERS) {
      setResults([])
      setStatus('idle')
      return undefined
    }
    const id = ++requestRef.current
    setStatus('searching')
    const timer = setTimeout(async () => {
      const found = await Promise.resolve(search?.(text)).catch(() => [])
      if (id !== requestRef.current) return
      setResults(Array.isArray(found) ? found : [])
      setStatus('done')
    }, 180)
    return () => clearTimeout(timer)
  }, [text, letters, search])

  const press = (key) => {
    if (disabled) return
    if (key === 'apagar') setText((value) => value.slice(0, -1))
    else if (key === 'espaco') setText((value) => (value && !value.endsWith(' ') && value.length < MAX_LENGTH ? `${value} ` : value))
    else setText((value) => (value.length < MAX_LENGTH ? value + key : value))
  }

  // Teclado físico também funciona: letras, espaço, Backspace e Esc para voltar.
  useEffect(() => {
    const onKey = (event) => {
      if (/^[a-zà-ú]$/i.test(event.key)) press(event.key.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase())
      else if (event.key === ' ') press('espaco')
      else if (event.key === 'Backspace') press('apagar')
      else if (event.key === 'Escape') onBack()
      else if (event.key === 'Enter' && results.length === 1) onPick(results[0])
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const message = letters < MIN_LETTERS
    ? 'Digite pelo menos 3 letras do seu nome.'
    : status === 'searching' && !results.length
      ? 'Procurando…'
      : !results.length
        ? `Ninguém encontrado com “${text.trim()}”.`
        : null

  const keyProps = (key) => ({
    type: 'button',
    disabled: disabled || (key === 'apagar' && !text),
    onPointerDown: (event) => { event.preventDefault(); press(key) },
  })

  return (
    <div className="ns">
      <div className="ns-side">
        <div className="ns-head">
          <button type="button" className="ns-back" aria-label="Voltar para a matrícula" disabled={disabled} onClick={onBack}><Icon name="voltar" /></button>
          <h1 tabIndex={-1}>Procure pelo seu nome</h1>
        </div>
        <div className="ns-field" aria-live="polite">
          <Icon name="busca" />
          {text
            ? <><span className="ns-text">{text}</span><span className="ns-caret" aria-hidden="true" /></>
            : <><span className="ns-caret" aria-hidden="true" /><span className="ns-placeholder">Nome e sobrenome</span></>}
        </div>
        <div className="ns-results" role="list">
          {message && <p className="ns-message">{message}</p>}
          {results.map((pessoa) => (
            <button key={pessoa.matricula} type="button" role="listitem" className="ns-person" disabled={disabled} onClick={() => onPick(pessoa)}>
              {temInsignia(pessoa)
                ? <span className={`ns-badge mt-insignia--${mitologia(pessoa)}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgInsignia(pessoa) }} />
                : <span className="ns-badge ns-badge--initials" aria-hidden="true">{initials(pessoa.nome)}</span>}
              <span className="ns-person-text">
                <strong>{pessoa.nome}</strong>
                <small>{[pessoa.loja, pessoa.staff ? 'STAFF' : pessoa.time && `Time ${pessoa.time}`].filter(Boolean).join(' · ')}</small>
              </span>
              <Icon name="seguir" />
            </button>
          ))}
        </div>
      </div>
      <div className="ns-keyboard" role="group" aria-label="Teclado de letras">
        {ROWS.map((row) => (
          <div className="ns-row" key={row[0]}>
            {row.map((key) => (
              <button key={key} className={`ns-key ${key === 'apagar' ? 'ns-key--fn' : ''}`} aria-label={key === 'apagar' ? 'Apagar' : key} {...keyProps(key)}>
                {key === 'apagar' ? <Icon name="apagar" /> : key}
              </button>
            ))}
          </div>
        ))}
        <div className="ns-row">
          <button className="ns-key ns-key--space" aria-label="Espaço" {...keyProps('espaco')}>espaço</button>
        </div>
      </div>
    </div>
  )
}
