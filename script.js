// ─── CONFIG GOOGLE SHEETS ─────────────────────────────────
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9GoWSmS2yk82q33_H-Ul1hitYdaecguyELkTV3T6zhg_dW2gBxjB2oGiuoX6CBUk0/exec';
// ──────────────────────────────────────────────────────────

function salvarNoPlanilha(dados) {
  return new Promise((resolve) => {
    const payload = { ...dados, senha: 'formatura2026' };

    const iframe = document.createElement('iframe');
    iframe.name = 'rsvp-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const tempForm = document.createElement('form');
    tempForm.method = 'POST';
    tempForm.action = APPS_SCRIPT_URL;
    tempForm.target = 'rsvp-iframe';

    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type  = 'hidden';
      input.name  = key;
      input.value = value ?? '';
      tempForm.appendChild(input);
    });

    document.body.appendChild(tempForm);

    iframe.onload = () => {
      document.body.removeChild(tempForm);
      document.body.removeChild(iframe);
      resolve();
    };

    tempForm.submit();
  });
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
      await salvarNoPlanilha(dados);
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
