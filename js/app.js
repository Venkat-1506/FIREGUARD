/* ==========================================
   APP.JS — Core Shared Logic
   FireGuard — Fire Safety Equipment Register
   ========================================== */

(function () {
    "use strict";

    /* ------------------------------------------
       MOBILE NAV TOGGLE
       ------------------------------------------ */
    var menuBtn = document.getElementById("topbar-menu-btn");
    var topbarNav = document.getElementById("topbar-nav");

    if (menuBtn && topbarNav) {
        menuBtn.addEventListener("click", function () {
            topbarNav.classList.toggle("mobile-open");
        });
        document.addEventListener("click", function (e) {
            if (!topbarNav.contains(e.target) && !menuBtn.contains(e.target)) {
                topbarNav.classList.remove("mobile-open");
            }
        });
    }

    /* ------------------------------------------
       PROFILE DROPDOWN
       ------------------------------------------ */
    var profileBtn = document.getElementById("topbar-profile");
    var profileDropdown = document.getElementById("profile-dropdown");

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            var isVisible = profileDropdown.classList.contains("open");
            profileDropdown.classList.toggle("open");
            var notifDd = document.getElementById("notif-dropdown");
            if (notifDd && isVisible) notifDd.classList.remove("open");
        });
        document.addEventListener("click", function (e) {
            if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove("open");
            }
        });
    }

    /* ------------------------------------------
       LOGOUT
       ------------------------------------------ */
    function handleLogout() {
        sessionStorage.removeItem("fireguard_user");
        window.location.href = "index.html";
    }

    var dropdownLogout = document.getElementById("dropdown-logout");
    if (dropdownLogout) {
        dropdownLogout.addEventListener("click", handleLogout);
    }

    /* ------------------------------------------
       NOTIFICATION DROPDOWN
       ------------------------------------------ */
    var notifBtn = document.getElementById("topbar-notif-btn");
    var notifDd = document.getElementById("notif-dropdown");

    if (notifBtn && notifDd) {
        notifBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            notifDd.classList.toggle("open");
            if (profileDropdown) profileDropdown.classList.remove("open");
            if (notifDd.classList.contains("open")) renderNotifications();
        });
        document.addEventListener("click", function (e) {
            if (!notifDd.contains(e.target) && !notifBtn.contains(e.target)) {
                notifDd.classList.remove("open");
            }
        });
    }

    function renderNotifications() {
        var list = document.getElementById("notif-list");
        if (!list) return;
        if (typeof getAllEquipment !== "function") { list.innerHTML = '<div class="notif-empty"><p>Data not loaded.</p></div>'; return; }
        var allEquipment = getAllEquipment();
        var alerts = allEquipment.filter(function (e) {
            return e.status === "Overdue" || e.status === "Due Soon";
        });
        alerts.sort(function (a, b) { return new Date(a.nextDue) - new Date(b.nextDue); });

        if (!alerts.length) {
            list.innerHTML =
                '<div class="notif-empty">' +
                    '<img src="icons/success.svg" alt="" width="32" height="32">' +
                    '<p>All clear! No alerts.</p>' +
                '</div>';
            return;
        }

        var h = "";
        alerts.forEach(function (e) {
            var isOverdue = e.status === "Overdue";
            var icon = isOverdue ? "icons/overdue.svg" : "icons/warning.svg";
            var cls = isOverdue ? "notif-item-overdue" : "notif-item-due";
            var daysText = "";
            var diff = Math.ceil((new Date(e.nextDue) - new Date()) / (1000 * 60 * 60 * 24));
            if (isOverdue) {
                daysText = Math.abs(diff) + " day" + (Math.abs(diff) !== 1 ? "s" : "") + " overdue";
            } else {
                daysText = "Due in " + diff + " day" + (diff !== 1 ? "s" : "");
            }
            h += '<a href="edit-equipment.html?id=' + encodeURIComponent(e.id) + '" class="notif-item ' + cls + '">' +
                '<div class="notif-item-icon"><img src="' + icon + '" alt="" width="16" height="16"></div>' +
                '<div class="notif-item-info">' +
                    '<div class="notif-item-title">' + e.type + ' — ' + e.id + '</div>' +
                    '<div class="notif-item-meta">' + e.building + ', ' + e.floor + ' · ' + daysText + '</div>' +
                '</div>' +
            '</a>';
        });
        list.innerHTML = h;
    }

    function updateNotificationBadge() {
        if (typeof getAllEquipment !== "function") return;
        var allEquipment = getAllEquipment();
        var total = 0;
        allEquipment.forEach(function (item) {
            if (item.status === "Overdue" || item.status === "Due Soon") total++;
        });
        var badge = document.getElementById("notification-badge");
        if (badge) {
            badge.textContent = total;
            badge.style.display = total > 0 ? "flex" : "none";
        }
    }
    updateNotificationBadge();

    var markReadBtn = document.getElementById("notif-mark-read");
    if (markReadBtn) {
        markReadBtn.addEventListener("click", function () {
            var badge = document.getElementById("notification-badge");
            if (badge) badge.style.display = "none";
            FireGuard.showToast("All notifications marked as read.", "success");
        });
    }

    /* ------------------------------------------
       MODAL MANAGEMENT
       ------------------------------------------ */
    window.FireGuard = window.FireGuard || {};

    FireGuard.openModal = function (overlayId) {
        var overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    };

    FireGuard.closeModal = function (overlayId) {
        var overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.style.display = "none";
            document.body.style.overflow = "";
        }
    };

    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("modal-overlay")) {
            e.target.style.display = "none";
            document.body.style.overflow = "";
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            document.querySelectorAll(".modal-overlay").forEach(function (m) {
                m.style.display = "none";
            });
            document.body.style.overflow = "";
        }
    });

    /* ------------------------------------------
       PROFILE MODAL
       ------------------------------------------ */
    function loadProfile() {
        var user = null;
        try { user = JSON.parse(sessionStorage.getItem("fireguard_user")); } catch (e) {}
        if (!user) {
            user = { name: "Safety Officer", email: "officer@fireguard.com", role: "Fire Safety Inspector" };
        }
        setVal("profile-name-input", user.name || "");
        setVal("profile-email-input", user.email || "");
        setVal("profile-role-input", user.role || "Fire Safety Inspector");
        var initials = (user.name || "SO").split(" ").map(function(w){ return w[0]; }).join("").substring(0,2).toUpperCase();
        var avatarEl = document.getElementById("profile-modal-avatar");
        var nameEl = document.getElementById("profile-modal-name");
        var roleEl = document.getElementById("profile-modal-role");
        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = user.name || "Safety Officer";
        if (roleEl) roleEl.textContent = user.role || "Fire Safety Inspector";
    }

    function setVal(id, val) { var el = document.getElementById(id); if (el) el.value = val; }
    function getVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }

    var profileOpenBtn = document.getElementById("dropdown-profile");
    if (profileOpenBtn) {
        profileOpenBtn.addEventListener("click", function () {
            loadProfile();
            FireGuard.openModal("profile-modal-overlay");
            if (profileDropdown) profileDropdown.classList.remove("open");
        });
    }

    var profileCloseBtn = document.getElementById("profile-modal-close");
    var profileCancelBtn = document.getElementById("profile-cancel-btn");
    if (profileCloseBtn) profileCloseBtn.addEventListener("click", function () { FireGuard.closeModal("profile-modal-overlay"); });
    if (profileCancelBtn) profileCancelBtn.addEventListener("click", function () { FireGuard.closeModal("profile-modal-overlay"); });

    var profileSaveBtn = document.getElementById("profile-save-btn");
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener("click", function () {
            var name = getVal("profile-name-input");
            var email = getVal("profile-email-input");
            var role = getVal("profile-role-input");
            if (!name) { FireGuard.showToast("Please enter your name.", "error"); return; }
            var user = { name: name, email: email, role: role || "Fire Safety Inspector" };
            sessionStorage.setItem("fireguard_user", JSON.stringify(user));
            var topbarName = document.getElementById("topbar-username");
            if (topbarName) topbarName.textContent = name;
            var initials = name.split(" ").map(function(w){ return w[0]; }).join("").substring(0,2).toUpperCase();
            document.querySelectorAll(".avatar").forEach(function (a) { a.textContent = initials; });
            FireGuard.closeModal("profile-modal-overlay");
            FireGuard.showToast("Profile updated successfully.", "success");
        });
    }

    /* ------------------------------------------
       SETTINGS MODAL
       ------------------------------------------ */
    function loadSettings() {
        var s = {};
        try { s = JSON.parse(localStorage.getItem("fireguard_settings")) || {}; } catch (e) {}
        setChecked("setting-notifications", s.notifications !== false);
        setChecked("setting-compact", s.compact === true);
        setChecked("setting-autorefresh", s.autorefresh === true);
    }

    function setChecked(id, val) { var el = document.getElementById(id); if (el) el.checked = val; }
    function getChecked(id) { var el = document.getElementById(id); return el ? el.checked : false; }

    var settingsOpenBtn = document.getElementById("dropdown-settings");
    if (settingsOpenBtn) {
        settingsOpenBtn.addEventListener("click", function () {
            loadSettings();
            FireGuard.openModal("settings-modal-overlay");
            if (profileDropdown) profileDropdown.classList.remove("open");
        });
    }

    var settingsCloseBtn = document.getElementById("settings-modal-close");
    var settingsCancelBtn = document.getElementById("settings-cancel-btn");
    if (settingsCloseBtn) settingsCloseBtn.addEventListener("click", function () { FireGuard.closeModal("settings-modal-overlay"); });
    if (settingsCancelBtn) settingsCancelBtn.addEventListener("click", function () { FireGuard.closeModal("settings-modal-overlay"); });

    var settingsSaveBtn = document.getElementById("settings-save-btn");
    if (settingsSaveBtn) {
        settingsSaveBtn.addEventListener("click", function () {
            var s = {
                notifications: getChecked("setting-notifications"),
                compact: getChecked("setting-compact"),
                autorefresh: getChecked("setting-autorefresh")
            };
            localStorage.setItem("fireguard_settings", JSON.stringify(s));
            FireGuard.closeModal("settings-modal-overlay");
            FireGuard.showToast("Settings saved.", "success");
        });
    }

    /* ------------------------------------------
       TOAST NOTIFICATIONS
       ------------------------------------------ */
    FireGuard.showToast = function (message, type) {
        type = type || "success";
        var container = document.querySelector(".toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }
        var toast = document.createElement("div");
        toast.className = "toast toast-" + type;
        var iconSrc = "icons/success.svg";
        if (type === "error") iconSrc = "icons/overdue.svg";
        if (type === "warning") iconSrc = "icons/warning.svg";
        toast.innerHTML =
            '<img src="' + iconSrc + '" alt="" width="18" height="18">' +
            '<span class="toast-message">' + message + '</span>' +
            '<button class="toast-close" aria-label="Close"><img src="icons/delete.svg" alt="" width="14" height="14"></button>';
        container.appendChild(toast);
        toast.querySelector(".toast-close").addEventListener("click", function () {
            removeToast(toast);
        });
        setTimeout(function () { removeToast(toast); }, 4000);
    };

    function removeToast(toast) {
        if (!toast.parentNode) return;
        toast.style.animation = "toastOut 0.3s ease forwards";
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }

    /* ------------------------------------------
       DATE UTILITIES
       ------------------------------------------ */
    FireGuard.formatDate = function (dateStr) {
        var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        var parts = dateStr.split("-");
        return parseInt(parts[2], 10) + " " + months[parseInt(parts[1], 10) - 1] + " " + parts[0];
    };

    FireGuard.getGreeting = function () {
        var hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    FireGuard.getTodayDate = function () {
        var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        var t = new Date();
        return days[t.getDay()] + ", " + t.getDate() + " " + months[t.getMonth()] + " " + t.getFullYear();
    };

    FireGuard.getStatusBadge = function (status) {
        var cls = "badge-info";
        if (status === "Valid") cls = "badge-success";
        if (status === "Due Soon") cls = "badge-warning";
        if (status === "Overdue") cls = "badge-danger";
        return '<span class="badge ' + cls + '">' + status + '</span>';
    };

    FireGuard.getEquipmentImage = function (type) {
        return EQUIPMENT_IMAGES[type] || "images/equipment/fire-extinguisher.svg";
    };

    /* ------------------------------------------
       AUTH CHECK
       ------------------------------------------ */
    var protectedPages = ["dashboard.html", "equipment.html", "add-equipment.html", "edit-equipment.html"];
    var currentPage = window.location.pathname.split("/").pop();
    if (protectedPages.indexOf(currentPage) !== -1) {
        if (!sessionStorage.getItem("fireguard_user")) {
            window.location.href = "index.html";
        }
    }

    /* ------------------------------------------
       FILTER HELPERS
       ------------------------------------------ */
    FireGuard.populateBuildingFilter = function (selectId) {
        var select = document.getElementById(selectId);
        if (!select) return;
        BUILDINGS.forEach(function (b) {
            var opt = document.createElement("option");
            opt.value = b;
            opt.textContent = b;
            select.appendChild(opt);
        });
    };

    FireGuard.populateFloorFilter = function (selectId) {
        var select = document.getElementById(selectId);
        if (!select) return;
        FLOORS.forEach(function (f) {
            var opt = document.createElement("option");
            opt.value = f;
            opt.textContent = f;
            select.appendChild(opt);
        });
    };

})();
