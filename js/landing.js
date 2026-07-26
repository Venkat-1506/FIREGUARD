/* ==========================================
   LANDING.JS — Landing Page Interactivity
   ========================================== */

(function () {
    "use strict";

    var header = document.getElementById("lg-header");
    function handleScroll() {
        if (!header) return;
        header.classList.toggle("scrolled", window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    var menuToggle = document.getElementById("lg-menu-toggle");
    var nav = document.getElementById("lg-nav");
    if (menuToggle && nav) {
        menuToggle.addEventListener("click", function () {
            nav.classList.toggle("lg-nav-open");
        });
        nav.querySelectorAll(".lg-nav-link").forEach(function (link) {
            link.addEventListener("click", function () {
                nav.classList.remove("lg-nav-open");
            });
        });
        document.addEventListener("click", function (e) {
            if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
                nav.classList.remove("lg-nav-open");
            }
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (e) {
            var targetId = this.getAttribute("href");
            if (targetId === "#") return;
            var targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                var offset = targetEl.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: offset, behavior: "smooth" });
            }
        });
    });

    var user = sessionStorage.getItem("fireguard_user");
    if (user) {
        document.querySelectorAll("[data-open-login]").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                window.location.href = "dashboard.html";
            });
        });
    }

    var modal = document.getElementById("login-modal");
    var closeBtn = document.getElementById("login-modal-close");

    function openLoginModal(e) {
        if (e) e.preventDefault();
        if (user) {
            window.location.href = "dashboard.html";
            return;
        }
        if (modal) {
            modal.classList.add("login-modal-open");
            document.body.style.overflow = "hidden";
            var firstInput = modal.querySelector("input[type='text']");
            if (firstInput) setTimeout(function () { firstInput.focus(); }, 200);
        }
    }

    function closeLoginModal() {
        if (modal) {
            modal.classList.remove("login-modal-open");
            document.body.style.overflow = "";
        }
    }

    document.querySelectorAll("[data-open-login]").forEach(function (btn) {
        btn.addEventListener("click", openLoginModal);
    });

    if (closeBtn) closeBtn.addEventListener("click", closeLoginModal);

    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) closeLoginModal();
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLoginModal();
    });

    window.closeLoginModal = closeLoginModal;
})();
