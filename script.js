// ─── CONFIG GITHUB ────────────────────────────────────────
const GITHUB_TOKEN = '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';
const GITHUB_OWNER = 'kristenarguello';
const GITHUB_REPO  = 'rsvp-formatura';
const GITHUB_FILE  = 'rsvp.csv';
// ──────────────────────────────────────────────────────────

const CSV_HEADER = 'Data,Nome,Celular,Colação,Festa,Acompanhante,Nº Acompanhantes,Observação\n';

async function salvarNoGithub(dados) {
  const apiUrl  = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  // Busca arquivo atual (para pegar SHA e conteúdo existente)
  const getRes   = await fetch(apiUrl, { headers });
  let sha        = null;
  let csvAtual   = CSV_HEADER;

  if (getRes.ok) {
    const fileData = await getRes.json();
    sha      = fileData.sha;
    csvAtual = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
  }

  // Monta nova linha
  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const linha = [
    agora,
    dados.name              || '',
    dados.celular           || '',
    dados.colacao           || '',
    dados.jantar            || '',
    dados['nome-acompanhante'] || '',
    dados.acompanhantes     || '0',
    (dados.observacao       || '').replace(/"/g, "'"),
  ].map(v => `"${v}"`).join(',') + '\n';

  const novoConteudo = csvAtual + linha;
  const novoBase64   = btoa(unescape(encodeURIComponent(novoConteudo)));

  // Atualiza (ou cria) o arquivo no GitHub
  const body = { message: `RSVP: ${dados.name}`, content: novoBase64 };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(err.message || 'Erro ao salvar no GitHub');
  }
}

// ─── CALENDÁRIO ───────────────────────────────────────────
let vaiColacao = false;
let vaiJantar  = false;

function gerarEvento(summary, dtstart, dtend, location, description) {
  return [
    'BEGIN:VEVENT',
    `SUMMARY:${summary}`,
    `DTSTART;TZID=America/Sao_Paulo:${dtstart}`,
    `DTEND;TZID=America/Sao_Paulo:${dtend}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
  ];
}

document.getElementById('btn-calendario')?.addEventListener('click', () => {
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Formatura Kristen 2026//PT',
    'CALSCALE:GREGORIAN',
  ];

  if (vaiColacao) linhas.push(...gerarEvento(
    'Colação de Grau · Kristen Karsburg Arguello',
    '20260815T200000', '20260815T213000',
    'Salão de Atos\\, PUC-RS\\, Av. Ipiranga 6681\\, Porto Alegre',
    'Formatura de Ciência da Computação'
  ));

  if (vaiJantar) linhas.push(...gerarEvento(
    'Festa de Comemoração · Kristen Karsburg Arguello',
    '20260815T213000', '20260815T233000',
    'Gui Olivier Cocina de la Madre\\, Porto Alegre',
    'Jantar + pista de dança + bar & docinhos'
  ));

  linhas.push('END:VCALENDAR');

  const blob = new Blob([linhas.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'formatura-kristen.ics';
  a.click();
  URL.revokeObjectURL(url);
});

// ─── CELULAR ──────────────────────────────────────────────
const celularInput = document.getElementById('celular');
const celularErro  = document.getElementById('celular-erro');

function mascaraCelular(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2)  return d.replace(/^(\d{0,2})/, '($1');
  if (d.length <= 7)  return d.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  if (d.length <= 11) return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  return valor;
}

function celularValido(valor) {
  const d = valor.replace(/\D/g, '');
  return d.length === 11 && d[2] === '9';
}

if (celularInput) {
  celularInput.addEventListener('input', () => {
    celularInput.value = mascaraCelular(celularInput.value);
    celularErro.classList.add('hidden');
  });
}

// ─── ACOMPANHANTE ─────────────────────────────────────────
const selectAcomp    = document.getElementById('acompanhantes');
const grupoNomeAcomp = document.getElementById('grupo-nome-acompanhante');
const inputNomeAcomp = document.getElementById('nome-acompanhante');

if (selectAcomp) {
  selectAcomp.addEventListener('change', () => {
    const temAcomp = selectAcomp.value === '1';
    grupoNomeAcomp.classList.toggle('hidden', !temAcomp);
    inputNomeAcomp.required = temAcomp;
    if (!temAcomp) inputNomeAcomp.value = '';
  });
}

// ─── NAV SCROLL ───────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ─── FORMULÁRIO ───────────────────────────────────────────
const form    = document.getElementById('rsvp-form');
const success = document.getElementById('rsvp-success');

function showSuccess() {
  form.classList.add('hidden');
  success.classList.remove('hidden');
  success.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    vaiColacao = document.querySelector('input[name="colacao"]:checked')?.value === 'sim';
    vaiJantar  = document.querySelector('input[name="jantar"]:checked')?.value === 'sim';

    if (celularInput && celularInput.value.trim() !== '' && !celularValido(celularInput.value)) {
      celularErro.classList.remove('hidden');
      celularInput.focus();
      return;
    }

    const dados = Object.fromEntries(new FormData(form));

    try {
      await salvarNoGithub(dados);
      showSuccess();
    } catch (err) {
      console.error(err);
      alert('Ops, algo deu errado. Verifique sua conexão e tente novamente.');
    }
  });
}

// ─── REVEAL ANIMATION ─────────────────────────────────────
const revealEls = document.querySelectorAll('section, .event-card, .gallery-item');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

revealEls.forEach((el) => {
  el.classList.add('reveal');
  observer.observe(el);
});
