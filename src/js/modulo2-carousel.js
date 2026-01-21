function initModulo2(root) {
    if (!root || root.dataset.m2Ready === "true") return;
    root.dataset.m2Ready = "true";

    var track = root.querySelector("[data-m2-track]");
    var dotsWrap = root.querySelector("[data-m2-dots]");
    var dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll("[data-m2-dot]")) : [];
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!track) return;

    var state = { animating: false };

    function getGapPx() {
        var gap = getComputedStyle(track).gap || "0px";
        return Number.parseFloat(gap) || 0;
    }

    function getStepPx() {
        var first = track.querySelector(".m2__tile");
        if (!first) return 0;
        return first.getBoundingClientRect().width + getGapPx();
    }

    function getTotal() {
        if (dots.length) return dots.length;
        return track.querySelectorAll(".m2__tile").length;
    }

    function getActiveIndex() {
        var tiles = Array.from(track.querySelectorAll(".m2__tile"));
        if (!tiles.length) return 0;
        var pos = window.innerWidth >= 768 ? 3 : 1;
        var el = tiles[Math.min(pos, tiles.length - 1)];
        var dataIndex = el && el.dataset && el.dataset.m2Index;
        return dataIndex ? Number(dataIndex) : 0;
    }

    function updateDots() {
        var idx = getActiveIndex();
        dots.forEach(function (btn, i) {
            var active = i === idx;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-current", active ? "true" : "false");
        });
    }

    function moveNext() {
        if (state.animating) return;
        state.animating = true;

        var step = getStepPx();
        if (!step) {
            state.animating = false;
            return;
        }

        function finish() {
            track.removeEventListener("transitionend", finish);
            track.style.transition = "none";
            track.appendChild(track.firstElementChild);
            track.style.transform = "translateX(0px)";
            void track.offsetHeight;
            state.animating = false;
            updateDots();
        }

        if (prefersReduced) {
            track.appendChild(track.firstElementChild);
            track.style.transition = "none";
            track.style.transform = "translateX(0px)";
            state.animating = false;
            updateDots();
            return;
        }

        track.style.transition = "transform 300ms ease-out";
        track.style.transform = "translateX(-" + step + "px)";
        track.addEventListener("transitionend", finish);
    }

    function movePrev() {
        if (state.animating) return;
        state.animating = true;

        var step = getStepPx();
        if (!step) {
            state.animating = false;
            return;
        }

        function finish() {
            track.removeEventListener("transitionend", finish);
            track.style.transition = "none";
            state.animating = false;
            updateDots();
        }

        track.style.transition = "none";
        track.insertBefore(track.lastElementChild, track.firstElementChild);
        track.style.transform = "translateX(-" + step + "px)";
        void track.offsetHeight;

        if (prefersReduced) {
            track.style.transform = "translateX(0px)";
            state.animating = false;
            updateDots();
            return;
        }

        track.style.transition = "transform 300ms ease-out";
        track.style.transform = "translateX(0px)";
        track.addEventListener("transitionend", finish);
    }

    function moveToIndex(target) {
        var current = getActiveIndex();
        if (target === current) return;

        var total = getTotal();
        if (!total) return;

        var forward = (target - current + total) % total;
        var backward = (current - target + total) % total;

        var dir = forward <= backward ? "next" : "prev";
        var steps = Math.min(forward, backward);

        function run() {
            if (steps <= 0) return;
            steps = steps - 1;

            if (dir === "next") {
                moveNext();
            } else {
                movePrev();
            }

            function wait() {
                if (!state.animating) {
                    run();
                } else {
                    requestAnimationFrame(wait);
                }
            }
            wait();
        }

        run();
    }

    dots.forEach(function (btn) {
        btn.addEventListener("click", function () {
            moveToIndex(Number(btn.dataset.m2Dot));
        });
    });

    var DRAG_THRESHOLD = 40;
    var startX = 0;
    var startY = 0;
    var dragging = false;
    var moved = false;
    var pointerId = null;

    root.addEventListener("click", function (e) {
        if (!moved) return;
        var link = e.target.closest("a");
        if (link) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    root.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (state.animating) return;

        pointerId = e.pointerId;
        root.setPointerCapture(pointerId);

        startX = e.clientX;
        startY = e.clientY;
        dragging = true;
        moved = false;
    });

    root.addEventListener("pointermove", function (e) {
        if (!dragging || e.pointerId !== pointerId) return;

        var dx = e.clientX - startX;
        var dy = e.clientY - startY;

        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
            moved = true;
        }
    });

    function endDrag(e) {
        if (!dragging || e.pointerId !== pointerId) return;

        var endX = e.clientX;
        var diff = startX - endX;

        dragging = false;

        if (Math.abs(diff) > DRAG_THRESHOLD) {
            if (diff > 0) {
                moveNext();
            } else {
                movePrev();
            }
        }

        window.setTimeout(function () {
            moved = false;
        }, 100);

        try {
            root.releasePointerCapture(pointerId);
        } catch (err) { }

        pointerId = null;
    }

    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);

    window.addEventListener("resize", updateDots);
    updateDots();
}

function bootModulo2() {
    var carousels = document.querySelectorAll("[data-m2]");
    for (var i = 0; i < carousels.length; i++) {
        initModulo2(carousels[i]);
    }
}

if (typeof window !== "undefined" && !window.__m2Booted) {
    window.__m2Booted = true;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootModulo2);
    } else {
        bootModulo2();
    }

    document.addEventListener("astro:after-swap", bootModulo2);
}
