import { useEffect, useRef, useState } from 'react'
import './SettingsPanel.css'

const PANEL_IDLE_MS = 90_000

export function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />
    </svg>
  )
}

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

const shortProductName = (product) => (product.officialName || product.name || '').replace(/^GOODLIFE\s+/i, '')

// Estoque das vitaminas: liga/desliga o controle e corrige a quantidade de cada produto.
function StockEditor({ products, stock, stockOf, onCancel, onSave }) {
  const [ativo, setAtivo] = useState(stock.ativo)
  const [saldo, setSaldo] = useState(() => Object.fromEntries(products.map((p) => [p.code, stockOf(p.code, stock)])))
  const [resetar, setResetar] = useState(false)
  const [saving, setSaving] = useState(false)
  const total = Object.values(saldo).reduce((sum, value) => sum + value, 0)
  const backToSheet = () => {
    setSaldo(Object.fromEntries(products.map((p) => [p.code, p.qtde || 0])))
    setResetar(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      await onSave({ ativo, saldo: resetar ? null : saldo })
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="gs-body">
      <h2>Estoque das vitaminas</h2>
      <p className="gs-muted">Cada quiz concluído baixa 1 unidade da sugestão principal. Quando um produto acaba, o quiz sugere o próximo que combina com a pessoa.</p>
      <div className="gs-rows">
        <div className="gs-row">
          <div><strong>Controlar estoque</strong><span>{ativo ? `${total} unidades no total` : 'Desligado: sugere qualquer produto e não baixa nada'}</span></div>
          <div className="gs-segmented" role="group" aria-label="Controlar estoque">
            <button type="button" aria-pressed={ativo} onClick={() => setAtivo(true)}>Ligado</button>
            <button type="button" aria-pressed={!ativo} onClick={() => setAtivo(false)}>Desligado</button>
          </div>
        </div>
        {products.map((product) => (
          <div className="gs-row" key={product.code}>
            <div><strong>{shortProductName(product)}</strong><span>Cód. {product.code} · planilha: {product.qtde || 0}{saldo[product.code] === 0 ? ' · esgotado' : ''}</span></div>
            <Stepper label={`estoque de ${shortProductName(product)}`} value={saldo[product.code]} min={0} max={999} step={1} onChange={(value) => { setResetar(false); setSaldo((current) => ({ ...current, [product.code]: value })) }} />
          </div>
        ))}
      </div>
      <div className="gs-actions">
        <button type="button" className="gs-link gs-quit" onClick={backToSheet}>Voltar às quantidades da planilha</button>
        <button type="button" className="gs-secondary" onClick={onCancel}>Cancelar</button>
        <button type="button" className="gs-primary" disabled={saving} onClick={save}>{saving ? 'Salvando…' : 'Salvar estoque'}</button>
      </div>
    </div>
  )
}

export default function SettingsPanel({ config, onClose, onSaved, onTestPrint, products = [], stock, stockOf }) {
  const api = window.goodlife
  const [mode, setMode] = useState(config.temSenha ? 'unlock' : 'form')
  const [pinError, setPinError] = useState('')
  const [draft, setDraft] = useState({
    telas: config.telas,
    telaCheia: config.telaCheia,
    inatividadeSegundos: config.inatividadeSegundos,
    escala: config.escala,
    imprimir: config.imprimir,
    impressoras: config.impressoras || {},
  })
  const [printers, setPrinters] = useState([])
  const [participantes, setParticipantes] = useState(config.participantes)
  const [rosterMessage, setRosterMessage] = useState('')
  const [sexoInfo, setSexoInfo] = useState(config.sexo || { total: 0 })
  const [sexoMessage, setSexoMessage] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [conecta, setConecta] = useState(config.conecta || { conectado: false })
  const [conectaMessage, setConectaMessage] = useState('')
  const [login, setLogin] = useState({ usuario: '', senha: '', enviando: false, erro: '' })
  const [newPin, setNewPin] = useState(undefined) // undefined = sem mudança, '' = remover
  const [saving, setSaving] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const panelRef = useRef(null)
  // Cada tela do painel (formulário, estoque, senha...) começa do topo.
  useEffect(() => { panelRef.current?.scrollTo({ top: 0 }) }, [mode])
  const update = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }))
  const { limites } = config
  const layoutChanged = draft.telas !== config.telas || draft.telaCheia !== config.telaCheia
  const hasPin = newPin === undefined ? config.temSenha : Boolean(newPin)

  useEffect(() => {
    api?.listPrinters?.().then(setPrinters).catch(() => setPrinters([]))
  }, [api])

  const importRoster = async () => {
    setRosterMessage('')
    const info = await api.importRoster()
    setParticipantes(info)
    if (info.erro) setRosterMessage(info.erro)
    else if (!info.cancelado) setRosterMessage(`Lista importada: ${info.total} pessoas.`)
  }

  const importSexo = async () => {
    setSexoMessage('')
    const info = await api.importSexo()
    setSexoInfo(info)
    if (info.erro) setSexoMessage(info.erro)
    else if (!info.cancelado) setSexoMessage(`Planilha importada: ${info.total} pessoas com sexo.`)
  }

  const removeSexo = async () => {
    setSexoInfo(await api.removeSexo())
    setSexoMessage('Planilha removida: o quiz volta a perguntar Homem ou Mulher.')
  }

  const refreshRoster = async () => {
    setParticipantes(await api.rosterInfo())
    setConecta(await api.conectaStatus())
  }

  const conectaLogin = async (event) => {
    event.preventDefault()
    setLogin((current) => ({ ...current, enviando: true, erro: '' }))
    const result = await api.conectaLogin(login.usuario, login.senha)
    if (result.ok) {
      setLogin({ usuario: '', senha: '', enviando: false, erro: '' })
      setConectaMessage(`Lista baixada: ${result.total} pessoas.`)
      setMode('form')
    } else {
      setLogin((current) => ({ ...current, senha: '', enviando: false, erro: result.mensagem }))
    }
    await refreshRoster()
  }

  const conectaSync = async () => {
    setConectaMessage('Baixando…')
    const result = await api.conectaSync()
    setConectaMessage(result.ok ? `Lista atualizada: ${result.total} pessoas.` : result.mensagem)
    await refreshRoster()
  }

  const conectaLogout = async () => {
    setConecta(await api.conectaLogout())
    setConectaMessage('')
    setParticipantes(await api.rosterInfo())
  }

  const testPrint = async () => {
    setTestMessage('Imprimindo…')
    const result = await onTestPrint?.()
    setTestMessage(result?.ok ? 'Cupom de teste enviado.' : result?.desligado ? 'Ligue a impressão e salve antes de testar.' : `Falhou: ${result?.erro || 'impressora indisponível'}`)
  }

  const setPrinter = (tela) => (event) => setDraft((current) => ({ ...current, impressoras: { ...current.impressoras, [tela]: event.target.value } }))

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
  } else if (mode === 'conecta-login') {
    content = (
      <form className="gs-body gs-login" onSubmit={conectaLogin}>
        <h2>Entrar no CONECTA</h2>
        <p className="gs-muted">Use uma conta de admin, RH ou marketing (a mesma do CONECTA Check-in). O app baixa a lista de participantes e mantém atualizada sozinho.</p>
        <label>Usuário<input autoFocus autoComplete="username" value={login.usuario} onChange={(event) => setLogin((current) => ({ ...current, usuario: event.target.value }))} /></label>
        <label>Senha<input type="password" autoComplete="current-password" value={login.senha} onChange={(event) => setLogin((current) => ({ ...current, senha: event.target.value }))} /></label>
        {login.erro && <p className="gs-error">{login.erro}</p>}
        <div className="gs-actions">
          <button type="button" className="gs-secondary" onClick={() => setMode('form')}>Cancelar</button>
          <button type="submit" className="gs-primary" disabled={login.enviando || !login.usuario || !login.senha}>{login.enviando ? 'Entrando…' : 'Entrar e baixar lista'}</button>
        </div>
      </form>
    )
  } else if (mode === 'estoque') {
    content = (
      <StockEditor
        products={products}
        stock={stock}
        stockOf={stockOf}
        onCancel={() => setMode('form')}
        onSave={async (patch) => {
          await api.updateStock(patch)
          setMode('form')
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
            <div><strong>Respostas</strong><span>{config.quizzesConcluidos} quiz{config.quizzesConcluidos === 1 ? '' : 'zes'} concluído{config.quizzesConcluidos === 1 ? '' : 's'} · um arquivo por dia</span><span className="gs-path" title={config.arquivoRespostas}>{config.arquivoRespostas}</span></div>
            <button type="button" className="gs-secondary" onClick={() => api.openResponses()}>Abrir pasta</button>
          </div>
          {(config.respostasPorDia || []).map((day) => (
            <div className="gs-row gs-row--sub" key={day.arquivo}>
              <div><strong>{day.dia === new Date().toLocaleDateString('pt-BR') ? `Hoje (${day.dia})` : day.dia}</strong><span>{day.total} quiz{day.total === 1 ? '' : 'zes'}</span></div>
              <button type="button" className="gs-secondary" onClick={() => api.openResponsesDay(day.arquivo)}>Abrir no Excel</button>
            </div>
          ))}
          {stock && (
            <div className="gs-row">
              <div><strong>Estoque das vitaminas</strong><span>{stock.ativo ? (() => {
                const esgotados = products.filter((p) => stockOf(p.code, stock) <= 0).length
                const total = products.reduce((sum, p) => sum + stockOf(p.code, stock), 0)
                return `${total} unidades${esgotados ? ` · ${esgotados} esgotado${esgotados > 1 ? 's' : ''}` : ''}`
              })() : 'Controle desligado'}</span></div>
              <button type="button" className="gs-secondary" onClick={() => setMode('estoque')}>Editar</button>
            </div>
          )}
          <div className="gs-row">
            <div>
              <strong>Conta do CONECTA (API)</strong>
              <span>{conecta.conectado ? `${conecta.usuario || 'Conectado'} · ${conecta.erro || (conecta.ultimaSync ? `baixada em ${conecta.ultimaSync}` : 'ainda não baixou')}` : 'Entre para baixar a lista direto da API e manter atualizada'}</span>
              {conectaMessage && <span className="gs-hint">{conectaMessage}</span>}
            </div>
            {conecta.conectado ? (
              <div className="gs-inline-actions">
                <button type="button" className="gs-secondary" onClick={conectaSync}>Atualizar</button>
                <button type="button" className="gs-secondary" onClick={conectaLogout}>Sair</button>
              </div>
            ) : (
              <button type="button" className="gs-secondary" onClick={() => setMode('conecta-login')}>Entrar</button>
            )}
          </div>
          <div className="gs-row">
            <div>
              <strong>Participantes do CONECTA</strong>
              <span>{participantes?.total ? `${participantes.total} pessoas · ${participantes.origem} · ${participantes.atualizadaEm}` : 'Nenhuma lista encontrada: a matrícula não mostra o nome.'}</span>
              {rosterMessage && <span className="gs-hint">{rosterMessage}</span>}
            </div>
            <button type="button" className="gs-secondary" onClick={importRoster}>Importar lista</button>
          </div>
          <div className="gs-row">
            <div>
              <strong>Sexo dos participantes</strong>
              <span>{sexoInfo?.total ? `${sexoInfo.total} pessoas · importada em ${sexoInfo.atualizadaEm} · quem está na planilha não responde Homem/Mulher` : 'O sexo vem da API do CONECTA. Se faltar alguém, importe aqui uma planilha (Excel ou CSV) com MAT e Sexo.'}</span>
              {sexoMessage && <span className="gs-hint">{sexoMessage}</span>}
            </div>
            <div className="gs-inline-actions">
              <button type="button" className="gs-secondary" onClick={importSexo}>Importar planilha</button>
              {sexoInfo?.total > 0 && <button type="button" className="gs-secondary" onClick={removeSexo}>Remover</button>}
            </div>
          </div>
          <div className="gs-row">
            <div><strong>Imprimir cupom</strong><span>Ao terminar o quiz, com a sugestão e mais 2</span></div>
            <div className="gs-segmented" role="group" aria-label="Imprimir cupom">
              <button type="button" aria-pressed={draft.imprimir} onClick={() => update('imprimir')(true)}>Ligado</button>
              <button type="button" aria-pressed={!draft.imprimir} onClick={() => update('imprimir')(false)}>Desligado</button>
            </div>
          </div>
          {draft.imprimir && Array.from({ length: draft.telas }, (_, index) => String(index + 1)).map((tela) => (
            <div className="gs-row" key={tela}>
              <div><strong>Impressora da tela {tela}</strong><span>Bobina térmica 80 mm</span></div>
              <select className="gs-select" value={draft.impressoras[tela] || ''} onChange={setPrinter(tela)} aria-label={`Impressora da tela ${tela}`}>
                <option value="">Padrão do Windows</option>
                {printers.map((printer) => <option key={printer.name} value={printer.name}>{printer.displayName}{printer.isDefault ? ' (padrão)' : ''}</option>)}
              </select>
            </div>
          ))}
          {draft.imprimir && (
            <div className="gs-row">
              <div><strong>Teste de impressão</strong><span>{testMessage || 'Imprime um cupom de exemplo na impressora desta tela (já salva).'}</span></div>
              <button type="button" className="gs-secondary" onClick={testPrint}>Imprimir teste</button>
            </div>
          )}
          {config.monitores > 1 && (
            <div className="gs-row">
              <div><strong>Toque das telas</strong><span>Se tocar numa tela mexe na outra, calibre: o Windows pede para tocar em cada tela uma vez.</span></div>
              <button type="button" className="gs-secondary" onClick={() => api.calibrateTouch()}>Calibrar</button>
            </div>
          )}
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
      <div className="gs-panel" ref={panelRef}>{content}</div>
    </div>
  )
}
