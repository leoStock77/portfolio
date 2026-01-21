// carouselModulo2.js
// Carrusel infinito simple: aritmética módulo, sin clones

class InfiniteCarousel {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        this.track = this.container.querySelector('[data-carousel-track]');
        this.dots = document.querySelectorAll('[data-carousel-dots] .carousel-dot');
        this.tiles = this.container.querySelectorAll('.carousel-tile');

        this.totalTiles = this.tiles.length || 7;
        this.currentIndex = 0;

        if (!this.track || this.totalTiles === 0) return;

        this.init();
    }

    init() {
        // Click en dots
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToTile(index));
        });

        // Swipe detection (mobile)
        let touchStartX = 0;
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.container.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                // Threshold: 50px
                diff > 0 ? this.next() : this.prev();
            }
        });

        // Keyboard navigation (flecha derecha/izquierda)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        });

        // Render inicial
        this.render();
    }

    goToTile(index) {
        this.currentIndex = index % this.totalTiles;
        this.render();
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.totalTiles;
        this.render();
    }

    prev() {
        this.currentIndex =
            (this.currentIndex - 1 + this.totalTiles) % this.totalTiles;
        this.render();
    }

    render() {
        // Desplazamiento: cada tile ocupa 100% del ancho
        const offset = this.currentIndex * -100;
        this.track.style.transform = `translateX(${offset}%)`;

        // Actualizar dots
        this.dots.forEach((dot, index) => {
            const isActive = index === this.currentIndex;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    }
}

// Inicializar cuando DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new InfiniteCarousel('.carousel-container');
    });
} else {
    new InfiniteCarousel('.carousel-container');
}

// Re-inicializar si Astro hace view transitions
document.addEventListener('astro:after-swap', () => {
    new InfiniteCarousel('.carousel-container');
});
