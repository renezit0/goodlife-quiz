import { useEffect, useState } from 'react'
import './SettingsPanel.css'

const PANEL_IDLE_MS = 90_000

export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

const formatSeconds = (seconds) => {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

const updateLabels = {
  verificando: 'buscando atualização…',
  atualizado: 'atualizado',
  baixando: 'baixando nova versão',
  pronto: 'nova versão pronta, instala quando as telas voltarem ao início',
  instalando: 'instalando nova versão…',
  erro: 'sem conexão com o servidor de atualização',
}
const updateLabel = ({ status, versaoNova } = {}) => {
  const label = updateLabels[status] || 'atualização automática ativa'
  return versaoNova && ['baixando', 'pronto'].includes(status) ? `${label} (${versaoNova})` : label
}

function Stepper({ value, min, max, step, format = String, onChange, label }) {
  return (
    <div className="gs-stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`Diminuir ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <output>{format(value)}</output>
      <button type="button" aria-label={`Aumentar ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  )
}

function PinPad({ title, hint, error, onSubmit, onCancel, minLength = 4 }) {
  const [pin, setPin] = useState('')
  const press = (digit) => setPin((value) => (value.length < 8 ? value + digit : value))
  const submit = () => pin.length >= minLength && onSubmit(pin, () => setPin(''))

  useEffect(() => {
    const onKey = (event) => {
      if (/^\d$/.test(event.key)) press(event.key)
      else if (event.key === 'Backspace') setPin((value) => value.slice(0, -1))
      else if (event.key === 'Enter') submit()
      else if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="gs-pin">
      <h2>{title}</h2>
      <p className={error ? 'gs-pin-error' : ''}>{error || hint}</p>
      <div className="gs-pin-dots" aria-label={`${pin.length} dígitos`}>
        {Array.from({ length: Math.max(4, pin.length) }, (_, index) => <span key={index} className={index < pin.length ? 'is-filled' : ''} />)}
      </div>
      <div className="gs-pin-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => <button key={digit} type="button" onClick={() => press(digit)}>{digit}</button>)}
        <button type="button" className="gs-pin-aux" onClick={() => setPin((value) => value.slice(0, -1))}>Apagar</button>
        <button type="button" onClick={() => press('0')}>0</button>
        <button type="button" className="gs-pin-ok" disabled={pin.length < minLength} onClick={submit}>OK</button>
      </div>
      <button type="button" className="gs-link" onClick={onCancel}>Cancelar</button>
    </div>
  )
}

export default function SettingsPanel({ config, onClose, onSaved }) {
  const api = window.goodlife
  const [mode, setMode] = useState(config.temSenha ? 'unlock' : 'form')
  const [pinError, setPinError] = useState('')
  const [draft, setDraft] = useState({
    telas: config.telas,
    telaCheia: config.telaCheia,
    inatividadeSegundos: config.inatividadeSegundos,
    escala: config.escala,
  })
  const [newPin, setNewPin] = useState(undefined) // undefined = sem mudança, '' = remover
  const [saving, setSaving] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const update = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }))
  const { limites } = config
  const layoutChanged = draft.telas !== config.telas || draft.telaCheia !== config.telaCheia
  const hasPin = newPin === undefined ? config.temSenha : Boolean(newPin)

  // Painel esquecido aberto fecha sozinho para não ficar exposto ao público.
  useEffect(() => {
    let timer
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(onClose, PANEL_IDLE_MS)
    }
    window.addEventListener('pointerdown', arm, true)
    window.addEventListener('keydown', arm, true)
    arm()
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', arm, true)
      window.removeEventListener('keydown', arm, true)
    }
  }, [onClose])

  const save = async () => {
    setSaving(true)
    try {
      const saved = await api.saveConfig({ ...draft, ...(newPin === undefined ? {} : { senha: newPin }) })
      onSaved(saved)
      if (!saved.reabrindo) onClose()
    } finally {
      setSaving(false)
    }
  }

  let content
  if (!api?.getConfig) {
    content = (
      <div className="gs-body">
        <h2>Configurações</h2>
        <p className="gs-muted">As configurações só ficam disponíveis no aplicativo GoodLife Quiz.</p>
        <div className="gs-actions"><button type="button" className="gs-primary" onClick={onClose}>Fechar</button></div>
      </div>
    )
  } else if (mode === 'unlock') {
    content = (
      <PinPad
        title="Configurações"
        hint="Digite a senha para continuar."
        error={pinError}
        onCancel={onClose}
        onSubmit={async (pin, clear) => {
          if (await api.unlockConfig(pin)) {
            setPinError('')
            setMode('form')
          } else {
            setPinError('Senha incorreta. Tente de novo.')
            clear()
          }
        }}
      />
    )
  } else if (mode === 'new-pin') {
    content = (
      <PinPad
        title="Nova senha"
        hint="Escolha de 4 a 8 números."
        onCancel={() => setMode('form')}
        onSubmit={(pin) => {
          setNewPin(pin)
          setMode('form')
        }}
      />
    )
  } else {
    content = (
      <div className="gs-body">
        <h2>Configurações</h2>

        <div className="gs-rows">
          <div className="gs-row">
            <div><strong>Telas</strong><span>{config.monitores} monitor{config.monitores > 1 ? 'es' : ''} conectado{config.monitores > 1 ? 's' : ''}</span></div>
            <Stepper label="telas" value={draft.telas} min={limites.telas[0]} max={limites.telas[1]} step={1} onChange={update('telas')} />
          </div>
          <div className="gs-row">
            <div><strong>Exibição</strong><span>{draft.telaCheia ? 'Cada tela ocupa um monitor inteiro' : 'Janelas lado a lado'}</span></div>
            <div className="gs-segmented" role="group" aria-label="Exibição">
              <button type="button" aria-pressed={draft.telaCheia} onClick={() => update('telaCheia')(true)}>Tela cheia</button>
              <button type="button" aria-pressed={!draft.telaCheia} onClick={() => update('telaCheia')(false)}>Janela</button>
            </div>
          </div>
          <div className="gs-row">
            <div><strong>Voltar ao início</strong><span>Após este tempo sem toque</span></div>
            <Stepper label="tempo de inatividade" value={draft.inatividadeSegundos} min={limites.inatividadeSegundos[0]} max={limites.inatividadeSegundos[1]} step={draft.inatividadeSegundos >= 120 ? 30 : 15} format={formatSeconds} onChange={update('inatividadeSegundos')} />
          </div>
          <div className="gs-row">
            <div><strong>Tamanho da interface</strong><span>Aumente ou reduza tudo na tela</span></div>
            <Stepper label="tamanho da interface" value={draft.escala} min={limites.escala[0]} max={limites.escala[1]} step={5} format={(value) => `${value}%`} onChange={update('escala')} />
          </div>
          <div className="gs-row">
            <div><strong>Senha</strong><span>{hasPin ? 'Pedida ao abrir as configurações' : 'Qualquer pessoa pode abrir as configurações'}</span></div>
            <div className="gs-inline-actions">
              <button type="button" className="gs-secondary" onClick={() => setMode('new-pin')}>{hasPin ? 'Trocar' : 'Definir'}</button>
              {hasPin && <button type="button" className="gs-secondary" onClick={() => setNewPin('')}>Remover</button>}
            </div>
          </div>
          <div className="gs-row">
            <div><strong>Respostas</strong><span>{config.quizzesConcluidos} quiz{config.quizzesConcluidos === 1 ? '' : 'zes'} concluído{config.quizzesConcluidos === 1 ? '' : 's'}</span><span className="gs-path" title={config.arquivoRespostas}>{config.arquivoRespostas}</span></div>
            <button type="button" className="gs-secondary" onClick={() => api.openResponses()}>Abrir pasta</button>
          </div>
        </div>

        {config.versao && <p className="gs-note">Versão {config.versao} · {updateLabel(config.atualizacao)}</p>}
        {(config.linhaDeComando.telas || config.linhaDeComando.janela) && (
          <p className="gs-note">O app foi aberto com opções de linha de comando ({[config.linhaDeComando.telas && `--telas=${config.linhaDeComando.telas}`, config.linhaDeComando.janela && '--janela'].filter(Boolean).join(' ')}), que valem no lugar de telas/exibição até ele ser reaberto.</p>
        )}
        {layoutChanged && <p className="gs-note">Ao salvar, as telas serão reabertas e quem estiver respondendo volta ao início.</p>}

        <div className="gs-actions">
          {confirmQuit ? (
            <button type="button" className="gs-danger" onClick={() => api.quit()}>Confirmar: fechar app</button>
          ) : (
            <button type="button" className="gs-link gs-quit" onClick={() => setConfirmQuit(true)}>Fechar o app</button>
          )}
          <button type="button" className="gs-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="gs-primary" disabled={saving} onClick={save}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="gs-overlay" role="dialog" aria-modal="true" aria-label="Configurações" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="gs-panel">{content}</div>
    </div>
  )
}
