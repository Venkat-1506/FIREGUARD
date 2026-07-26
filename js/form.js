/* ==========================================
   FORM.JS — Add/Edit Equipment Form Logic
   ========================================== */

(function () {
    "use strict";

    var isEditMode = window.location.pathname.indexOf("edit-equipment") !== -1;
    var form = document.getElementById(isEditMode ? "edit-equipment-form" : "add-equipment-form");
    if (!form) return;

    var equipIdInput = document.getElementById("equip-id");
    var equipTypeSelect = document.getElementById("equip-type");
    var equipBuildingSelect = document.getElementById("equip-building");
    var equipFloorSelect = document.getElementById("equip-floor");
    var equipInstallDate = document.getElementById("equip-install-date");
    var equipLastInspection = document.getElementById("equip-last-inspection");
    var equipInterval = document.getElementById("equip-interval");
    var equipRemarks = document.getElementById("equip-remarks");
    var previewImg = document.getElementById("form-preview-img");
    var previewHint = document.getElementById("form-preview-hint");

    /* ------------------------------------------
       POPULATE SELECTS FROM DATA
       ------------------------------------------ */
    function populateSelect(selectEl, items) {
        if (!selectEl) return;
        items.forEach(function (item) {
            var opt = document.createElement("option");
            opt.value = item;
            opt.textContent = item;
            selectEl.appendChild(opt);
        });
    }

    if (equipBuildingSelect && typeof BUILDINGS !== "undefined") {
        populateSelect(equipBuildingSelect, BUILDINGS);
    }
    if (equipFloorSelect && typeof FLOORS !== "undefined") {
        populateSelect(equipFloorSelect, FLOORS);
    }

    /* ------------------------------------------
       EQUIPMENT ID — auto-fill suggestion
       ------------------------------------------ */
    if (!isEditMode && equipIdInput && !equipIdInput.value) {
        equipIdInput.value = typeof getNextEquipmentId === "function" ? getNextEquipmentId() : "";
        equipIdInput.select();
    }

    /* ------------------------------------------
       IMAGE PREVIEW
       ------------------------------------------ */
    function updateImagePreview() {
        var type = equipTypeSelect ? equipTypeSelect.value : "";
        if (type && typeof EQUIPMENT_IMAGES !== "undefined" && EQUIPMENT_IMAGES[type]) {
            previewImg.src = EQUIPMENT_IMAGES[type];
            previewImg.alt = type;
            if (previewHint) {
                previewHint.textContent = type + " — image preview";
                previewHint.style.color = "";
                previewHint.style.fontStyle = "";
            }
        } else {
            previewImg.src = "images/equipment/fire-extinguisher.svg";
            previewImg.alt = "Equipment Preview";
            if (previewHint) {
                previewHint.textContent = "Select an equipment type to preview";
                previewHint.style.color = "";
                previewHint.style.fontStyle = "italic";
            }
        }
    }
    if (equipTypeSelect) equipTypeSelect.addEventListener("change", updateImagePreview);

    /* ------------------------------------------
       VALIDATION HELPERS
       ------------------------------------------ */
    function validateRequired(v, n) {
        if (!v || !v.trim()) return n + " is required";
        return "";
    }

    function validateSelect(v, n) {
        if (!v) return "Please select a " + n;
        return "";
    }

    function validateDate(v, n) {
        if (!v) return n + " is required";
        var d = new Date(v);
        if (isNaN(d.getTime())) return n + " is not a valid date";
        return "";
    }

    function validateDateOrder(installVal, inspectionVal) {
        if (!installVal || !inspectionVal) return "";
        var install = new Date(installVal);
        var inspection = new Date(inspectionVal);
        if (inspection < install) return "Inspection date cannot be before installation date";
        return "";
    }

    function validateFutureDate(v, n) {
        if (!v) return "";
        var d = new Date(v);
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d > today) return n + " cannot be in the future";
        return "";
    }

    function showError(id, msg) {
        var el = document.getElementById(id);
        var errEl = document.getElementById(id + "-error");
        var group = el ? el.closest(".form-group") : null;
        if (group && msg) group.classList.add("has-error");
        else if (group) group.classList.remove("has-error");
        if (errEl) errEl.textContent = msg || "";
    }

    function clearAllErrors() {
        form.querySelectorAll(".form-error").forEach(function (el) { el.textContent = ""; });
        form.querySelectorAll(".has-error").forEach(function (g) { g.classList.remove("has-error"); });
    }

    function isDuplicateId(value, excludeId) {
        var val = value.trim().toUpperCase();
        return DUMMY_EQUIPMENT.some(function (eq) {
            return eq.equipment_id === val && eq.equipment_id !== excludeId;
        });
    }

    function validateForm(excludeId) {
        var errors = 0;
        var idVal = equipIdInput ? equipIdInput.value : "";
        var idMsg = validateRequired(idVal, "Equipment ID");
        if (!idMsg && isDuplicateId(idVal, excludeId)) idMsg = "This Equipment ID already exists";
        if (!idMsg) {
            var idPattern = /^[A-Z]{2,4}-\d{2,4}$/i;
            if (!idPattern.test(idVal.trim())) idMsg = "ID format should be like FE-001";
        }

        var installMsg = validateDate(equipInstallDate ? equipInstallDate.value : "", "Installation date");
        if (!installMsg) installMsg = validateFutureDate(equipInstallDate.value, "Installation date");
        var inspectMsg = validateDate(equipLastInspection ? equipLastInspection.value : "", "Last inspection date");
        if (!inspectMsg) inspectMsg = validateFutureDate(equipLastInspection.value, "Last inspection date");
        if (!installMsg && !inspectMsg) inspectMsg = validateDateOrder(equipInstallDate.value, equipLastInspection.value);

        var checks = [
            ["equip-id", idMsg],
            ["equip-type", validateSelect(equipTypeSelect ? equipTypeSelect.value : "", "equipment type")],
            ["equip-building", validateSelect(equipBuildingSelect ? equipBuildingSelect.value : "", "building")],
            ["equip-floor", validateSelect(equipFloorSelect ? equipFloorSelect.value : "", "floor")],
            ["equip-install-date", installMsg],
            ["equip-last-inspection", inspectMsg],
            ["equip-interval", validateSelect(equipInterval ? equipInterval.value : "", "inspection interval")]
        ];
        checks.forEach(function (c) { showError(c[0], c[1]); if (c[1]) errors++; });
        return errors === 0;
    }

    /* ------------------------------------------
       FIELD-LEVEL VALIDATION
       ------------------------------------------ */
    var fieldsToValidate = [
        { id: "equip-id", fn: function (v) {
            var msg = validateRequired(v, "Equipment ID");
            if (msg) return msg;
            if (isDuplicateId(v, isEditMode ? (equipIdInput ? equipIdInput.defaultValue : "") : "")) return "This Equipment ID already exists";
            var idPattern = /^[A-Z]{2,4}-\d{2,4}$/i;
            if (!idPattern.test(v.trim())) return "ID format should be like FE-001";
            return "";
        }},
        { id: "equip-type", fn: function (v) { return validateSelect(v, "equipment type"); } },
        { id: "equip-building", fn: function (v) { return validateSelect(v, "building"); } },
        { id: "equip-floor", fn: function (v) { return validateSelect(v, "floor"); } },
        { id: "equip-install-date", fn: function (v) {
            var msg = validateDate(v, "Installation date");
            if (msg) return msg;
            return validateFutureDate(v, "Installation date");
        }},
        { id: "equip-last-inspection", fn: function (v) {
            var msg = validateDate(v, "Last inspection date");
            if (msg) return msg;
            msg = validateFutureDate(v, "Last inspection date");
            if (msg) return msg;
            if (equipInstallDate && equipInstallDate.value) return validateDateOrder(equipInstallDate.value, v);
            return "";
        }},
        { id: "equip-interval", fn: function (v) { return validateSelect(v, "inspection interval"); } }
    ];
    fieldsToValidate.forEach(function (field) {
        var el = document.getElementById(field.id);
        if (!el) return;
        el.addEventListener("blur", function () { showError(field.id, field.fn(this.value)); });
        el.addEventListener("input", function () { if (this.closest(".form-group").classList.contains("has-error")) showError(field.id, field.fn(this.value)); });
        el.addEventListener("change", function () { if (this.closest(".form-group").classList.contains("has-error")) showError(field.id, field.fn(this.value)); });
    });

    /* ------------------------------------------
       ADD MODE — SUBMIT
       ------------------------------------------ */
    if (!isEditMode) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!validateForm(null)) return;
            var newRecord = {
                record_id: typeof getNextRecordId === "function" ? getNextRecordId() : Date.now(),
                equipment_id: equipIdInput.value.trim().toUpperCase(),
                type: equipTypeSelect.value,
                building: equipBuildingSelect.value,
                floor: equipFloorSelect.value,
                install_date: equipInstallDate.value,
                last_inspection: equipLastInspection.value,
                inspection_interval: parseInt(equipInterval.value, 10),
                remarks: equipRemarks ? equipRemarks.value.trim() : ""
            };
            DUMMY_EQUIPMENT.push(newRecord);
            if (typeof saveEquipment === "function") saveEquipment(DUMMY_EQUIPMENT);
            if (typeof FireGuard !== "undefined" && FireGuard.showToast) {
                FireGuard.showToast("Equipment " + newRecord.equipment_id + " added successfully!", "success");
            }
            setTimeout(function () { window.location.href = "equipment.html"; }, 1200);
        });

        form.addEventListener("reset", function () {
            clearAllErrors();
            if (previewImg) previewImg.src = "images/equipment/fire-extinguisher.svg";
            if (previewHint) {
                previewHint.textContent = "Select an equipment type to preview";
                previewHint.style.fontStyle = "italic";
            }
            setTimeout(function () {
                if (equipIdInput) equipIdInput.value = typeof getNextEquipmentId === "function" ? getNextEquipmentId() : "";
            }, 10);
        });
    }

    /* ------------------------------------------
       EDIT MODE — PREFILL & SUBMIT
       ------------------------------------------ */
    if (isEditMode) {
        var urlParams = new URLSearchParams(window.location.search);
        var editId = urlParams.get("id");

        if (!editId) { showNotFound(); }
        else {
            var equipment = DUMMY_EQUIPMENT.find(function (eq) { return eq.equipment_id === editId; });
            if (!equipment) { showNotFound(); }
            else { prefillForm(equipment); updateImagePreview(); }
        }

        function showNotFound() {
            var fc = document.getElementById("edit-form-card");
            var nf = document.getElementById("edit-not-found");
            if (fc) fc.style.display = "none";
            if (nf) nf.style.display = "block";
        }
        function prefillForm(item) {
            if (equipIdInput) equipIdInput.value = item.equipment_id;
            if (equipTypeSelect) equipTypeSelect.value = item.type;
            if (equipBuildingSelect) equipBuildingSelect.value = item.building;
            if (equipFloorSelect) equipFloorSelect.value = item.floor;
            if (equipInstallDate) equipInstallDate.value = item.install_date;
            if (equipLastInspection) equipLastInspection.value = item.last_inspection;
            if (equipInterval) equipInterval.value = item.inspection_interval;
            if (equipRemarks) equipRemarks.value = item.remarks || "";
        }

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!validateForm(editId)) return;
            var idx = DUMMY_EQUIPMENT.findIndex(function (eq) { return eq.equipment_id === editId; });
            if (idx === -1) {
                if (typeof FireGuard !== "undefined" && FireGuard.showToast) FireGuard.showToast("Equipment not found.", "error");
                return;
            }
            DUMMY_EQUIPMENT[idx] = {
                record_id: DUMMY_EQUIPMENT[idx].record_id,
                equipment_id: equipIdInput.value.trim().toUpperCase(),
                type: equipTypeSelect.value,
                building: equipBuildingSelect.value,
                floor: equipFloorSelect.value,
                install_date: equipInstallDate.value,
                last_inspection: equipLastInspection.value,
                inspection_interval: parseInt(equipInterval.value, 10),
                remarks: equipRemarks ? equipRemarks.value.trim() : ""
            };
            if (typeof saveEquipment === "function") saveEquipment(DUMMY_EQUIPMENT);
            if (typeof FireGuard !== "undefined" && FireGuard.showToast) {
                FireGuard.showToast("Equipment " + DUMMY_EQUIPMENT[idx].equipment_id + " updated successfully!", "success");
            }
            setTimeout(function () { window.location.href = "equipment.html"; }, 1200);
        });
    }
})();
