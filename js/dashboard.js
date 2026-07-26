/* ==========================================
   DASHBOARD.JS — Dashboard Page Logic
   ========================================== */

(function () {
    "use strict";

    var allEquipment = [];
    try {
        if (typeof getAllEquipment !== 'function') {
            console.error('[FireGuard] getAllEquipment is not defined. data.js may not have loaded.');
        } else {
            allEquipment = getAllEquipment();
            console.log('[FireGuard] Dashboard loaded ' + allEquipment.length + ' equipment items');
        }
    } catch (err) {
        console.error('[FireGuard] Failed to load equipment data:', err);
    }
    var currentUser = null;
    try { currentUser = JSON.parse(sessionStorage.getItem("fireguard_user")); } catch (e) {}

    var greetingEl = document.getElementById("dashboard-greeting");
    var dateEl = document.getElementById("dashboard-date");
    var userEl = document.getElementById("topbar-username");
    if (greetingEl) greetingEl.textContent = FireGuard.getGreeting();
    if (dateEl) dateEl.textContent = FireGuard.getTodayDate();
    if (userEl && currentUser) userEl.textContent = currentUser.name || "Safety Officer";

    function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

    function countStatuses(list) {
        var total = list.length, valid = 0, due = 0, over = 0;
        list.forEach(function (e) {
            if (e.status === "Valid") valid++;
            else if (e.status === "Due Soon") due++;
            else if (e.status === "Overdue") over++;
        });
        return { total: total, valid: valid, due: due, over: over };
    }

    /* ---------- Status Ring ---------- */
    function renderRing() {
        var ring = document.getElementById("status-ring");
        if (!ring) return;
        var c = countStatuses(allEquipment);

        set("ring-total", c.total);
        set("ring-valid", c.valid);
        set("ring-due", c.due);
        set("ring-overdue", c.over);

        if (c.total === 0) {
            ring.style.background = "var(--bg-hover)";
            return;
        }

        var vDeg = (c.valid / c.total * 360).toFixed(1);
        var dDeg = (c.due / c.total * 360).toFixed(1);
        var oDeg = (c.over / c.total * 360).toFixed(1);
        var vEnd = parseFloat(vDeg);
        var dEnd = vEnd + parseFloat(dDeg);

        var style = getComputedStyle(document.documentElement);
        var green  = style.getPropertyValue("--success").trim() || "#22c55e";
        var orange = style.getPropertyValue("--warning").trim() || "#f59e0b";
        var red    = style.getPropertyValue("--danger").trim()  || "#ef4444";
        var bg     = style.getPropertyValue("--bg-hover").trim() || "#f1f5f9";

        ring.style.background =
            "conic-gradient(" +
                green  + " 0deg "    + vDeg   + "deg, " +
                orange + " " + vDeg  + "deg " + dEnd   + "deg, " +
                red    + " " + dEnd  + "deg 360deg" +
            ")";
    }
    renderRing();

    /* ---------- Quick Stats (per type) ---------- */
    function renderQuickStats() {
        var map = {
            "Fire Extinguisher": "q-ext",
            "Smoke Detector":    "q-det",
            "Fire Alarm Panel":  "q-alarm",
            "Fire Hose Reel":    "q-hose",
            "Sprinkler System":  "q-spr",
            "Emergency Light":   "q-light"
        };
        Object.keys(map).forEach(function (type) {
            var count = allEquipment.filter(function (e) { return e.type === type; }).length;
            set(map[type], count);
        });
    }
    renderQuickStats();

    /* ---------- Status Bar ---------- */
    function renderStatusBar() {
        var bar = document.getElementById("status-bar-track");
        if (!bar) return;
        var c = countStatuses(allEquipment);
        if (c.total === 0) {
            bar.innerHTML = '<div class="status-bar-empty">No equipment registered</div>';
            return;
        }
        var vPct = (c.valid / c.total * 100).toFixed(1);
        var dPct = (c.due / c.total * 100).toFixed(1);
        var oPct = (c.over / c.total * 100).toFixed(1);
        bar.innerHTML =
            '<div class="status-bar-seg status-bar-green" style="width:' + vPct + '%" title="Valid: ' + c.valid + '"></div>' +
            '<div class="status-bar-seg status-bar-orange" style="width:' + dPct + '%" title="Due Soon: ' + c.due + '"></div>' +
            '<div class="status-bar-seg status-bar-red" style="width:' + oPct + '%" title="Overdue: ' + c.over + '"></div>';
    }
    renderStatusBar();

    /* ---------- Equipment by Type ---------- */
    function renderCategories() {
        var box = document.getElementById("dashboard-categories");
        if (!box) return;
        var types = [
            { type: "Fire Extinguisher", img: "images/equipment/fire-extinguisher.svg" },
            { type: "Smoke Detector",     img: "images/equipment/smoke-detector.svg" },
            { type: "Fire Alarm Panel",   img: "images/equipment/fire-alarm-panel.svg" },
            { type: "Fire Hose Reel",     img: "images/equipment/hose-reel.svg" },
            { type: "Sprinkler System",   img: "images/equipment/sprinkler.svg" },
            { type: "Emergency Light",    img: "images/equipment/emergency-light.svg" }
        ];
        var h = "";
        types.forEach(function (t) {
            var items = allEquipment.filter(function (e) { return e.type === t.type; });
            var c = countStatuses(items);
            var vPct = c.total ? (c.valid / c.total * 100) : 0;
            var dPct = c.total ? (c.due / c.total * 100) : 0;
            var oPct = c.total ? (c.over / c.total * 100) : 0;
            h += '<a href="equipment.html?type=' + encodeURIComponent(t.type) + '" class="cat-row">' +
                '<div class="cat-row-icon"><img src="' + t.img + '" alt=""></div>' +
                '<div class="cat-row-info">' +
                    '<div class="cat-row-name">' + t.type + '</div>' +
                    '<div class="cat-row-meta">' + c.total + ' unit' + (c.total !== 1 ? 's' : '') + '</div>' +
                '</div>' +
                (c.total > 0 ?
                    '<div class="cat-row-bar">' +
                        (c.valid ? '<span class="bar-ok" style="width:' + vPct + '%"></span>' : '') +
                        (c.due ? '<span class="bar-warn" style="width:' + dPct + '%"></span>' : '') +
                        (c.over ? '<span class="bar-bad" style="width:' + oPct + '%"></span>' : '') +
                    '</div>' : '') +
            '</a>';
        });
        box.innerHTML = h;
    }
    renderCategories();

    /* ---------- Overdue Alerts (top 5) ---------- */
    function renderOverdue() {
        var box = document.getElementById("dashboard-overdue");
        var badge = document.getElementById("overdue-count-badge");
        if (!box) return;
        var list = allEquipment.filter(function (e) { return e.status === "Overdue"; });
        list.sort(function (a, b) { return new Date(a.nextDue) - new Date(b.nextDue); });

        if (badge) {
            badge.textContent = list.length ? list.length + ' total' : '';
            badge.style.display = list.length ? 'inline-flex' : 'none';
        }

        if (!list.length) {
            box.innerHTML =
                '<div class="od-empty">' +
                    '<div class="od-empty-icon">' +
                        '<img src="icons/success.svg" alt="" width="24" height="24">' +
                    '</div>' +
                    '<h4>All Clear</h4>' +
                    '<p>No overdue items right now.</p>' +
                '</div>';
            return;
        }

        var show = list.slice(0, 5);
        var h = "";
        show.forEach(function (e) {
            h += '<div class="od-row">' +
                '<div class="od-severity"></div>' +
                '<div class="od-img"><img src="' + e.image + '" alt=""></div>' +
                '<div class="od-info">' +
                    '<div class="od-name">' + e.type + '</div>' +
                    '<div class="od-meta"><img src="icons/building.svg" alt="" width="12" height="12"> ' + e.building + ', ' + e.floor + ' &middot; <span class="od-tag">' + e.id + '</span></div>' +
                '</div>' +
                '<div class="od-actions">' +
                    '<button class="od-btn od-view" data-id="' + e.id + '" title="View"><img src="icons/view.svg" alt="" width="14" height="14"></button>' +
                    '<button class="od-btn od-edit" data-id="' + e.id + '" title="Edit"><img src="icons/edit.svg" alt="" width="14" height="14"></button>' +
                '</div>' +
            '</div>';
        });
        if (list.length > 5) {
            h += '<div class="od-more"><a href="equipment.html?status=Overdue">View ' + (list.length - 5) + ' more &rarr;</a></div>';
        }
        box.innerHTML = h;

        box.querySelectorAll(".od-view").forEach(function (b) {
            b.addEventListener("click", function () { openView(this.getAttribute("data-id")); });
        });
        box.querySelectorAll(".od-edit").forEach(function (b) {
            b.addEventListener("click", function () { window.location.href = "edit-equipment.html?id=" + this.getAttribute("data-id"); });
        });
    }
    renderOverdue();

    /* ---------- View Modal ---------- */
    function openView(id) {
        var item = allEquipment.find(function (e) { return e.id === id; });
        if (!item) return;
        var body = document.getElementById("view-modal-body");
        var editBtn = document.getElementById("view-modal-edit-btn");
        if (body) {
            body.innerHTML = fld("Equipment ID", item.id) + fld("Type", item.type) +
                fld("Building", item.building) + fld("Floor", item.floor) +
                fld("Installation", FireGuard.formatDate(item.installDate)) +
                fld("Last Inspection", FireGuard.formatDate(item.lastInspection)) +
                fld("Next Due", FireGuard.formatDate(item.nextDue)) +
                fld("Interval", item.interval + " months") +
                fld("Status", "", item.status) +
                fld("Remarks", item.remarks, null, true);
        }
        if (editBtn) editBtn.href = "edit-equipment.html?id=" + item.id;
        FireGuard.openModal("view-modal-overlay");
    }
    function fld(label, val, badge, full) {
        var cls = full ? " style='flex:1'" : "";
        var v = badge ? FireGuard.getStatusBadge(badge) : val;
        return '<div class="view-row"><div class="view-label">' + label + '</div><div class="view-value"' + cls + '>' + v + '</div></div>';
    }

    var vc = document.getElementById("view-modal-close");
    var vb = document.getElementById("view-modal-close-btn");
    if (vc) vc.addEventListener("click", function () { FireGuard.closeModal("view-modal-overlay"); });
    if (vb) vb.addEventListener("click", function () { FireGuard.closeModal("view-modal-overlay"); });

    /* ---------- Delete Modal ---------- */
    var delId = null;
    document.addEventListener("click", function (e) {
        var btn = e.target.closest(".table-action-delete");
        if (!btn) return;
        e.preventDefault();
        delId = btn.getAttribute("data-id");
        var item = allEquipment.find(function (eq) { return eq.id === delId; });
        var nm = document.getElementById("delete-modal-equipment-name");
        if (nm && item) nm.textContent = item.id + " — " + item.type + " (" + item.building + ")";
        FireGuard.openModal("delete-modal-overlay");
    });

    var dc = document.getElementById("delete-cancel-btn");
    var dcl = document.getElementById("delete-modal-close");
    var dcf = document.getElementById("delete-confirm-btn");
    if (dc) dc.addEventListener("click", function () { FireGuard.closeModal("delete-modal-overlay"); delId = null; });
    if (dcl) dcl.addEventListener("click", function () { FireGuard.closeModal("delete-modal-overlay"); delId = null; });
    if (dcf) dcf.addEventListener("click", function () {
        if (!delId) return;
        var idx = DUMMY_EQUIPMENT.findIndex(function (e) { return e.equipment_id === delId; });
        if (idx !== -1) DUMMY_EQUIPMENT.splice(idx, 1);
        if (typeof saveEquipment === "function") saveEquipment(DUMMY_EQUIPMENT);
        FireGuard.closeModal("delete-modal-overlay");
        FireGuard.showToast("Equipment " + delId + " deleted.", "success");
        allEquipment = getAllEquipment();
        renderRing();
        renderQuickStats();
        renderStatusBar();
        renderCategories();
        renderOverdue();
        delId = null;
    });

    /* ---------- Reset ---------- */
    var resetBtn = document.getElementById("reset-data-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            if (typeof resetToSeedData === "function") {
                resetToSeedData();
                allEquipment = getAllEquipment();
                renderRing();
                renderQuickStats();
                renderStatusBar();
                renderCategories();
                renderOverdue();
                FireGuard.showToast("Data reset to original demo dataset.", "success");
            }
        });
    }
})();
