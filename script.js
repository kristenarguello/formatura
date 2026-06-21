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
    'Salão de Atos\\, PUC-RS\\, Av. Ipiranga 6681 - Portão 4\\, Porto Alegre',
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

function celularValido(valor) {
  return valor.replace(/\D/g, '').length >= 6;
}

if (celularInput) {
  celularInput.addEventListener('input', () => {
    celularErro.classList.add('hidden');
  });
}

// ─── ACOMPANHANTE ─────────────────────────────────────────
const selectAcomp     = document.getElementById('acompanhantes');
const grupoNomeAcomp  = document.getElementById('grupo-nome-acompanhante');
const inputNomeAcomp  = document.getElementById('nome-acompanhante');
const labelAcomp      = document.getElementById('label-acompanhante');
const grupoNomeAcomp2 = document.getElementById('grupo-nome-acompanhante-2');
const inputNomeAcomp2 = document.getElementById('nome-acompanhante-2');

if (selectAcomp) {
  selectAcomp.addEventListener('change', () => {
    const val = parseInt(selectAcomp.value);

    grupoNomeAcomp.classList.toggle('hidden', val < 1);
    inputNomeAcomp.required = val >= 1;
    if (val < 1) inputNomeAcomp.value = '';
    labelAcomp.textContent = val === 2 ? 'Nome do acompanhante 1 *' : 'Nome do acompanhante *';

    grupoNomeAcomp2.classList.toggle('hidden', val < 2);
    inputNomeAcomp2.required = val >= 2;
    if (val < 2) inputNomeAcomp2.value = '';
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
    const btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    try {
      await salvarNoPlanilha(dados);
      showSuccess();
    } catch (err) {
      console.error(err);
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Confirmar presença';
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
