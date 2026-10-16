// Cupom do quiz na bobina térmica de 79,5 mm, no mesmo formato da pré-venda (prevendacall):
// participante do CONECTA, sugestão GoodLife principal e mais duas na sequência.
import goodlifeLogo from '../assets/logo-good-fim.png'

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

// O cupom é renderizado numa janela à parte: as imagens precisam de endereço absoluto.
const absolute = (src) => (src ? new URL(src, window.location.href).href : '')

// Primeiro e último nome, para caber em destaque numa linha.
const shortName = (nome) => {
  const parts = String(nome || '').trim().split(/\s+/).filter(Boolean)
  return parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts.join(' ')
}

const productName = (product) => product?.officialName || product?.name || ''

// Idade do cadastro do CONECTA (anos); a mesma faixa de validade de faixaEtaria em perguntas.js.
const idadeValida = (idade) => Number.isFinite(Number(idade)) && Number(idade) >= 14 && Number(idade) <= 100

export function htmlCupomQuiz({ pessoa, result, answers, questions, screen, sessionId }) {
  const now = new Date()
  const data = now.toLocaleDateString('pt-BR')
  const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const main = result?.product
  const alternatives = result?.alternatives || []

  const answersHtml = questions.map((question) => {
    // Com a idade do cadastro no topo do cupom, a faixa de idade repetiria a informação.
    if (question.id === 'age' && idadeValida(pessoa?.idade)) return ''
    const option = question.options.find((item) => item.id === answers[question.id])
    // "Nenhum desses" não diz nada fora da tela da pergunta: fica fora do cupom.
    return option && option.icon !== 'none' ? `<li>${escapeHtml(option.reasonLabel || option.label)}</li>` : ''
  }).join('')

  const pessoaHtml = pessoa?.matricula ? `
    <div class="center pessoa">${escapeHtml(shortName(pessoa.nome) || 'Participante')}</div>
    <div class="line"><span>Matrícula</span><strong>${escapeHtml(pessoa.matricula)}</strong></div>
    ${pessoa.loja ? `<div class="line"><span>Loja</span><strong>${escapeHtml(pessoa.loja)}${pessoa.lojaNumero ? ` (${escapeHtml(pessoa.lojaNumero)})` : ''}</strong></div>` : ''}
    ${pessoa.time ? `<div class="line"><span>Time</span><strong>${escapeHtml(pessoa.time)}</strong></div>` : ''}
    ${idadeValida(pessoa.idade) ? `<div class="line"><span>Idade</span><strong>${Number(pessoa.idade)} anos</strong></div>` : ''}
    <div class="hr"></div>` : ''

  const mainHtml = main ? `
    <div class="center eyebrow">SUA SUGESTÃO GOODLIFE</div>
    ${main.hasPhoto && main.image ? `<div class="center"><img class="produto" src="${absolute(main.image)}" alt="" /></div>` : ''}
    <div class="center produto-nome">${escapeHtml(productName(main))}</div>
    <div class="center small">${escapeHtml(main.line)}${main.code ? ` · Cód. ${escapeHtml(main.code)}` : ''}</div>
    ${main.reason?.text ? `<p class="resumo">${escapeHtml(main.reason.text)}</p>` : ''}
    ${main.highlights?.length ? `<ul class="destaques">${main.highlights.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
  ` : '<div class="center">Nenhum produto disponível no momento.</div>'

  const alternativesHtml = alternatives.length ? `
    <div class="hr"></div>
    <div class="center eyebrow">TAMBÉM COMBINAM COM VOCÊ</div>
    ${alternatives.map((product, index) => `
      <div class="alt">
        <div class="alt-num">${index + 2}</div>
        <div>
          <div class="alt-nome">${escapeHtml(productName(product))}</div>
          <div class="small">${escapeHtml(product.line)}${product.code ? ` · Cód. ${escapeHtml(product.code)}` : ''}</div>
          ${product.reason?.text ? `<div class="alt-motivo">${escapeHtml(product.reason.text)}</div>` : ''}
        </div>
      </div>`).join('')}
  ` : ''

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>GoodLife Quiz</title>
  <style>
    @page { size: 79.5mm auto; margin: 2.5mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-rendering: geometricPrecision; }
    html, body { width: 100%; max-width: 100%; overflow: hidden; }
    body { margin: 0; font-family: Arial, sans-serif; color: #111; font-size: 12px; background: #fff; }
    .wrap { width: 100%; max-width: 73mm; margin: 0 auto; padding: 1.2mm 0.8mm 0; }
    .center { text-align: center; }
    .logos { display: flex; align-items: center; justify-content: center; gap: 4mm; margin-bottom: 2mm; }
    .logos img { height: 14mm; width: auto; max-width: 44mm; object-fit: contain; filter: grayscale(1) contrast(1.2); }
    .evento { font-size: 13px; font-weight: 700; letter-spacing: .04em; }
    .sub { font-size: 11px; margin-top: 1px; }
    .hr { border-top: 1px dashed #333; margin: 7px 0; }
    .pessoa { font-size: 19px; font-weight: 700; line-height: 1.15; margin: 2px 0 5px; overflow-wrap: anywhere; }
    .line { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; margin-top: 2px; }
    .line strong { text-align: right; overflow-wrap: anywhere; }
    .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .08em; margin-bottom: 4px; }
    .produto { width: 30mm; height: 30mm; object-fit: contain; filter: grayscale(1) contrast(1.1); margin: 2px auto 4px; display: block; }
    .produto-nome { font-size: 16px; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
    .small { font-size: 11px; color: #222; margin-top: 2px; }
    .resumo { font-size: 12px; line-height: 1.3; margin: 6px 0 4px; text-align: center; }
    .destaques { margin: 4px 0 0; padding-left: 14px; font-size: 11px; line-height: 1.3; }
    .alt { display: flex; gap: 8px; align-items: flex-start; margin-top: 6px; }
    .alt-num { flex: 0 0 18px; height: 18px; border: 1.5px solid #111; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .alt-motivo { font-size: 11px; line-height: 1.3; margin-top: 2px; }
    .alt-nome { font-size: 13px; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
    .respostas { margin: 3px 0 0; padding-left: 14px; font-size: 11px; line-height: 1.35; }
    .aviso { font-size: 10px; text-align: center; margin-top: 6px; }
    .rodape { margin-top: 8px; text-align: right; font-size: 10px; font-style: italic; color: #333; }
    @media print { html, body { margin: 0 !important; padding: 0 !important; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logos"><img src="${absolute(goodlifeLogo)}" alt="GoodLife" /></div>
    <div class="center evento">CONECTA 2026 · CALLFARMA</div>
    <div class="center sub">Descubra sua vitamina ideal</div>
    <div class="hr"></div>
    ${pessoaHtml}
    ${mainHtml}
    ${alternativesHtml}
    <div class="hr"></div>
    <div><strong>Seu perfil:</strong> ${escapeHtml(result?.profile?.title || '')}</div>
    <ul class="respostas">${answersHtml}</ul>
    <div class="hr"></div>
    <div class="aviso">Sugestão informativa. Consulte um profissional de saúde.</div>
    <div class="rodape">Tela ${escapeHtml(screen)} · ${data} às ${hora} · ${escapeHtml(sessionId || '')}</div>
  </div>
</body>
</html>`
}
