/* ==========================================
   EQUIPMENT.JS — Equipment List Page Logic
   ========================================== */

(function () {
    'use strict';

    var searchInput = document.getElementById('search-input');
    var filterType = document.getElementById('filter-type');
    var filterStatus = document.getElementById('filter-status');
    var filterBuilding = document.getElementById('filter-building');
    var filterFloor = document.getElementById('filter-floor');
    var sortBy = document.getElementById('sort-by');
    var clearFiltersBtn = document.getElementById('clear-filters');
    var viewGridBtn = document.getElementById('view-grid');
    var viewTableBtn = document.getElementById('view-table');
    var gridContainer = document.getElementById('eq-grid');
    var tableWrap = document.getElementById('eq-table-wrap');
    var tableBody = document.getElementById('equipment-table-body');
    var emptyState = document.getElementById('equipment-empty');
    var paginationInfo = document.getElementById('pagination-info');
    var paginationPrev = document.getElementById('pagination-prev');
    var paginationNext = document.getElementById('pagination-next');
    var paginationNums = document.getElementById('pagination-numbers');
    var equipmentCount = document.getElementById('equipment-count');
    var filterToggle = document.getElementById('filter-toggle');
    var filterPanel = document.getElementById('filter-panel');
    var filterCount = document.getElementById('filter-count');

    var allEquipment = [];
    var filteredEquipment = [];
    var currentView = 'grid';
    var currentPage = 1;
    var perPage = 100;

    function init() {
        try {
            if (typeof getAllEquipment !== 'function') {
                console.error('[FireGuard] getAllEquipment is not defined. data.js may not have loaded.');
                showInitError('Data module failed to load. Please refresh the page.');
                return;
            }
            allEquipment = getAllEquipment();
            console.log('[FireGuard] Loaded ' + allEquipment.length + ' equipment items');
            if (!allEquipment.length) {
                console.warn('[FireGuard] Equipment array is empty. Check data.js SEED_DATA.');
            }
            populateFilters();
            readUrlParams();
            applyFilters();
            bindEvents();
        } catch (err) {
            console.error('[FireGuard] Equipment init error:', err);
            showInitError('Failed to load equipment data: ' + err.message);
        }
    }

    function showInitError(msg) {
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableWrap) tableWrap.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.innerHTML =
                '<img src="images/illustrations/empty-state.svg" alt="" width="180">' +
                '<h3>Something Went Wrong</h3>' +
                '<p>' + esc(msg) + '</p>' +
                '<button class="btn btn-primary" onclick="location.reload()">Reload Page</button>';
        }
        if (equipmentCount) equipmentCount.textContent = '0 items registered';
        if (paginationInfo) paginationInfo.textContent = 'Error loading data';
    }

    function populateFilters() {
        var buildings = {}, floors = {};
        allEquipment.forEach(function (e) {
            if (e.building) buildings[e.building] = true;
            if (e.floor) floors[e.floor] = true;
        });
        Object.keys(buildings).sort().forEach(function (b) {
            var opt = document.createElement('option');
            opt.value = b; opt.textContent = b;
            filterBuilding.appendChild(opt);
        });
        Object.keys(floors).sort().forEach(function (f) {
            var opt = document.createElement('option');
            opt.value = f; opt.textContent = f;
            filterFloor.appendChild(opt);
        });
    }

    function applyFilters() {
        var search = (searchInput.value || '').toLowerCase().trim();
        var type = filterType.value, status = filterStatus.value;
        var building = filterBuilding.value, floor = filterFloor.value;
        filteredEquipment = allEquipment.filter(function (e) {
            if (type && e.type !== type) return false;
            if (status && e.status !== status) return false;
            if (building && e.building !== building) return false;
            if (floor && e.floor !== floor) return false;
            if (search) {
                var hay = [e.id, e.type, e.building, e.floor, e.remarks].join(' ').toLowerCase();
                if (hay.indexOf(search) === -1) return false;
            }
            return true;
        });
        sortEquipment();
        currentPage = 1;
        updateClearBtn();
        render();
    }

    function sortEquipment() {
        var val = sortBy.value;
        filteredEquipment.sort(function (a, b) {
            if (val === 'newest') return new Date(b.lastInspection) - new Date(a.lastInspection);
            if (val === 'oldest') return new Date(a.lastInspection) - new Date(b.lastInspection);
            if (val === 'name-asc') return (a.type || '').localeCompare(b.type || '');
            if (val === 'name-desc') return (b.type || '').localeCompare(a.type || '');
            if (val === 'building') return (a.building || '').localeCompare(b.building || '');
            return 0;
        });
    }

    function updateClearBtn() {
        var has = searchInput.value || filterType.value || filterStatus.value || filterBuilding.value || filterFloor.value;
        clearFiltersBtn.style.display = has ? 'inline-flex' : 'none';
        updateFilterCount();
    }

    function updateFilterCount() {
        var count = 0;
        if (filterType.value) count++;
        if (filterStatus.value) count++;
        if (filterBuilding.value) count++;
        if (filterFloor.value) count++;
        if (count > 0) {
            filterCount.textContent = count;
            filterCount.style.display = 'flex';
            filterToggle.classList.add('active');
        } else {
            filterCount.style.display = 'none';
            filterToggle.classList.remove('active');
        }
    }

    function toggleFilterPanel() {
        filterPanel.classList.toggle('open');
        filterToggle.classList.toggle('active');
    }

    function render() {
        var total = filteredEquipment.length;
        var totalPages = Math.max(1, Math.ceil(total / perPage));
        if (currentPage > totalPages) currentPage = totalPages;
        var start = (currentPage - 1) * perPage;
        var end = Math.min(start + perPage, total);
        var pageData = filteredEquipment.slice(start, end);

        if (equipmentCount) equipmentCount.textContent = total + ' item' + (total !== 1 ? 's' : '') + ' registered';

        if (total === 0) {
            gridContainer.style.display = 'none';
            tableWrap.style.display = 'none';
            emptyState.style.display = 'flex';
            paginationInfo.textContent = 'No results';
            paginationNums.innerHTML = '';
            return;
        }
        emptyState.style.display = 'none';
        if (currentView === 'grid') {
            gridContainer.style.display = 'grid';
            tableWrap.style.display = 'none';
            renderGrid(pageData);
        } else {
            gridContainer.style.display = 'none';
            tableWrap.style.display = 'block';
            renderTable(pageData);
        }
        renderPagination(total, totalPages);
    }

    function renderGrid(data) {
        var html = '';
        data.forEach(function (e) {
            var bcls = e.status === 'Valid' ? 'eq-badge-valid' : e.status === 'Due Soon' ? 'eq-badge-due' : 'eq-badge-overdue';
            html += '<div class="eq-card" data-id="' + e.id + '">' +
                '<img class="eq-card-img" src="' + e.image + '" alt="' + esc(e.type) + '" loading="lazy">' +
                '<div class="eq-card-body">' +
                    '<div class="eq-card-type">' + esc(e.type) + '</div>' +
                    '<div class="eq-card-name">' + esc(e.type) + '</div>' +
                    '<div class="eq-card-id">' + esc(e.id) + '</div>' +
                    '<div class="eq-card-meta">' +
                        '<div class="eq-card-meta-row"><img src="icons/building.svg" alt=""> <strong>' + esc(e.building) + '</strong> &middot; ' + esc(e.floor) + '</div>' +
                        '<div class="eq-card-meta-row"><img src="icons/calendar.svg" alt=""> Last: ' + fmtDate(e.lastInspection) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="eq-card-footer">' +
                    '<span class="eq-badge ' + bcls + '">' + esc(e.status) + '</span>' +
                    '<div class="eq-card-actions">' +
                        '<button class="eq-card-action eq-card-action-view" title="View" data-id="' + e.id + '"><img src="icons/view.svg" alt=""></button>' +
                        '<a href="edit-equipment.html?id=' + e.id + '" class="eq-card-action" title="Edit"><img src="icons/edit.svg" alt=""></a>' +
                        '<button class="eq-card-action eq-card-action-delete" title="Delete" data-id="' + e.id + '"><img src="icons/delete.svg" alt=""></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });
        gridContainer.innerHTML = html;
    }

    function renderTable(data) {
        var html = '';
        data.forEach(function (e) {
            var bcls = e.status === 'Valid' ? 'eq-badge-valid' : e.status === 'Due Soon' ? 'eq-badge-due' : 'eq-badge-overdue';
            html += '<tr>' +
                '<td class="eq-table-id">' + esc(e.id) + '</td>' +
                '<td>' + esc(e.type) + '</td>' +
                '<td>' + esc(e.building) + '</td>' +
                '<td>' + esc(e.floor) + '</td>' +
                '<td>' + fmtDate(e.lastInspection) + '</td>' +
                '<td>' + fmtDate(e.nextDue) + '</td>' +
                '<td><span class="eq-badge ' + bcls + '">' + esc(e.status) + '</span></td>' +
                '<td>' + esc(e.remarks || '—') + '</td>' +
                '<td class="eq-table-actions">' +
                    '<button class="eq-card-action eq-card-action-view" title="View" data-id="' + e.id + '"><img src="icons/view.svg" alt=""></button>' +
                    '<a href="edit-equipment.html?id=' + e.id + '" class="eq-card-action" title="Edit"><img src="icons/edit.svg" alt=""></a>' +
                    '<button class="eq-card-action eq-card-action-delete" title="Delete" data-id="' + e.id + '"><img src="icons/delete.svg" alt=""></button>' +
                '</td></tr>';
        });
        tableBody.innerHTML = html;
    }

    function renderPagination(total, totalPages) {
        paginationInfo.textContent = 'Showing ' + ((currentPage - 1) * perPage + 1) + '-' + Math.min(currentPage * perPage, total) + ' of ' + total;
        paginationPrev.disabled = currentPage <= 1;
        paginationNext.disabled = currentPage >= totalPages;
        var nums = '';
        for (var i = 1; i <= totalPages; i++) {
            if (totalPages <= 7 || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                nums += '<button class="eq-page-num' + (i === currentPage ? ' eq-page-num-active' : '') + '" data-page="' + i + '">' + i + '</button>';
            } else if (Math.abs(i - currentPage) === 2) {
                nums += '<span style="padding:0 4px;color:var(--text-muted);">...</span>';
            }
        }
        paginationNums.innerHTML = nums;
    }

    function switchView(view) {
        currentView = view;
        viewGridBtn.classList.toggle('active', view === 'grid');
        viewTableBtn.classList.toggle('active', view === 'table');
        render();
    }

    var viewModalOverlay = document.getElementById('view-modal-overlay');
    var viewModalBody = document.getElementById('view-modal-body');
    var viewModalEdit = document.getElementById('view-modal-edit-btn');
    var deleteModalOverlay = document.getElementById('delete-modal-overlay');
    var deleteModalName = document.getElementById('delete-modal-equipment-name');
    var pendingDeleteId = null;

    function openViewModal(id) {
        var eq = allEquipment.find(function (e) { return e.id === id; });
        if (!eq) return;
        var bcls = eq.status === 'Valid' ? 'eq-badge-valid' : eq.status === 'Due Soon' ? 'eq-badge-due' : 'eq-badge-overdue';
        var rows = [
            ['Equipment ID', eq.id], ['Type', eq.type], ['Building', eq.building], ['Floor', eq.floor],
            ['Install Date', fmtDate(eq.installDate)], ['Last Inspection', fmtDate(eq.lastInspection)],
            ['Next Due', fmtDate(eq.nextDue)], ['Interval', eq.interval + ' months'],
            ['Status', '<span class="eq-badge ' + bcls + '">' + esc(eq.status) + '</span>'],
            ['Remarks', eq.remarks || '—']
        ];
        var html = '';
        rows.forEach(function (r) {
            html += '<div class="view-row"><div class="view-label">' + r[0] + '</div><div class="view-value">' + r[1] + '</div></div>';
        });
        viewModalBody.innerHTML = html;
        viewModalEdit.href = 'edit-equipment.html?id=' + eq.id;
        viewModalOverlay.style.display = 'flex';
    }

    function openDeleteModal(id) {
        var eq = allEquipment.find(function (e) { return e.id === id; });
        if (!eq) return;
        pendingDeleteId = id;
        deleteModalName.textContent = eq.type + ' (' + eq.id + ')';
        deleteModalOverlay.style.display = 'flex';
    }

    function closeAllModals() {
        viewModalOverlay.style.display = 'none';
        deleteModalOverlay.style.display = 'none';
        pendingDeleteId = null;
    }

    function confirmDelete() {
        if (!pendingDeleteId) return;
        allEquipment = allEquipment.filter(function (e) { return e.id !== pendingDeleteId; });
        DUMMY_EQUIPMENT = DUMMY_EQUIPMENT.filter(function (e) { return e.equipment_id !== pendingDeleteId; });
        if (typeof saveEquipment === "function") saveEquipment(DUMMY_EQUIPMENT);
        closeAllModals();
        applyFilters();
        FireGuard.showToast('Equipment deleted successfully', 'success');
    }

    function readUrlParams() {
        var params = new URLSearchParams(window.location.search);
        var typeParam = params.get('type');
        var statusParam = params.get('status');
        if (typeParam) filterType.value = typeParam;
        if (statusParam) filterStatus.value = statusParam;
    }

    function bindEvents() {
        searchInput.addEventListener('input', debounce(applyFilters, 250));
        filterType.addEventListener('change', applyFilters);
        filterStatus.addEventListener('change', applyFilters);
        filterBuilding.addEventListener('change', applyFilters);
        filterFloor.addEventListener('change', applyFilters);
        sortBy.addEventListener('change', applyFilters);
        clearFiltersBtn.addEventListener('click', clearAllFilters);
        viewGridBtn.addEventListener('click', function () { switchView('grid'); });
        viewTableBtn.addEventListener('click', function () { switchView('table'); });
        filterToggle.addEventListener('click', toggleFilterPanel);
        paginationPrev.addEventListener('click', function () { if (currentPage > 1) { currentPage--; render(); } });
        paginationNext.addEventListener('click', function () {
            var tp = Math.ceil(filteredEquipment.length / perPage);
            if (currentPage < tp) { currentPage++; render(); }
        });
        paginationNums.addEventListener('click', function (ev) {
            var btn = ev.target.closest('[data-page]');
            if (btn) { currentPage = parseInt(btn.dataset.page); render(); }
        });

        document.addEventListener('click', function (ev) {
            var delBtn = ev.target.closest('.eq-card-action-delete');
            if (delBtn) { openDeleteModal(delBtn.dataset.id); return; }
            var card = ev.target.closest('.eq-card');
            if (card && !ev.target.closest('.eq-card-actions')) { openViewModal(card.dataset.id); return; }
            var viewBtn = ev.target.closest('.eq-card-action-view');
            if (viewBtn) { openViewModal(viewBtn.dataset.id); return; }
        });

        document.getElementById('view-modal-close').addEventListener('click', closeAllModals);
        document.getElementById('view-modal-close-btn').addEventListener('click', closeAllModals);
        document.getElementById('delete-modal-close').addEventListener('click', closeAllModals);
        document.getElementById('delete-cancel-btn').addEventListener('click', closeAllModals);
        document.getElementById('delete-confirm-btn').addEventListener('click', confirmDelete);
        viewModalOverlay.addEventListener('click', function (ev) { if (ev.target === viewModalOverlay) closeAllModals(); });
        deleteModalOverlay.addEventListener('click', function (ev) { if (ev.target === deleteModalOverlay) closeAllModals(); });
        document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeAllModals(); });
    }

    function clearAllFilters() {
        searchInput.value = '';
        filterType.value = '';
        filterStatus.value = '';
        filterBuilding.value = '';
        filterFloor.value = '';
        sortBy.value = 'newest';
        filterPanel.classList.remove('open');
        applyFilters();
    }

    function esc(str) { if (!str) return ''; var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function fmtDate(s) { if (!s) return '—'; try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return s; } }
    function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

    document.addEventListener('DOMContentLoaded', init);
})();
