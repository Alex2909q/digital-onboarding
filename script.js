document.addEventListener('DOMContentLoaded', () => {
    // --- Intersection Observer для скрол-анімацій ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-fade, .scroll-slide-left, .scroll-slide-right').forEach(el => {
        scrollObserver.observe(el);
    });

    // --- Акордеон (FAQ) ---
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');

            // Закрити всі інші в цьому акордеоні
            const parentAccordion = item.closest('.accordion');
            parentAccordion.querySelectorAll('.accordion-item').forEach(i => {
                i.classList.remove('active');
                const titleEl = i.querySelector('.accordion-title');
                if (titleEl) {
                    titleEl.textContent = titleEl.textContent.replace('[−]', '[+]');
                }
            });

            if (!isActive) {
                item.classList.add('active');
                const titleEl = item.querySelector('.accordion-title');
                if (titleEl) {
                    titleEl.textContent = titleEl.textContent.replace('[+]', '[−]');
                }
            }
        });
    });

    // --- Анімація лічильників метрик ---
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const type = el.dataset.animType;
                animateStatValue(el, type);
                statObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-value-anim').forEach(el => {
        statObserver.observe(el);
    });

    function animateStatValue(el, type) {
        const duration = 1500;
        const start = performance.now();

        const configs = {
            days: { from: 0, to: 7, suffix: '', unit: 'днів', prefix: 'до ' },
            emails: { from: 0, to: 5, suffix: '', unit: 'листів', prefix: '3–' },
            manager: { from: 0, to: 1, suffix: '', unit: 'менеджер', prefix: '' },
            ghost: { from: 0, to: 0, suffix: '', unit: '', prefix: '???' },
            complaints: { from: 0, to: 1, suffix: '', unit: '', prefix: 'ТОП ' }
        };

        const config = configs[type];
        if (!config) return;

        if (type === 'ghost') {
            el.innerHTML = `👻 ???`;
            return;
        }

        function run(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = Math.round(config.from + (config.to - config.from) * eased);

            el.innerHTML = `${config.prefix}${current} <span>${config.unit}</span>`;

            if (progress < 1) {
                requestAnimationFrame(run);
            }
        }
        requestAnimationFrame(run);
    }

    // --- Lightbox для перегляду скріншотів ---
    window.lightboxImages = {};
    window.currentGroup = null;
    window.currentIndex = 0;

    window.openLightbox = function(group, index) {
        const images = lightboxImages[group];
        if (!images || !images[index]) return;

        currentGroup = group;
        currentIndex = index;

        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightbox-img');
        const caption = document.getElementById('lightbox-caption');

        img.src = images[index].src;
        caption.textContent = images[index].alt || '';
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closeLightbox = function() {
        document.getElementById('lightbox').style.display = 'none';
        document.body.style.overflow = '';
    };

    window.changeLightboxImage = function(dir) {
        const images = lightboxImages[currentGroup];
        if (!images) return;

        currentIndex += dir;
        if (currentIndex < 0) currentIndex = images.length - 1;
        if (currentIndex >= images.length) currentIndex = 0;

        document.getElementById('lightbox-img').src = images[currentIndex].src;
        document.getElementById('lightbox-caption').textContent = images[currentIndex].alt || '';
    };

    // Close lightbox on click outside the image
    document.getElementById('lightbox')?.addEventListener('click', e => {
        if (e.target.id === 'lightbox' || e.target.classList.contains('lightbox')) {
            closeLightbox();
        }
    });

    // Register galleries
    document.querySelectorAll('.scenario-gallery').forEach(gallery => {
        const group = gallery.dataset.group;
        if (!group) return;
        const imgs = gallery.querySelectorAll('.gallery-thumb');
        lightboxImages[group] = [];
        imgs.forEach((img, i) => {
            lightboxImages[group].push({ src: img.src, alt: img.alt });
            img.addEventListener('click', () => openLightbox(group, i));
        });
    });

    // Close lightbox on Escape key
    document.addEventListener('keydown', e => {
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') changeLightboxImage(1);
            if (e.key === 'ArrowLeft') changeLightboxImage(-1);
        }
    });

    // --- Smooth Scroll for buttons ---
    document.querySelectorAll('[data-scroll-to]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.querySelector(btn.dataset.scrollTo);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
