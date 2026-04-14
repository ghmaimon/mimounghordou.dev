// ═══════════════════════════════════════════════════════════
//  main.js, Portfolio Interactions
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ─── Scroll-based Reveal Animations ───
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-up, .stagger').forEach(el => {
    observer.observe(el);
  });

  // ─── Navbar Scroll Effect ───
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  function handleScroll() {
    const currentScroll = window.scrollY;
    nav.classList.toggle('scrolled', currentScroll > 20);
    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ─── Active Nav Link ───
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  function updateActiveLink() {
    const scrollPos = window.scrollY + 100;
    let current = '';

    sections.forEach(section => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === '#' + current);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // ─── Mobile Menu Toggle ───
  const menuBtn = document.getElementById('nav-menu-btn');
  const mobileNav = document.getElementById('nav-mobile');
  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
    mobileNav.classList.toggle('open', menuOpen);
    menuBtn.innerHTML = menuOpen
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMenu);
  }

  // Close mobile menu on link click
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (menuOpen) toggleMenu();
      });
    });
  }

  // ─── Stat Counter Animation ───
  function animateValue(el, end, duration) {
    const text = el.textContent.trim();
    const suffix = text.replace(/[\d.]/g, '');
    const isPercentage = suffix.includes('%');
    const target = parseFloat(text);

    if (isNaN(target)) return;

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statValues = entry.target.querySelectorAll('.hero-stat-value');
        statValues.forEach((el, i) => {
          setTimeout(() => animateValue(el, 0, 1200), i * 150);
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);

  // ─── Smooth Scroll for anchor links ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── GitHub Contribution Graph ───
  async function renderGitHubGraph() {
    const container = document.getElementById('github-graph');
    if (!container) return;

    try {
      const res = await fetch('https://github-contributions-api.jogruber.de/v4/ghmaimon?y=last');
      const data = await res.json();

      if (!data.contributions || !data.contributions.length) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Could not load contributions.</p>';
        return;
      }

      const contributions = data.contributions;

      // Group by week
      const weeks = [];
      let currentWeek = [];
      contributions.forEach(day => {
        const d = new Date(day.date);
        if (d.getDay() === 0 && currentWeek.length > 0) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
        currentWeek.push(day);
      });
      if (currentWeek.length) weeks.push(currentWeek);

      // Color levels
      function getColor(count) {
        if (count === 0) return 'rgba(255,255,255,0.04)';
        if (count <= 3) return 'rgba(124,58,237,0.3)';
        if (count <= 6) return 'rgba(124,58,237,0.5)';
        if (count <= 9) return 'rgba(124,58,237,0.7)';
        return 'rgba(124,58,237,0.9)';
      }

      // Total count
      const total = contributions.reduce((s, d) => s + d.count, 0);

      // Build SVG
      const cellSize = 13;
      const gap = 3;
      const step = cellSize + gap;
      const svgWidth = weeks.length * step;
      const svgHeight = 7 * step;

      // Month labels
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      let monthLabels = '';
      let lastMonth = -1;
      weeks.forEach((week, wi) => {
        const firstDay = new Date(week[0].date);
        const m = firstDay.getMonth();
        if (m !== lastMonth) {
          monthLabels += '<text x="' + (wi * step) + '" y="0" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">' + months[m] + '</text>';
          lastMonth = m;
        }
      });

      let cells = '';
      weeks.forEach((week, wi) => {
        week.forEach(day => {
          const d = new Date(day.date);
          const dow = d.getDay();
          const x = wi * step;
          const y = dow * step + 14;
          cells += '<rect x="' + x + '" y="' + y + '" width="' + cellSize + '" height="' + cellSize + '" rx="2" fill="' + getColor(day.count) + '"><title>' + day.date + ': ' + day.count + ' contributions</title></rect>';
        });
      });

      container.innerHTML =
        '<div class="github-total"><span class="github-total-count">' + total + '</span> contributions in the last year</div>' +
        '<div class="github-graph-scroll"><svg width="' + svgWidth + '" height="' + (svgHeight + 14) + '" class="github-svg">' +
        monthLabels + cells +
        '</svg></div>' +
        '<div class="github-legend"><span class="legend-label">Less</span>' +
        '<span class="legend-cell" style="background:rgba(255,255,255,0.04)"></span>' +
        '<span class="legend-cell" style="background:rgba(124,58,237,0.3)"></span>' +
        '<span class="legend-cell" style="background:rgba(124,58,237,0.5)"></span>' +
        '<span class="legend-cell" style="background:rgba(124,58,237,0.7)"></span>' +
        '<span class="legend-cell" style="background:rgba(124,58,237,0.9)"></span>' +
        '<span class="legend-label">More</span></div>';

    } catch (e) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Could not load contributions.</p>';
    }
  }

  renderGitHubGraph();

});
