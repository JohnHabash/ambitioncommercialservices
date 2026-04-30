// Ambition Commercial Services — global script

document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile menu toggle ────────────────────────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => nav.classList.toggle('menu-open'));
    // Fix: close menu when a nav link is tapped
    nav.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('menu-open'));
    });
  }

  // ── Smooth scroll ────────────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (nav) nav.classList.remove('menu-open');
      }
    });
  });

  // ── Shared form submit handler ────────────────────────────────────────
  async function handleQuoteSubmit(form, submitBtn, statusEl) {
    // Honeypot check
    const hp = form.querySelector('[name="website"]');
    if (hp && hp.value) {
      statusEl.textContent = "Thanks — we'll be in touch within 2 hours.";
      form.reset();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    statusEl.textContent = '';

    const data = {
      name:    form.querySelector('[name="name"]')?.value    || '',
      phone:   form.querySelector('[name="phone"]')?.value   || '',
      email:   form.querySelector('[name="email"]')?.value   || '',
      service: form.querySelector('[name="service"]')?.value || '',
      suburb:  form.querySelector('[name="suburb"]')?.value  || '',
      details: form.querySelector('[name="details"]')?.value || '',
    };

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        statusEl.style.color = 'var(--brass)';
        statusEl.innerHTML = '<strong>Thanks!</strong> We\'ll be in touch within 2 hours.';
        form.reset();
        // Restore preselected service after reset
        const sel = form.querySelector('[name="service"][data-preselect]');
        if (sel) sel.value = sel.dataset.preselect;
        submitBtn.textContent = 'Sent ✓';
      } else {
        throw new Error(await res.text() || 'Send failed');
      }
    } catch {
      statusEl.style.color = '#c0392b';
      statusEl.innerHTML = 'Something went wrong — please call <a href="tel:+61432214027" style="color:inherit;text-decoration:underline;">0432 214 027</a> or email <a href="mailto:ambitioncommercialservices@gmail.com" style="color:inherit;text-decoration:underline;">ambitioncommercialservices@gmail.com</a>.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Try again';
    }
  }

  // ── Contact page main form ────────────────────────────────────────────
  const mainForm = document.getElementById('quote-form');
  if (mainForm) {
    const btn    = document.getElementById('quote-submit');
    const status = document.getElementById('form-status');
    mainForm.addEventListener('submit', e => {
      e.preventDefault();
      handleQuoteSubmit(mainForm, btn, status);
    });
  }

  // ── Hero inline forms (all pages) ────────────────────────────────────
  document.querySelectorAll('.hero-quote-form').forEach(form => {
    const btn    = form.querySelector('.hero-form-submit');
    const status = form.querySelector('.hero-form-status');
    if (!btn || !status) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      handleQuoteSubmit(form, btn, status);
    });
  });

});
