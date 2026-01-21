// Module 2 — Infinite carousel (sin clones): reordena el DOM tras la transición
// - Mobile swipe
// - Dots
// - Prefers reduced motion
// - Compatible con Astro (re-init en astro:after-swap)

function initModulo2(root) {
    const track = root.querySelector("[data-m2-track]");
    const dotsWrap = root.querySelector("[data-m2-dots]");
    const dots = dotsWrap ? [...dotsWrap.querySelectorAll("[data-m2-dot]")] : [];
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!track) return;

    const state = { animating: false };

    const activePos = () => (window.innerWidth >= 768 ? 2 : 0); // desktop “centro” (3er tile), mobile 1er tile

    const getGapPx = () => {
        const gap = getComputedStyle(track).gap || "0px";
        return Number.parseFloat(gap) || 0;
    };

    const getStepPx = () => {
        const first = track.querySelector(".m2__tile");
        if (!first) return 0;
        return first.getBoundingClientRect().width + getGapPx();
    };

    const getTotal = () => {
        if (dots.length) return dots.length;
        return track.querySelectorAll(".m2__tile").length;
    };

    const getActiveIndex = () => {
        const tiles = [...track.querySelectorAll(".m2__tile")];
        const pos = Math.min(activePos(), Math.max(tiles.length - 1, 0));
        const el = tiles[pos] || tiles[0];
        return Number(el?.dataset?.m2Index ?? 0);
    };

    const updateDots = () => {
        const idx = getActiveIndex();
        dots.forEach((btn, i) => {
            const active = i === idx;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-current", active ? "true" : "false");
        });
    };

    const moveNext = () => {
        if (state.animating) return;
        state.animating = true;

        const step = getStepPx();
        if (!step) { state.animating = false; return; }

        track.style.transition = prefersReduced ? "none" : "transform 300ms ease-out";
        track.style.transform = `translateX(-${step}px)`;

        const finish = () => {
            track.removeEventListener("transitionend", finish);
            track.style.transition = "none";
            track.appendChild(track.firstElementChild);
            track.style.transform = "translateX(0px)";
            void track.offsetHeight;
            state.animating = false;
            updateDots();
        };

        if (prefersReduced) {
            track.appendChild(track.firstElementChild);
            track.style.transform = "translateX(0px)";
            state.animating = false;
            updateDots();
        } else {
            track.addEventListener("transitionend", finish);
        }
    };

    const movePrev = () => {
        if (state.animating) return;
        state.animating = true;

        const step = getStepPx();
        if (!step) { state.animating = false; return; }

        track.style.transition = "none";
        track.insertBefore(track.lastElementChild, track.firstElementChild);
        track.style.transform = `translateX(-${step}px)`;
        void track.offsetHeight;

        track.style.transition = prefersReduced ? "none" : "transform 300ms ease-out";
        track.style.transform = "translateX(0px)";

        const finish = () => {
            track.removeEventListener("transitionend", finish);
            track.style.transition = "none";
            state.animating = false;
            updateDots();
        };

        if (prefersReduced) {
            track.style.transform = "translateX(0px)";
            state.animating = false;
            updateDots();
        } else {
            track.addEventListener("transitionend", finish);
        }
    };

    const moveToIndex = (target) => {
        const current = getActiveIndex();
        if (target === current) return;

        const total = getTotal();
        if (!total) return;

        const forward = (target - current + total) % total;
        const backward = (current - target + total) % total;

        const dir = forward <= backward ? "next" : "prev";
        let steps = Math.min(forward, backward);

        const run = () => {
            if (steps <= 0) return;
            steps -= 1;
            dir === "next" ? moveNext() : movePrev();

            const wait = () => {
                if (!state.animating) run();
                else requestAnimationFrame(wait);
            };
            wait();
        };

        run();
    };

    // Dots
    dots.forEach((btn) => {
        btn.addEventListener("click", () => moveToIndex(Number(btn.dataset.m2Dot)));
    });

    // Swipe
    let startX = 0;
    root.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 40) diff > 0 ? moveNext() : movePrev();
    });

    // Teclado (opcional)
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") moveNext();
        if (e.key === "ArrowLeft") movePrev();
    });

    window.addEventListener("resize", updateDots);

    updateDots();
}

function boot() {
    document.querySelectorAll("[data-m2]").forEach(initModulo2);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}

document.addEventListener("astro:after-swap", boot);
