/* ============================================================
   ELYSIAN STUDIOS — Interactions & Animations
   ============================================================ */

/* ── Custom Cursor ─────────────────────────────────────────── */
(function initCursor() {
  const dot = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0 };

  document.addEventListener('mousemove', (e) => {
    dot.x = e.clientX;
    dot.y = e.clientY;
  });

  function animateCursor() {
    cursor.x += (dot.x - cursor.x) * 0.12;
    cursor.y += (dot.y - cursor.y) * 0.12;
    document.documentElement.style.setProperty('--cx', cursor.x + 'px');
    document.documentElement.style.setProperty('--cy', cursor.y + 'px');
    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  // Cursor scale on hover interactive elements
  const interactives = document.querySelectorAll('a, button, .chronicle-card, .thinker-card, .archive-card');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.style.setProperty('--cursor-size', '20px');
    });
    el.addEventListener('mouseleave', () => {
      document.body.style.setProperty('--cursor-size', '8px');
    });
  });
})();

/* ── Navigation Scroll Behavior ────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
})();

/* ── Mobile Menu ────────────────────────────────────────────── */
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;

  // Create mobile menu
  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.innerHTML = `
    <button class="mobile-menu-close" aria-label="Close menu" style="position:absolute;top:2rem;right:2.5rem;background:none;border:none;color:var(--ivory);font-size:1.5rem;">✕</button>
    <a href="#chronicles" class="mobile-link">Chronicles</a>
    <a href="#archive" class="mobile-link">The Archive</a>
    <a href="#thinkers" class="mobile-link">Thinkers</a>
    <a href="#gallery" class="mobile-link">Gallery</a>
  `;
  document.body.appendChild(menu);

  hamburger.addEventListener('click', () => menu.classList.add('open'));

  menu.querySelector('.mobile-menu-close').addEventListener('click', () => menu.classList.remove('open'));

  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });
})();

/* ── Parallax Hero Portraits ────────────────────────────────── */
(function initParallax() {
  const portraits = document.querySelectorAll('[data-parallax]');
  if (!portraits.length) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    portraits.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      el.style.transform = `translateY(${scrollY * speed}px)`;
    });
  }, { passive: true });
})();

/* ── Chronicle Card Carousel ─────────────────────────────────── */
(function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('carouselDots');
  if (!track) return;

  const cards = track.querySelectorAll('.chronicle-card');
  const totalCards = cards.length;
  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let startTranslate = 0;
  let currentTranslate = 0;
  let animationID = 0;

  // How many cards visible at once (responsive)
  function getVisible() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1100) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, totalCards - getVisible());
  }

  function getCardWidth() {
    const card = cards[0];
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.gap) || 28;
    return card.offsetWidth + gap;
  }

  function setTranslate(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex()));
    const offset = currentIndex * getCardWidth();
    track.style.transform = `translateX(-${offset}px)`;
    updateControls();
  }

  function updateControls() {
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex();

    // Update dots
    if (dotsContainer) {
      dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }
  }

  // Build dots
  if (dotsContainer) {
    for (let i = 0; i <= maxIndex(); i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => setTranslate(i));
      dotsContainer.appendChild(dot);
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => setTranslate(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => setTranslate(currentIndex + 1));

  // Touch / drag
  function touchStart(e) {
    isDragging = true;
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startTranslate = currentIndex * getCardWidth();
    track.style.transition = 'none';
    animationID = requestAnimationFrame(dragAnimation);
  }

  function dragAnimation() {
    if (isDragging) requestAnimationFrame(dragAnimation);
  }

  function touchMove(e) {
    if (!isDragging) return;
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX;
    currentTranslate = startTranslate - diff;
    track.style.transform = `translateX(-${Math.max(0, currentTranslate)}px)`;
  }

  function touchEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    cancelAnimationFrame(animationID);
    track.style.transition = '';

    const moved = startTranslate - currentTranslate;
    const threshold = getCardWidth() * 0.25;

    if (moved > threshold) {
      setTranslate(currentIndex + 1);
    } else if (moved < -threshold) {
      setTranslate(currentIndex - 1);
    } else {
      setTranslate(currentIndex);
    }
  }

  track.addEventListener('mousedown', touchStart);
  track.addEventListener('mousemove', touchMove);
  track.addEventListener('mouseup', touchEnd);
  track.addEventListener('mouseleave', touchEnd);
  track.addEventListener('touchstart', touchStart, { passive: true });
  track.addEventListener('touchmove', touchMove, { passive: true });
  track.addEventListener('touchend', touchEnd);

  // Auto-advance every 5s
  let autoInterval = setInterval(() => {
    if (currentIndex < maxIndex()) {
      setTranslate(currentIndex + 1);
    } else {
      setTranslate(0);
    }
  }, 5000);

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoInterval));
  track.addEventListener('mouseleave', () => {
    autoInterval = setInterval(() => {
      if (currentIndex < maxIndex()) {
        setTranslate(currentIndex + 1);
      } else {
        setTranslate(0);
      }
    }, 5000);
  });

  window.addEventListener('resize', () => setTranslate(0));
  updateControls();
})();

/* ── Scroll Reveal ───────────────────────────────────────────── */
(function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.section-header, .chronicle-card, .archive-card, .thinker-card, .featured-inner > *, .pull-quote, .grand-quote, .newsletter-inner > *'
  );

  elements.forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('reveal-delay-1');
    if (i % 3 === 2) el.classList.add('reveal-delay-2');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  elements.forEach(el => observer.observe(el));
})();

/* ── Card 3D Tilt on Hover ──────────────────────────────────── */
(function initTilt() {
  const cards = document.querySelectorAll('.chronicle-card, .archive-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -6;
      const rotateY = (x - centerX) / centerX * 6;

      card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
      card.style.transition = 'transform 0.1s ease';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });
  });
})();

/* ── Archive Card Shine Effect ──────────────────────────────── */
(function initShine() {
  const cards = document.querySelectorAll('.archive-card, .chronicle-card');

  cards.forEach(card => {
    const shine = document.createElement('div');
    shine.style.cssText = `
      position: absolute;
      top: 0; left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(212,175,55,0.06), transparent);
      pointer-events: none;
      z-index: 10;
      transition: left 0.6s ease;
    `;
    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    card.appendChild(shine);

    card.addEventListener('mouseenter', () => {
      shine.style.left = '150%';
      shine.style.transition = 'left 0.6s ease';
    });

    card.addEventListener('mouseleave', () => {
      shine.style.left = '-100%';
      shine.style.transition = 'none';
    });
  });
})();

/* ── Newsletter Form ─────────────────────────────────────────── */
function handleSubscribe(e) {
  e.preventDefault();
  const input = e.target.querySelector('.newsletter-input');
  const email = input.value.trim();

  if (!email) return;

  // Show toast
  showToast('Welcome to Elysian! ✦ Your first chronicle arrives soon.');
  input.value = '';
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ── Smooth Section Entry Numbers ───────────────────────────── */
(function initCounters() {
  const statNums = document.querySelectorAll('.stat-num');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.textContent);
      let current = 0;
      const step = Math.ceil(target / 20);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 60);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => observer.observe(el));
})();

/* ── Gold particle trail ─────────────────────────────────────── */
(function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 9998;
    opacity: 0.5;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  let mouse = { x: -100, y: -100 };

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (Math.random() > 0.7) {
      particles.push({
        x: mouse.x,
        y: mouse.y,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1 - 0.5,
        alpha: 0.6,
        size: Math.random() * 2 + 1,
      });
    }
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.018;
      p.size *= 0.97;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  animate();
})();

/* ── Keyboard navigation ─────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    const prev = document.getElementById('prevBtn');
    if (prev && !prev.disabled) prev.click();
  }
  if (e.key === 'ArrowRight') {
    const next = document.getElementById('nextBtn');
    if (next && !next.disabled) next.click();
  }
});
