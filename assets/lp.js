document.addEventListener("DOMContentLoaded", function () {
  const mobileButton = document.querySelector("[data-mobile-menu-button]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  if (mobileButton && mobileMenu) {
    mobileButton.addEventListener("click", function () {
      const isOpen = !mobileMenu.classList.contains("hidden");
      mobileMenu.classList.toggle("hidden", isOpen);
      mobileButton.setAttribute("aria-expanded", String(!isOpen));
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.add("hidden");
        mobileButton.setAttribute("aria-expanded", "false");
      });
    });
  }

  const headings = document.querySelectorAll("main h2, main h3");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.25 }
    );

    headings.forEach(function (heading) {
      heading.classList.add("reveal-heading");
      observer.observe(heading);
    });
  }

  const filterButtons = document.querySelectorAll("[data-filter]");
  const sampleCards = document.querySelectorAll("[data-category]");

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const filter = button.getAttribute("data-filter");
      filterButtons.forEach(function (item) {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      sampleCards.forEach(function (card) {
        card.hidden = filter !== "all" && card.getAttribute("data-category") !== filter;
      });
    });
  });

  const modal = document.querySelector("[data-image-modal]");
  const modalImage = document.querySelector("[data-modal-image]");
  const modalClose = document.querySelector("[data-modal-close]");
  let lastFocusedElement = null;
  let inertBackground = [];
  let previousBodyOverflow = "";

  function closeModal() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    inertBackground.forEach(function (element) {
      element.removeAttribute("inert");
    });
    inertBackground = [];
    document.body.style.overflow = previousBodyOverflow;
    if (lastFocusedElement && lastFocusedElement.isConnected) {
      lastFocusedElement.focus({ preventScroll: true });
    }
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("inert", "");
  }

  document.querySelectorAll("[data-sample-image]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!modal || !modalImage || !modalClose || modal.classList.contains("is-open")) return;
      const image = button.querySelector("img");
      if (!image) return;
      lastFocusedElement = button;
      modalImage.src = image.getAttribute("data-full-image") || image.src;
      modalImage.alt = image.alt;
      modal.removeAttribute("inert");
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      modalClose.focus({ preventScroll: true });
      // This dialog is a direct child of body. Preserve any existing inert state.
      inertBackground = Array.from(document.body.children).filter(function (element) {
        return element !== modal && !element.hasAttribute("inert") &&
          !["SCRIPT", "STYLE", "LINK"].includes(element.tagName);
      });
      inertBackground.forEach(function (element) {
        element.setAttribute("inert", "");
      });
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (!modal || !modal.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    } else if (event.key === "Tab") {
      const focusable = Array.from(modal.querySelectorAll(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )).filter(function (element) {
        return element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest("[inert]");
      });
      const first = focusable[0] || modalClose;
      const last = focusable[focusable.length - 1] || modalClose;
      if (!modal.contains(document.activeElement) ||
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }
  });

  document.addEventListener("focusin", function (event) {
    if (modal && modal.classList.contains("is-open") && !modal.contains(event.target)) {
      modalClose.focus({ preventScroll: true });
    }
  });

  document.querySelectorAll("[data-current-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });
  const backToTopButton = document.createElement("button");
  backToTopButton.type = "button";
  backToTopButton.className = "back-to-top";
  backToTopButton.setAttribute("data-back-to-top", "");
  backToTopButton.setAttribute("aria-label", "ページ上部へ戻る");
  backToTopButton.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(backToTopButton);

  function toggleBackToTopButton() {
    backToTopButton.classList.toggle("is-visible", window.scrollY > 500);
  }

  backToTopButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", toggleBackToTopButton, { passive: true });
  toggleBackToTopButton();
});
