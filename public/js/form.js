(() => {
    const modal = document.getElementById("contact-modal");
    if (!modal) return;

    const panel = modal.querySelector(".modal__panel");
    const openButtons = Array.from(document.querySelectorAll("[data-open-contact-modal]"));
    const closeButtons = Array.from(modal.querySelectorAll("[data-close-contact-modal]"));

    const form = document.getElementById("contact-form");
    const errorEl = document.getElementById("contact-form-error");

    let lastActiveEl = null;

    const focusableSelector = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "textarea:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    function getFocusable() {
        return Array.from(modal.querySelectorAll(focusableSelector)).filter((el) => !el.hasAttribute("disabled"));
    }

    function setError(msg) {
        if (!errorEl) return;
        if (!msg) {
            errorEl.hidden = true;
            errorEl.textContent = "";
            return;
        }
        errorEl.hidden = false;
        errorEl.textContent = msg;
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
    }

    function normalizePhone(value) {
        return String(value || "").replace(/[^\d+]/g, "").trim();
    }

    function readForm() {
        const name = form?.name?.value?.trim() || "";
        const email = form?.email?.value?.trim() || "";
        const phoneRaw = form?.phone?.value?.trim() || "";
        const message = form?.message?.value?.trim() || "";

        const emailOk = email ? isValidEmail(email) : false;
        const phone = normalizePhone(phoneRaw);
        const phoneOk = phone.length >= 8;

        return { name, email, phone, message, emailOk, phoneOk };
    }

    function buildMessage(data) {
        const lines = [
            `Hola Leo, soy ${data.name}.`,
            data.emailOk ? `Email: ${data.email}` : null,
            data.phoneOk ? `Teléfono: ${data.phone}` : null,
            `Mensaje: ${data.message}`,
        ].filter(Boolean);

        return lines.join("\n");
    }

    function validateCommon(data) {
        if (data.name.length < 3) {
            setError("Por favor escribe tu nombre (mínimo 3 caracteres).");
            form.name.focus();
            return false;
        }

        if (data.message.length < 10) {
            setError("Por favor escribe tu mensaje (mínimo 10 caracteres).");
            form.message.focus();
            return false;
        }

        if (!data.emailOk && !data.phoneOk) {
            setError("Completa al menos un email válido o un teléfono válido.");
            (form.email.value ? form.email : form.phone).focus();
            return false;
        }

        return true;
    }

    function openModal(triggerEl) {
        lastActiveEl = triggerEl || document.activeElement;
        modal.hidden = false;
        document.body.classList.add("is-modal-open");

        setError("");

        const first = modal.querySelector("#cf-name") || getFocusable()[0];
        first?.focus();

        window.addEventListener("keydown", onKeyDown);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove("is-modal-open");
        window.removeEventListener("keydown", onKeyDown);

        if (lastActiveEl && typeof lastActiveEl.focus === "function") {
            lastActiveEl.focus();
        }

        setError("");
    }

    function onKeyDown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            closeModal();
            return;
        }

        // Focus trap
        if (e.key === "Tab") {
            const focusable = getFocusable();
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    // Open
    openButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            openModal(btn);
        });
    });

    // Close
    closeButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            closeModal();
        });
    });

    // Prevent clicks inside panel from bubbling
    panel?.addEventListener("click", (e) => e.stopPropagation());

    // Actions inside modal
    modal.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-send]");
        if (!btn || !form) return;

        e.preventDefault();
        setError("");

        const data = readForm();
        if (!validateCommon(data)) return;

        const text = buildMessage(data);

        const mode = btn.getAttribute("data-send");
        const whatsapp = form.getAttribute("data-whatsapp-number") || "50662262628";
        const emailTo = form.getAttribute("data-email-to") || "alternativefocus4media@gmail.com";

        if (mode === "whatsapp") {
            if (!data.phoneOk) {
                setError("Para WhatsApp, ingresa un teléfono válido.");
                form.phone.focus();
                return;
            }
            const waUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
            window.open(waUrl, "_blank", "noopener,noreferrer");
            closeModal();
            form.reset();
            return;
        }

        if (mode === "email") {
            if (!data.emailOk) {
                setError("Para Email, ingresa un email válido.");
                form.email.focus();
                return;
            }
            const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(
                "Contacto desde leostock77"
            )}&body=${encodeURIComponent(text)}`;
            window.location.href = mailtoUrl;
            closeModal();
            form.reset();
            return;
        }
    });
})();
