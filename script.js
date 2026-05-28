// Máscara e validação de celular brasileiro
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
  // celular BR: 11 dígitos, 3º dígito é 9
  return d.length === 11 && d[2] === '9';
}

if (celularInput) {
  celularInput.addEventListener('input', () => {
    celularInput.value = mascaraCelular(celularInput.value);
    celularErro.classList.add('hidden');
  });
}

// Campo nome do acompanhante — aparece só quando selecionado 1 acompanhante
const selectAcomp = document.getElementById('acompanhantes');
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

// Nav background on scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// RSVP form: show success message after Netlify submit
const form = document.getElementById('rsvp-form');
const success = document.getElementById('rsvp-success');
function showSuccess() {
  form.classList.add('hidden');
  success.classList.remove('hidden');
  success.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valida celular só se preenchido
    if (celularInput && celularInput.value.trim() !== '' && !celularValido(celularInput.value)) {
      celularErro.classList.remove('hidden');
      celularInput.focus();
      return;
    }

    const data = new URLSearchParams(new FormData(form));

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString(),
    })
      .then(() => showSuccess())
      .catch(() => alert('Ops, algo deu errado. Verifique sua conexão e tente novamente.'));
  });
}

// Smooth-reveal sections on scroll
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
