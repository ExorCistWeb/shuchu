(() => {
  const root = document.documentElement;
  root.classList.add('js-enabled');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const qs = (selector, parent = document) => parent.querySelector(selector);
  const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const showElement = (element) => element.classList.add('is-visible');

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

  const initHeroTitle = () => {
    const heroTitle = qs('.hero__title');
    if (!heroTitle) return null;

    let lineIndex = 0;

    [...heroTitle.children].forEach((line) => {
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

    return heroTitle;
  };

  const initScrollAnimations = () => {
    const writeTargets = qsa([
      '.invite__title',
      '.invite__text_three h2',
      '.title h2',
      '.detail h2',
      '.wishes h2',
      '.end__timer-title',
    ].join(','));

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
      ['.detail p', 'text'],
      ['.detail_info', 'text'],
      ['.wishes_box p', 'text'],
      ['.faq > .container > p', 'text'],
      ['.faq__field', 'form'],
      ['.faq__submit', 'form'],
      ['.end__timer-grid', 'timer'],
      ['.btn_flex a, .detail a', 'link'],
      ['.invite__photo, .invite__photo_two, .invite__photo_three, .invite__photo_four, .dress_flex img, .invite__text_two img', 'photo'],
    ];

    const animated = new Set(writeTargets);

    revealMap.forEach(([selector, type]) => {
      qsa(selector).forEach((element) => {
        if (!animated.has(element)) {
          animated.add(element);
          element.dataset.animate = type;
        }
      });
    });

    [...animated].forEach((element, index) => {
      element.style.setProperty('--delay', `${Math.min(index * 0.025, 0.28)}s`);
    });

    if (!reduceMotion && 'IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          showElement(entry.target);
          observer.unobserve(entry.target);
        });
      }, {
        threshold: 0.14,
        rootMargin: '0px 0px -7% 0px',
      });

      animated.forEach((element) => revealObserver.observe(element));
    } else {
      animated.forEach(showElement);
    }
  };

  const initSectionBackgrounds = () => {
    const sections = qsa('.detail, .wishes, .end');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-section-visible'));
      return;
    }

    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-section-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
    });

    sections.forEach((section) => sectionObserver.observe(section));
  };

  const initHeroMotion = (heroTitle) => {
    const hero = qs('.hero');
    if (!hero) return;

    if (!reduceMotion) {
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

    if (!heroTitle || reduceMotion) return;

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
  };

  const initInteractiveControls = () => {
    const controls = qsa('.btn_flex a, .detail a, .faq__submit');
    if (!controls.length) return;

    controls.forEach((control) => {
      control.addEventListener('pointermove', (event) => {
        const rect = control.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const dx = (x / rect.width - 0.5) * 8;
        const dy = (y / rect.height - 0.5) * 5;

        control.style.setProperty('--mx', `${x}px`);
        control.style.setProperty('--my', `${y}px`);
        control.style.setProperty('--magnet-x', `${dx.toFixed(2)}px`);
        control.style.setProperty('--magnet-y', `${dy.toFixed(2)}px`);
      }, { passive: true });

      control.addEventListener('pointerleave', () => {
        control.style.setProperty('--magnet-x', '0px');
        control.style.setProperty('--magnet-y', '0px');
      });
    });
  };

  const initFormStates = () => {
    qsa('.faq__input').forEach((input) => {
      const updateFilledState = () => {
        input.classList.toggle('is-filled', input.value.trim().length > 0);
      };

      input.addEventListener('input', updateFilledState);
      updateFilledState();
    });
  };

  const initCountdown = () => {
    const countdown = qs('[data-countdown]');
    if (!countdown) return;

    const targetDate = new Date(countdown.dataset.countdown);
    const daysElement = qs('[data-days]', countdown);
    const hoursElement = qs('[data-hours]', countdown);
    const minutesElement = qs('[data-minutes]', countdown);

    if (!daysElement || !hoursElement || !minutesElement || Number.isNaN(targetDate.getTime())) return;

    const pad = (number) => String(number).padStart(2, '0');

    const setValue = (element, value) => {
      if (element.textContent === value) return;

      element.classList.add('is-changing');
      window.setTimeout(() => {
        element.textContent = value;
        element.classList.remove('is-changing');
      }, reduceMotion ? 0 : 140);
    };

    const updateCountdown = () => {
      const difference = targetDate - new Date();

      if (difference <= 0) {
        setValue(daysElement, '00');
        setValue(hoursElement, '00');
        setValue(minutesElement, '00');
        return;
      }

      const totalMinutes = Math.floor(difference / 1000 / 60);
      const days = Math.floor(totalMinutes / 60 / 24);
      const hours = Math.floor((totalMinutes / 60) % 24);
      const minutes = totalMinutes % 60;

      setValue(daysElement, pad(days));
      setValue(hoursElement, pad(hours));
      setValue(minutesElement, pad(minutes));
    };

    updateCountdown();
    window.setInterval(updateCountdown, 1000);
  };

  const heroTitle = initHeroTitle();
  initScrollAnimations();
  initSectionBackgrounds();
  initHeroMotion(heroTitle);
  initInteractiveControls();
  initFormStates();
  initCountdown();
})();
