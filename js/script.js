(() => {
  const root = document.documentElement;
  root.classList.add('js-enabled');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const prepareWriting = (element) => {
    if (!element || element.dataset.writePrepared === 'true') return;

    const parts = element.innerHTML
      .trim()
      .split(/<br\s*\/?\s*>/i)
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.length) return;

    element.innerHTML = parts
      .map((part, index) => `<span class="write-line" style="--line-index: ${index}">${part}</span>`)
      .join('<br>');

    element.style.setProperty('--line-count', parts.length);
    element.dataset.writePrepared = 'true';
  };

  const heroTitle = document.querySelector('.hero__title');

  if (heroTitle) {
    let lineIndex = 0;

    heroTitle.querySelectorAll(':scope > span').forEach((line) => {
      if (line.classList.contains('hero__plus')) return;
      line.classList.add('write-line');
      line.style.setProperty('--line-index', lineIndex);
      lineIndex += 1;
    });

    heroTitle.style.setProperty('--line-count', lineIndex);

    if (reduceMotion) {
      heroTitle.classList.add('is-visible');
    } else {
      window.requestAnimationFrame(() => heroTitle.classList.add('is-visible'));
    }
  }

  const writeTargets = document.querySelectorAll(
    '.invite__title, .invite__text_three h2, .title h2'
  );

  writeTargets.forEach((element) => {
    prepareWriting(element);
    element.dataset.animate = 'write';
  });

  const revealMap = [
    ['.invite__text', 'text'],
    ['.invite__text_two', 'text'],
    ['.invite__text_three', 'text'],
    ['.title', 'text'],
    ['.dresscode', 'text'],
    ['.dress_flex', 'text'],
    ['.invite__photo, .invite__photo_two, .invite__photo_three, .invite__photo_four, .dress_flex img, .invite__text_two img', 'photo'],
  ];

  const animated = new Set(writeTargets);

  revealMap.forEach(([selector, type]) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (animated.has(element)) return;
      animated.add(element);
      element.dataset.animate = type;
    });
  });

  [...animated].forEach((element, index) => {
    element.style.setProperty('--delay', `${Math.min(index * 0.03, 0.22)}s`);
  });

  const showElement = (element) => element.classList.add('is-visible');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        showElement(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -7% 0px',
    });

    animated.forEach((element) => revealObserver.observe(element));
  } else {
    animated.forEach(showElement);
  }

  const hero = document.querySelector('.hero');

  if (hero && !reduceMotion) {
    const snow = document.createElement('div');
    snow.className = 'hero__snow';

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const flakeCount = isMobile ? 10 : 16;

    for (let i = 0; i < flakeCount; i += 1) {
      const flake = document.createElement('span');
      flake.className = 'hero__snowflake';
      flake.style.setProperty('--left', `${Math.random() * 100}%`);
      flake.style.setProperty('--size', `${(Math.random() * 5 + 4).toFixed(2)}px`);
      flake.style.setProperty('--duration', `${(Math.random() * 7 + 10).toFixed(2)}s`);
      flake.style.setProperty('--delay', `${(-Math.random() * 14).toFixed(2)}s`);
      flake.style.setProperty('--drift', `${(Math.random() * 48 - 24).toFixed(2)}px`);
      snow.appendChild(flake);
    }

    hero.appendChild(snow);
  }

  if (hero && heroTitle && !reduceMotion) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      hero.style.setProperty('--hero-x', `${clamp(x * -7, -7, 7)}`);
      hero.style.setProperty('--hero-y', `${clamp(y * -5, -5, 5)}`);
      heroTitle.style.setProperty('--title-x', `${clamp(x * 5, -5, 5)}`);
      heroTitle.style.setProperty('--title-y', `${clamp(y * 4, -4, 4)}`);
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--hero-x', '0');
      hero.style.setProperty('--hero-y', '0');
      heroTitle.style.setProperty('--title-x', '0');
      heroTitle.style.setProperty('--title-y', '0');
    });
  }
})();
