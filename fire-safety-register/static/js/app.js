const API = "/api";
let allRecords = [];
let editingId = null;
let options = {};

document.addEventListener("DOMContentLoaded", () => {
    loadOptions();
    loadRecords();
    loadStats();

    document.getElementById("search-input").addEventListener("input", debounce(applyFilters, 300));
    document.getElementById("filter-type").addEventListener("change", applyFilters);
    document.getElementById("filter-building").addEventListener("change", applyFilters);
    document.getElementById("filter-floor").addEventListener("change", applyFilters);
    document.getElementById("filter-status").addEventListener("change", applyFilters);
    document.getElementById("btn-clear-filters").addEventListener("click", clearFilters);
    document.getElementById("btn-clear-filters2").addEventListener("click", clearFilters);

    document.getElementById("btn-add").addEventListener("click", openAddModal);
    document.getElementById("btn-add-empty").addEventListener("click", openAddModal);
    document.getElementById("btn-modal-close").addEventListener("click", closeModal);
    document.getElementById("btn-cancel").addEventListener("click", closeModal);
    document.getElementById("btn-retry").addEventListener("click", () => { loadRecords(); loadStats(); });

    document.getElementById("equipment-form").addEventListener("submit", handleSave);

    document.getElementById("modal-overlay").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    document.querySelectorAll("thead th[data-sort]").forEach((th) => {
        th.addEventListener("click", () => handleSort(th.dataset.sort));
    });
});

function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function loadOptions() {
    try {
        const res = await fetch(`${API}/options`);
        options = await res.json();
        populateSelect("filter-type", options.types);
        populateSelect("filter-building", options.buildings);
        populateSelect("filter-floor", options.floors);
        populateSelect("filter-status", options.statuses);
        populateSelect("field-type", options.types, "-- Select Type --");
        populateSelect("field-building", options.buildings, "-- Select Building --");
        populateSelect("field-floor", options.floors, "-- Select Floor --");
    } catch (e) {
        console.error("Failed to load options:", e);
    }
}

function populateSelect(id, items, placeholder) {
    const sel = document.getElementById(id);
    const current = sel.value;
    if (!placeholder) {
        sel.innerHTML = sel.querySelector("option")?.value === "" ? sel.innerHTML : '<option value="">All</option>';
        const firstOpt = sel.querySelector("option");
        if (firstOpt && firstOpt.value !== "") {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = id.startsWith("filter-") ? firstOpt.textContent : placeholder || "-- Select --";
            sel.insertBefore(opt, sel.firstChild);
        }
    }
    items.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        sel.appendChild(opt);
    });
    sel.value = current;
}

async function loadRecords() {
    showState("loading");
    try {
        const params = new URLSearchParams();
        const search = document.getElementById("search-input").value.trim();
        const type = document.getElementById("filter-type").value;
        const building = document.getElementById("filter-building").value;
        const floor = document.getElementById("filter-floor").value;
        const status = document.getElementById("filter-status").value;

        if (search) params.set("search", search);
        if (type) params.set("type", type);
        if (building) params.set("building", building);
        if (floor) params.set("floor", floor);
        if (status) params.set("status", status);

        const res = await fetch(`${API}/equipment?${params.toString()}`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        allRecords = await res.json();
        renderTable(allRecords);
    } catch (e) {
        showState("error", e.message);
    }
}

function applyFilters() {
    loadRecords();
}

function clearFilters() {
    document.getElementById("search-input").value = "";
    document.getElementById("filter-type").value = "";
    document.getElementById("filter-building").value = "";
    document.getElementById("filter-floor").value = "";
    document.getElementById("filter-status").value = "";
    loadRecords();
}

function showState(state, errorMsg) {
    document.getElementById("loading-state").style.display = state === "loading" ? "" : "none";
    document.getElementById("error-state").style.display = state === "error" ? "" : "none";
    document.getElementById("empty-state").style.display = "none";
    document.getElementById("records-container").style.display = "none";
    document.getElementById("no-filter-results").style.display = "none";

    if (state === "error" && errorMsg) {
        document.getElementById("error-message").textContent = `Error: ${errorMsg}`;
    }
}

function renderTable(records) {
    document.getElementById("loading-state").style.display = "none";
    document.getElementById("error-state").style.display = "none";

    const hasFilters = document.getElementById("search-input").value.trim() ||
        document.getElementById("filter-type").value ||
        document.getElementById("filter-building").value ||
        document.getElementById("filter-floor").value ||
        document.getElementById("filter-status").value;

    if (records.length === 0) {
        if (allRecords.length === 0 && !hasFilters) {
            document.getElementById("empty-state").style.display = "";
        } else if (hasFilters) {
            document.getElementById("no-filter-results").style.display = "";
        } else {
            document.getElementById("empty-state").style.display = "";
        }
        document.getElementById("records-container").style.display = "none";
        return;
    }

    document.getElementById("records-container").style.display = "";
    document.getElementById("empty-state").style.display = "none";
    document.getElementById("no-filter-results").style.display = "none";

    const tbody = document.getElementById("equipment-tbody");
    tbody.innerHTML = "";

    records.forEach((r) => {
        const tr = document.createElement("tr");
        const daysClass = r.days_remaining === null ? "days-none" :
            r.days_remaining < 0 ? "days-negative" :
            r.days_remaining <= 30 ? "days-warning" : "days-positive";

        const daysText = r.days_remaining === null ? "N/A" :
            r.days_remaining < 0 ? `${Math.abs(r.days_remaining)}d overdue` :
            `${r.days_remaining}d`;

        const statusClass = `status-${r.status.toLowerCase().replace(/\s+/g, "-")}`;
        const lastInsp = r.last_inspection || "N/A";
        const nextDue = r.next_due || "N/A";
        const remarks = r.remarks || "-";

        tr.innerHTML = `
            <td><strong>${esc(r.equipment_id)}</strong></td>
            <td>${esc(r.type)}</td>
            <td>${esc(r.building)}</td>
            <td>${esc(r.floor)}</td>
            <td>${esc(lastInsp)}</td>
            <td>${esc(nextDue)}</td>
            <td><span class="days-badge ${daysClass}">${daysText}</span></td>
            <td><span class="status-badge ${statusClass}">${esc(r.status)}</span></td>
            <td title="${esc(remarks)}">${esc(truncate(remarks, 40))}</td>
            <td class="actions-cell">
                <button class="action-btn edit" onclick="openEditModal(${r.record_id})">Edit</button>
                <button class="action-btn delete" onclick="handleDelete(${r.record_id}, '${esc(r.equipment_id)}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function esc(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function truncate(str, len) {
    return str && str.length > len ? str.substring(0, len) + "..." : str;
}

function openAddModal() {
    editingId = null;
    document.getElementById("modal-title").textContent = "Add Equipment Record";
    document.getElementById("btn-save").textContent = "Save";
    document.getElementById("field-equipment_id").disabled = false;
    clearForm();
    document.getElementById("modal-overlay").style.display = "flex";
}

function openEditModal(id) {
    editingId = id;
    document.getElementById("modal-title").textContent = "Edit Equipment Record";
    document.getElementById("btn-save").textContent = "Update";
    document.getElementById("field-equipment_id").disabled = true;

    const record = allRecords.find((r) => r.record_id === id);
    if (record) {
        document.getElementById("field-equipment_id").value = record.equipment_id;
        document.getElementById("field-type").value = record.type;
        document.getElementById("field-building").value = record.building;
        document.getElementById("field-floor").value = record.floor;
        document.getElementById("field-last_inspection").value = record.last_inspection || "";
        document.getElementById("field-remarks").value = record.remarks || "";
    }
    document.getElementById("modal-overlay").style.display = "flex";
}

function closeModal() {
    document.getElementById("modal-overlay").style.display = "none";
    clearForm();
    editingId = null;
}

function clearForm() {
    document.getElementById("equipment-form").reset();
    document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
}

function clearFieldErrors() {
    document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
}

async function handleSave(e) {
    e.preventDefault();
    clearFieldErrors();

    const data = {
        equipment_id: document.getElementById("field-equipment_id").value.trim(),
        type: document.getElementById("field-type").value,
        building: document.getElementById("field-building").value,
        floor: document.getElementById("field-floor").value,
        last_inspection: document.getElementById("field-last_inspection").value || null,
        remarks: document.getElementById("field-remarks").value.trim(),
    };

    let url, method;
    if (editingId) {
        url = `${API}/equipment/${editingId}`;
        method = "PUT";
    } else {
        url = `${API}/equipment`;
        method = "POST";
    }

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (!res.ok) {
            if (result.details) {
                result.details.forEach((err) => {
                    const field = err.split(" ")[0];
                    const errEl = document.getElementById(`err-${field}`);
                    if (errEl) errEl.textContent = err;
                });
            } else {
                showToast(result.error || "Save failed", "error");
            }
            return;
        }

        showToast(editingId ? "Record updated successfully" : "Record added successfully", "success");
        closeModal();
        loadRecords();
        loadStats();
    } catch (e) {
        showToast("Network error. Please try again.", "error");
    }
}

async function handleDelete(id, name) {
    if (!confirm(`Delete record ${name}? This cannot be undone.`)) return;

    try {
        const res = await fetch(`${API}/equipment/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const result = await res.json();
            showToast(result.error || "Delete failed", "error");
            return;
        }
        showToast("Record deleted", "success");
        loadRecords();
        loadStats();
    } catch (e) {
        showToast("Network error. Please try again.", "error");
    }
}

async function loadStats() {
    try {
        const res = await fetch(`${API}/stats`);
        const stats = await res.json();
        document.getElementById("stat-total").textContent = stats.total || 0;
        document.getElementById("stat-active").textContent = stats.by_status["Active"] || 0;
        document.getElementById("stat-overdue").textContent = stats.by_status["Overdue"] || 0;
        document.getElementById("stat-expired").textContent = stats.by_status["Expired"] || 0;
        document.getElementById("stat-maintenance").textContent = stats.by_status["Under Maintenance"] || 0;
    } catch (e) {
        console.error("Stats load failed:", e);
    }
}

let sortField = null;
let sortAsc = true;

function handleSort(field) {
    if (sortField === field) {
        sortAsc = !sortAsc;
    } else {
        sortField = field;
        sortAsc = true;
    }

    allRecords.sort((a, b) => {
        let va = a[field];
        let vb = b[field];
        if (va === null || va === undefined) va = sortAsc ? Infinity : -Infinity;
        if (vb === null || vb === undefined) vb = sortAsc ? Infinity : -Infinity;
        if (typeof va === "number" && typeof vb === "number") {
            return sortAsc ? va - vb : vb - va;
        }
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
    });

    renderTable(allRecords);
}

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
