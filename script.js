/* ============================================================
   FIC — Fédération Internationale de Canyonisme
   Interactions & enhancements (shared by all pages)
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Sticky header on scroll ---------- */
  var header = document.getElementById("siteHeader");

  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();
  }

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  var subToggle = document.querySelector(".nav__sub-toggle");
  var subMenu = subToggle ? document.getElementById(subToggle.getAttribute("aria-controls")) : null;
  var subItem = document.querySelector(".nav__item--sub");

  function closeSub() {
    if (!subMenu || !subToggle) return;
    subMenu.classList.remove("is-open");
    subToggle.classList.remove("is-open");
    subToggle.setAttribute("aria-expanded", "false");
  }

  function closeMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
    closeSub();
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  /* ---------- Tools submenu ---------- */
  if (subToggle && subMenu) {
    subToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isOpen = subMenu.classList.toggle("is-open");
      subToggle.classList.toggle("is-open", isOpen);
      subToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", function (e) {
      if (subItem && !subItem.contains(e.target)) closeSub();
    });

    /* Desktop already opens on hover; keep a click-opened menu from sticking */
    if (subItem && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      subItem.addEventListener("mouseleave", closeSub);
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeMenu();
    if (lightbox) closeLightbox();
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  var revealObserver = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  revealEls.forEach(function (el, i) {
    var delay = el.dataset.revealDelay || (i % 4) * 90;
    el.style.setProperty("--reveal-delay", delay + "ms");
    revealObserver.observe(el);
  });

  /* ---------- Active nav link (scroll spy, landing page only) ---------- */
  function hashOf(href) {
    if (href.charAt(0) === "#") return href.slice(1);
    var i = href.indexOf("#");
    return i === -1 ? null : href.slice(i + 1);
  }

  function isLandingPage() {
    var path = window.location.pathname;
    return path === "" || /\/$/.test(path) || /index\.html?$/.test(path);
  }

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav__menu a[href*="#"]')
  ).filter(function (link) {
    var href = link.getAttribute("href");
    if (href.charAt(0) === "#") return true;
    return isLandingPage() && href.indexOf("index.html#") === 0;
  });

  var spied = navLinks
    .map(function (link) {
      var el = document.getElementById(hashOf(link.getAttribute("href")));
      return el ? { link: link, el: el } : null;
    })
    .filter(Boolean);

  if (spied.length) {
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (l) {
            l.classList.remove("is-active");
          });
          var target = spied.find(function (s) {
            return s.el === entry.target;
          });
          if (target) target.link.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    spied.forEach(function (s) {
      spyObserver.observe(s.el);
    });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll(".stat__value");

  function animateCounter(el) {
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || "";
    var duration = 1400;
    var start = performance.now();

    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var counterObserver = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach(function (c) {
    counterObserver.observe(c);
  });

  /* ---------- Gallery lightbox ---------- */
  var galleryItems = Array.prototype.slice.call(
    document.querySelectorAll("#galleryGrid .gallery__item")
  );
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");
  var currentIndex = 0;

  function openLightbox(index) {
    if (!lightbox || !galleryItems.length) return;
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    var img = galleryItems[currentIndex].querySelector("img");
    var cap = galleryItems[currentIndex].querySelector("figcaption");
    var src = img.currentSrc || img.src;
    var highRes = src.split("?")[0] + "?fm=jpg&q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0";
    lightboxImg.src = highRes;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = cap ? cap.textContent : "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  if (lightbox && lightboxImg && lightboxCaption && lightboxClose) {
    galleryItems.forEach(function (item, i) {
      item.addEventListener("click", function () {
        openLightbox(i);
      });
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(i);
        }
      });
    });

    lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", function () {
        openLightbox(currentIndex - 1);
      });
    }
    if (lightboxNext) {
      lightboxNext.addEventListener("click", function () {
        openLightbox(currentIndex + 1);
      });
    }

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
      if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
    });
  }

  /* ---------- Member association filter ---------- */
  var filterButtons = document.querySelectorAll(".assoc__filter");
  var assocItems = document.querySelectorAll("#assocGrid .assoc");
  var assocEmpty = document.getElementById("assocEmpty");

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var region = btn.dataset.region;

      filterButtons.forEach(function (b) {
        b.classList.remove("is-active");
      });
      btn.classList.add("is-active");

      var visible = 0;
      assocItems.forEach(function (item) {
        var match = region === "all" || item.dataset.region === region;
        item.classList.toggle("is-hidden", !match);
        if (match) visible++;
      });

      if (assocEmpty) assocEmpty.hidden = visible > 0;
    });
  });

  /* ---------- Canyon rating tabs ---------- */
  var ratingTabs = Array.prototype.slice.call(
    document.querySelectorAll(".rating__tab")
  );

  function selectRatingTab(index) {
    ratingTabs.forEach(function (tab, i) {
      var active = i === index;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;

      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = !active;
    });
  }

  ratingTabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      selectRatingTab(i);
    });

    tab.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var next =
        e.key === "ArrowRight"
          ? (i + 1) % ratingTabs.length
          : (i - 1 + ratingTabs.length) % ratingTabs.length;
      ratingTabs[next].focus();
      selectRatingTab(next);
    });
  });
})();
