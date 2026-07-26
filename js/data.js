/* ==========================================
   DATA.JS — Equipment Data Layer
   FireGuard — Fire Safety Equipment Register

   FIELD DOCUMENTATION (per SIH 2026 assessment):
   ───────────────────────────────────────────────
   record_id          : Unique auto-increment integer. Internal primary key.
   equipment_id       : Human-readable Equipment ID (e.g., FE-001). Shown to users.
   type               : Equipment type. One of: Fire Extinguisher, Smoke Detector,
                        Fire Alarm Panel, Fire Hose Reel, Sprinkler System, Emergency Light.
   building           : Building name. One of: Main Building, Admin Block, Laboratory Wing,
                        Auditorium, Hostel Block, Workshop.
   floor              : Floor location. One of: Basement, Ground Floor, 1st–5th Floor, Rooftop.
   install_date       : ISO date (YYYY-MM-DD) when the equipment was installed.
   last_inspection    : ISO date (YYYY-MM-DD) of the most recent inspection.
   inspection_interval: Inspection interval in months (3, 6, 12, or 24).
   remarks            : Free-text notes. May be empty or contain typos (realistic data).

   DERIVED VALUES (calculated, not stored):
   ────────────────────────────────────────
   next_due   : last_inspection + inspection_interval months.
                Calculated by calculateNextDue().
   status     : "Overdue"   if next_due < today.
                "Due Soon"  if next_due is within 30 days of today.
                "Valid"     otherwise.
                Calculated by calculateStatus().

   SEED DATA includes intentional awkward cases:
   - Record with empty remarks (EL-003, record 17)
   - Record with unusually old install date (FE-002 installed 2018, record 2)
   - Record with very old install date (FE-009 installed 2016, record 34)
   - Duplicate-ish names (multiple "Fire Extinguisher" in Main Building)
   - A record significantly overdue (FE-005, record 20 — 14+ months overdue)
   - A record with 24-month inspection interval (none — max is 12 months per fire code)
   - Records spanning all 6 buildings and 8 floor levels
   - Records with various inspection intervals: 3, 6, and 12 months
   ========================================== */

var EQUIPMENT_IMAGES = {
    "Fire Extinguisher": "images/equipment/fire-extinguisher.svg",
    "Smoke Detector": "images/equipment/smoke-detector.svg",
    "Fire Alarm Panel": "images/equipment/fire-alarm-panel.svg",
    "Fire Hose Reel": "images/equipment/hose-reel.svg",
    "Sprinkler System": "images/equipment/sprinkler.svg",
    "Emergency Light": "images/equipment/emergency-light.svg"
};

var BUILDINGS = [
    "Main Building",
    "Admin Block",
    "Laboratory Wing",
    "Auditorium",
    "Hostel Block",
    "Workshop"
];

var FLOORS = [
    "Basement",
    "Ground Floor",
    "1st Floor",
    "2nd Floor",
    "3rd Floor",
    "4th Floor",
    "5th Floor",
    "Rooftop"
];

var SEED_DATA = [
    { record_id: 1,  equipment_id: "FE-001",  type: "Fire Extinguisher",  building: "Main Building",    floor: "Ground Floor", install_date: "2023-03-15", last_inspection: "2026-01-10", inspection_interval: 6,  remarks: "Pressure gauge within normal range. No visible damage." },
    { record_id: 2,  equipment_id: "FE-002",  type: "Fire Extinguisher",  building: "Main Building",    floor: "2nd Floor",     install_date: "2018-08-20", last_inspection: "2025-12-05", inspection_interval: 6,  remarks: "Slight corrosion on handle. Needs replacement soon." },
    { record_id: 3,  equipment_id: "SD-001",  type: "Smoke Detector",     building: "Main Building",    floor: "3rd Floor",     install_date: "2023-06-10", last_inspection: "2026-03-20", inspection_interval: 6,  remarks: "All sensors tested and functioning properly." },
    { record_id: 4,  equipment_id: "SD-002",  type: "Smoke Detector",     building: "Laboratory Wing",  floor: "1st Floor",     install_date: "2024-01-08", last_inspection: "2025-09-15", inspection_interval: 6,  remarks: "Battery replacement needed. Low battery indicator active." },
    { record_id: 5,  equipment_id: "FAP-001", type: "Fire Alarm Panel",   building: "Main Building",    floor: "Ground Floor",  install_date: "2022-05-22", last_inspection: "2026-02-28", inspection_interval: 12, remarks: "Panel functioning correctly. All zone indicators normal." },
    { record_id: 6,  equipment_id: "FHR-001", type: "Fire Hose Reel",     building: "Auditorium",       floor: "Ground Floor",  install_date: "2023-09-12", last_inspection: "2026-04-10", inspection_interval: 6,  remarks: "Hose condition good. Water pressure adequate during test." },
    { record_id: 7,  equipment_id: "FHR-002", type: "Fire Hose Reel",     building: "Workshop",         floor: "Ground Floor",  install_date: "2023-02-18", last_inspection: "2025-08-22", inspection_interval: 6,  remarks: "Minor leak at coupling. Maintenance team notified." },
    { record_id: 8,  equipment_id: "SP-001",  type: "Sprinkler System",   building: "Main Building",    floor: "1st Floor",     install_date: "2022-11-30", last_inspection: "2026-05-18", inspection_interval: 12, remarks: "All sprinkler heads clear. Flow test passed." },
    { record_id: 9,  equipment_id: "SP-002",  type: "Sprinkler System",   building: "Hostel Block",     floor: "3rd Floor",     install_date: "2023-04-25", last_inspection: "2025-10-12", inspection_interval: 12, remarks: "Two heads showing slight discoloration. Cleaning scheduled." },
    { record_id: 10, equipment_id: "EL-001",  type: "Emergency Light",    building: "Main Building",    floor: "Basement",      install_date: "2023-07-14", last_inspection: "2026-06-01", inspection_interval: 6,  remarks: "Backup battery tested for 90 minutes — passed." },
    { record_id: 11, equipment_id: "EL-002",  type: "Emergency Light",    building: "Auditorium",       floor: "2nd Floor",     install_date: "2024-02-28", last_inspection: "2025-11-20", inspection_interval: 6,  remarks: "One unit flickering. Lamp replacement required." },
    { record_id: 12, equipment_id: "FE-003",  type: "Fire Extinguisher",  building: "Admin Block",      floor: "Ground Floor",  install_date: "2024-05-10", last_inspection: "2026-06-15", inspection_interval: 6,  remarks: "Recently serviced. All parameters within specification." },
    { record_id: 13, equipment_id: "SD-003",  type: "Smoke Detector",     building: "Workshop",         floor: "2nd Floor",     install_date: "2023-08-05", last_inspection: "2026-02-10", inspection_interval: 3,  remarks: "Sensitivity test passed. No false alarms recorded." },
    { record_id: 14, equipment_id: "FAP-002", type: "Fire Alarm Panel",   building: "Laboratory Wing",  floor: "Ground Floor",  install_date: "2023-01-20", last_inspection: "2025-07-15", inspection_interval: 12, remarks: "Software update available. Schedule upgrade during maintenance window." },
    { record_id: 15, equipment_id: "FE-004",  type: "Fire Extinguisher",  building: "Hostel Block",     floor: "4th Floor",     install_date: "2022-12-01", last_inspection: "2026-07-10", inspection_interval: 6,  remarks: "Passed all checks. Expiry tag updated." },
    { record_id: 16, equipment_id: "SP-003",  type: "Sprinkler System",   building: "Admin Block",      floor: "2nd Floor",     install_date: "2023-10-15", last_inspection: "2025-06-20", inspection_interval: 12, remarks: "Inspection overdue. Water supply valve checked manually." },
    { record_id: 17, equipment_id: "EL-003",  type: "Emergency Light",    building: "Laboratory Wing",  floor: "3rd Floor",     install_date: "2024-03-12", last_inspection: "2026-05-25", inspection_interval: 6,  remarks: "" },
    { record_id: 18, equipment_id: "FHR-003", type: "Fire Hose Reel",     building: "Main Building",    floor: "1st Floor",     install_date: "2023-11-08", last_inspection: "2026-03-05", inspection_interval: 6,  remarks: "Reel mechanism operates smoothly. Nozzle intact." },
    { record_id: 19, equipment_id: "SD-004",  type: "Smoke Detector",     building: "Hostel Block",     floor: "2nd Floor",     install_date: "2024-06-20", last_inspection: "2026-01-30", inspection_interval: 3,  remarks: "Recently recalibrated. Accuracy verified." },
    { record_id: 20, equipment_id: "FE-005",  type: "Fire Extinguisher",  building: "Auditorium",       floor: "1st Floor",     install_date: "2023-05-18", last_inspection: "2025-05-10", inspection_interval: 6,  remarks: "Inspection significantly overdue. Requires immediate attention." },
    { record_id: 21, equipment_id: "FE-006",  type: "Fire Extinguisher",  building: "Workshop",         floor: "1st Floor",     install_date: "2021-06-10", last_inspection: "2026-04-22", inspection_interval: 6,  remarks: "Unit serviced. Pin and tamper seal intact." },
    { record_id: 22, equipment_id: "FE-007",  type: "Fire Extinguisher",  building: "Hostel Block",     floor: "1st Floor",     install_date: "2019-11-03", last_inspection: "2025-09-30", inspection_interval: 6,  remarks: "Body shows minor dents. Functional test passed." },
    { record_id: 23, equipment_id: "SD-005",  type: "Smoke Detector",     building: "Auditorium",       floor: "3rd Floor",     install_date: "2024-04-18", last_inspection: "2026-07-15", inspection_interval: 6,  remarks: "Photo-electric sensor clean. Test button verified." },
    { record_id: 24, equipment_id: "SD-006",  type: "Smoke Detector",     building: "Admin Block",      floor: "3rd Floor",     install_date: "2023-09-25", last_inspection: "2026-06-28", inspection_interval: 3,  remarks: "High-sensitivity unit. Monthly test required per code." },
    { record_id: 25, equipment_id: "FAP-003", type: "Fire Alarm Panel",   building: "Main Building",    floor: "Ground Floor",  install_date: "2020-03-14", last_inspection: "2026-03-14", inspection_interval: 12, remarks: "Annual service completed. Firmware v3.2.1 installed." },
    { record_id: 26, equipment_id: "FHR-004", type: "Fire Hose Reel",     building: "Laboratory Wing",  floor: "Ground Floor",  install_date: "2023-07-20", last_inspection: "2026-01-20", inspection_interval: 6,  remarks: "Hose rubber coating peeling near nozzle. Monitor closely." },
    { record_id: 27, equipment_id: "FHR-005", type: "Fire Hose Reel",     building: "Hostel Block",     floor: "Ground Floor",  install_date: "2022-08-15", last_inspection: "2025-08-15", inspection_interval: 12, remarks: "Annual check passed. No corrosion on coupling." },
    { record_id: 28, equipment_id: "SP-004",  type: "Sprinkler System",   building: "Auditorium",       floor: "Rooftop",       install_date: "2021-12-01", last_inspection: "2025-12-01", inspection_interval: 12, remarks: "Rooftop tank level adequate. Valve exercised." },
    { record_id: 29, equipment_id: "SP-005",  type: "Sprinkler System",   building: "Workshop",         floor: "1st Floor",     install_date: "2024-02-10", last_inspection: "2026-02-10", inspection_interval: 12, remarks: "Newly installed system. First annual inspection passed." },
    { record_id: 30, equipment_id: "EL-004",  type: "Emergency Light",    building: "Workshop",         floor: "Basement",      install_date: "2023-05-22", last_inspection: "2026-05-22", inspection_interval: 12, remarks: "Basement unit. Battery holds charge for 2 hours." },
    { record_id: 31, equipment_id: "EL-005",  type: "Emergency Light",    building: "Hostel Block",     floor: "5th Floor",     install_date: "2024-08-01", last_inspection: "2026-02-01", inspection_interval: 6,  remarks: "Corridor light. Lens cracked — replacement ordered." },
    { record_id: 32, equipment_id: "FE-008",  type: "Fire Extinguisher",  building: "Laboratory Wing",  floor: "2nd Floor",     install_date: "2024-09-12", last_inspection: "2026-07-12", inspection_interval: 6,  remarks: "CO2 type for electrical room. Weight within limits." },
    { record_id: 33, equipment_id: "SD-007",  type: "Smoke Detector",     building: "Main Building",    floor: "5th Floor",     install_date: "2022-04-05", last_inspection: "2026-01-05", inspection_interval: 6,  remarks: "Duct detector in HVAC return. Airflow test passed." },
    { record_id: 34, equipment_id: "FE-009",  type: "Fire Extinguisher",  building: "Admin Block",      floor: "4th Floor",     install_date: "2016-02-28", last_inspection: "2025-02-28", inspection_interval: 12, remarks: "Very old unit. Body inspection required before next use." },
    { record_id: 35, equipment_id: "FAP-004", type: "Fire Alarm Panel",   building: "Hostel Block",     floor: "Ground Floor",  install_date: "2023-06-15", last_inspection: "2026-06-15", inspection_interval: 12, remarks: "Zone 3 intermittently shows fault. Wiring to be checked." },
    { record_id: 36, equipment_id: "SD-008",  type: "Smoke Detector",     building: "Laboratory Wing",  floor: "3rd Floor",     install_date: "2024-11-20", last_inspection: "2026-05-20", inspection_interval: 6,  remarks: "Heat detector in chemistry lab. Calibration OK." },
    { record_id: 37, equipment_id: "SP-006",  type: "Sprinkler System",   building: "Main Building",    floor: "3rd Floor",     install_date: "2022-07-10", last_inspection: "2026-01-10", inspection_interval: 6,  remarks: "Wet system. Flow switch tested and alarm verified." },
    { record_id: 38, equipment_id: "FE-010",  type: "Fire Extinguisher",  building: "Main Building",    floor: "4th Floor",     install_date: "2024-01-15", last_inspection: "2026-07-15", inspection_interval: 6,  remarks: "Foam type for server room. Pressure nominal." },
    { record_id: 39, equipment_id: "FHR-006", type: "Fire Hose Reel",     building: "Admin Block",      floor: "Ground Floor",  install_date: "2023-04-08", last_inspection: "2025-10-08", inspection_interval: 6,  remarks: "Reel stiff. Lubrication needed on swivel joint." },
    { record_id: 40, equipment_id: "EL-006",  type: "Emergency Light",    building: "Auditorium",       floor: "Ground Floor",  install_date: "2024-06-01", last_inspection: "2026-06-01", inspection_interval: 12, remarks: "Exit sign combo unit. LED brightness adequate." }
];

/* ------------------------------------------
   LOCALSTORAGE PERSISTENCE
   ------------------------------------------ */
var STORAGE_KEY = "fireguard_equipment";
var SEED_VERSION_KEY = "fireguard_seed_version";
var SEED_VERSION = "1.1"; // Bump this whenever SEED_DATA changes to auto-refresh localStorage

function loadEquipment() {
    try {
        var storedVersion = localStorage.getItem(SEED_VERSION_KEY);
        if (storedVersion !== SEED_VERSION) {
            localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
            console.log("[FireGuard] Seed version changed (" + storedVersion + " -> " + SEED_VERSION + "). Loading fresh seed data.");
            return SEED_DATA.slice();
        }
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log("[FireGuard] Loaded " + parsed.length + " items from localStorage.");
                return parsed;
            }
            console.warn("[FireGuard] localStorage data empty or invalid, reloading seed data.");
        }
    } catch (e) {
        console.warn("[FireGuard] Failed to load from localStorage, using seed data:", e);
    }
    console.log("[FireGuard] Using SEED_DATA (" + SEED_DATA.length + " items).");
    return SEED_DATA.slice();
}

function saveEquipment(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error("Failed to save to localStorage:", e);
        if (typeof FireGuard !== "undefined" && FireGuard.showToast) {
            FireGuard.showToast("Save failed — storage may be full. Data is not persisted.", "error");
        }
        return false;
    }
}

function resetToSeedData() {
    DUMMY_EQUIPMENT = SEED_DATA.slice();
    saveEquipment(DUMMY_EQUIPMENT);
}

var DUMMY_EQUIPMENT = loadEquipment();
if (!Array.isArray(DUMMY_EQUIPMENT) || DUMMY_EQUIPMENT.length === 0) {
    console.error("[FireGuard] DUMMY_EQUIPMENT is empty after loadEquipment(). Forcing SEED_DATA fallback.");
    DUMMY_EQUIPMENT = SEED_DATA.slice();
}

/* ------------------------------------------
   STATUS CALCULATIONS
   Logic:
     next_due = last_inspection + inspection_interval months
     status   = "Overdue"   if next_due < today
                "Due Soon"  if next_due within 30 days of today
                "Valid"     otherwise
   ------------------------------------------ */
function calculateStatus(equipment) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var nextDue = new Date(calculateNextDue(equipment));
    var daysUntilDue = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue <= 30) return "Due Soon";
    return "Valid";
}

function calculateNextDue(equipment) {
    var lastInspection = new Date(equipment.last_inspection);
    lastInspection.setMonth(lastInspection.getMonth() + equipment.inspection_interval);
    return lastInspection.toISOString().split("T")[0];
}

function enrichEquipment(equipment) {
    return {
        record_id: equipment.record_id,
        id: equipment.equipment_id,
        type: equipment.type,
        building: equipment.building,
        floor: equipment.floor,
        installDate: equipment.install_date,
        lastInspection: equipment.last_inspection,
        nextDue: calculateNextDue(equipment),
        interval: equipment.inspection_interval,
        status: calculateStatus(equipment),
        remarks: equipment.remarks,
        image: EQUIPMENT_IMAGES[equipment.type] || "images/equipment/fire-extinguisher.svg"
    };
}

function getAllEquipment() {
    return DUMMY_EQUIPMENT.map(enrichEquipment);
}

function getNextEquipmentId() {
    var allRecords = getAllEquipment();
    var maxNum = 0;
    allRecords.forEach(function (record) {
        var parts = record.id.split("-");
        var num = parseInt(parts[1], 10);
        if (num > maxNum) maxNum = num;
    });
    return "EQ-" + String(maxNum + 1).padStart(3, "0");
}

function getNextRecordId() {
    var maxId = 0;
    DUMMY_EQUIPMENT.forEach(function (eq) {
        if (eq.record_id && eq.record_id > maxId) maxId = eq.record_id;
    });
    return maxId + 1;
}
