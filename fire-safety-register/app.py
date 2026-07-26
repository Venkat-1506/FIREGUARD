import os
import sqlite3
from datetime import datetime, date
from flask import Flask, request, jsonify, g, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fire_safety.db")

VALID_TYPES = [
    "ABC Fire Extinguisher", "CO2 Fire Extinguisher", "Water Fire Extinguisher",
    "Foam Fire Extinguisher", "Fire Hose Reel", "Fire Blanket",
    "Emergency Exit Light", "Smoke Detector", "Sprinkler Head",
    "Fire Alarm Panel", "Fire Bell", "Fire Bucket"
]
VALID_BUILDINGS = [
    "Main Building", "Admin Block", "Laboratory Wing", "Library Block",
    "Hostel A", "Hostel B", "Workshop", "Auditorium"
]
VALID_FLOORS = ["Basement", "Ground", "1", "2", "3", "4", "5"]
VALID_STATUSES = ["Active", "Expired", "Overdue", "Under Maintenance", "Decommissioned"]

INSPECTION_INTERVALS = {
    "ABC Fire Extinguisher": 365,
    "CO2 Fire Extinguisher": 365,
    "Water Fire Extinguisher": 365,
    "Foam Fire Extinguisher": 365,
    "Fire Hose Reel": 180,
    "Fire Blanket": 365,
    "Emergency Exit Light": 730,
    "Smoke Detector": 365,
    "Sprinkler Head": 1825,
    "Fire Alarm Panel": 365,
    "Fire Bell": 365,
    "Fire Bucket": 730,
}


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    conn = sqlite3.connect(DATABASE)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS equipment (
            record_id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            building TEXT NOT NULL,
            floor TEXT NOT NULL,
            last_inspection TEXT,
            next_due TEXT,
            status TEXT NOT NULL,
            remarks TEXT
        );
    """)
    conn.commit()
    existing = conn.execute("SELECT COUNT(*) FROM equipment").fetchone()[0]
    if existing == 0:
        seed_data(conn)
    conn.close()


def seed_data(conn):
    records = [
        ("FE-001", "ABC Fire Extinguisher", "Main Building", "Ground", "2025-06-15", "Good condition, pressure normal"),
        ("FE-002", "ABC Fire Extinguisher", "Main Building", "1", "2025-01-10", "Seal intact, pressure normal"),
        ("FE-003", "CO2 Fire Extinguisher", "Admin Block", "Ground", "2025-03-20", "Replaced hose"),
        ("FE-004", "ABC Fire Extinguisher", "Admin Block", "2", "2024-11-05", "Low pressure warning"),
        ("FE-005", "Fire Hose Reel", "Laboratory Wing", "Ground", "2025-12-01", "Hose tested, no leaks"),
        ("FE-006", "Fire Hose Reel", "Laboratory Wing", "1", "2025-08-22", ""),
        ("FE-007", "ABC Fire Extinguisher", "Library Block", "Ground", "2025-09-14", "Near entrance"),
        ("FE-008", "Fire Blanket", "Library Block", "1", "2024-06-30", "Packaging slightly torn"),
        ("FE-009", "Smoke Detector", "Hostel A", "1", "2025-04-18", "Battery replaced"),
        ("FE-010", "Smoke Detector", "Hostel A", "2", "2025-04-18", "Battery replaced"),
        ("FE-011", "ABC Fire Extinguisher", "Hostel B", "1", "2015-09-01", "Very old unit, recommend replacement"),
        ("FE-012", "Emergency Exit Light", "Hostel B", "Ground", "2024-08-10", "One bulb flickering"),
        ("FE-013", "CO2 Fire Extinguisher", "Workshop", "Ground", "2025-11-20", "Industrial area, checked monthly"),
        ("FE-014", "ABC Fire Extinguisher", "Workshop", "1", None, "Newly installed, no inspection yet"),
        ("FE-015", "Sprinkler Head", "Auditorium", "1", "2025-05-30", "12 heads in total, all inspected"),
        ("FE-016", "Fire Alarm Panel", "Main Building", "Ground", "2025-10-05", "Panel tested, all zones green"),
        ("FE-017", "Fire Bell", "Admin Block", "Ground", "2025-07-12", "Audible test passed"),
        ("FE-018", "Fire Bucket", "Laboratory Wing", "Ground", "2024-03-15", "Sand replaced"),
        ("FE-019", "ABC Fire Extinguisher", "Hostel A", "3", "2025-02-28", ""),
        ("FE-020", "ABC Fire Extinguisher", "Hostel A", "Ground", "2025-02-28", "Duplicate of FE-019 entry created by mistake"),
    ]
    for r in records:
        eid, etype, bldg, flr, last_insp, remarks = r
        interval = INSPECTION_INTERVALS.get(etype, 365)
        if last_insp:
            li = datetime.strptime(last_insp, "%Y-%m-%d").date()
            nd = date.fromordinal(li.toordinal() + interval)
            today = date.today()
            if nd < today:
                status = "Expired"
            elif (nd - today).days <= 30:
                status = "Overdue"
            else:
                status = "Active"
            nd_str = nd.isoformat()
        else:
            nd_str = None
            status = "Under Maintenance"
        conn.execute(
            """INSERT INTO equipment (equipment_id, type, building, floor, last_inspection, next_due, status, remarks)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (eid, etype, bldg, flr, last_insp, nd_str, status, remarks),
        )
    conn.commit()


def recalculate_status(last_inspection_str, equipment_type):
    interval = INSPECTION_INTERVALS.get(equipment_type, 365)
    if not last_inspection_str:
        return None, "Under Maintenance"
    li = datetime.strptime(last_inspection_str, "%Y-%m-%d").date()
    nd = date.fromordinal(li.toordinal() + interval)
    today = date.today()
    if nd < today:
        status = "Expired"
    elif (nd - today).days <= 30:
        status = "Overdue"
    else:
        status = "Active"
    return nd.isoformat(), status


def row_to_dict(row):
    d = dict(row)
    if d.get("next_due"):
        today = date.today()
        nd = datetime.strptime(d["next_due"], "%Y-%m-%d").date()
        d["days_remaining"] = (nd - today).days
    else:
        d["days_remaining"] = None
    return d


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/equipment", methods=["GET"])
def list_equipment():
    db = get_db()
    search = request.args.get("search", "").strip()
    filter_type = request.args.get("type", "").strip()
    filter_building = request.args.get("building", "").strip()
    filter_status = request.args.get("status", "").strip()
    filter_floor = request.args.get("floor", "").strip()

    query = "SELECT * FROM equipment WHERE 1=1"
    params = []

    if search:
        query += " AND (equipment_id LIKE ? OR type LIKE ? OR building LIKE ? OR remarks LIKE ? OR floor LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s, s])
    if filter_type:
        query += " AND type = ?"
        params.append(filter_type)
    if filter_building:
        query += " AND building = ?"
        params.append(filter_building)
    if filter_status:
        query += " AND status = ?"
        params.append(filter_status)
    if filter_floor:
        query += " AND floor = ?"
        params.append(filter_floor)

    query += " ORDER BY record_id ASC"
    rows = db.execute(query, params).fetchall()
    return jsonify([row_to_dict(r) for r in rows])


@app.route("/api/equipment/<int:record_id>", methods=["GET"])
def get_equipment(record_id):
    db = get_db()
    row = db.execute("SELECT * FROM equipment WHERE record_id = ?", (record_id,)).fetchone()
    if not row:
        return jsonify({"error": "Record not found"}), 404
    return jsonify(row_to_dict(row))


@app.route("/api/equipment", methods=["POST"])
def add_equipment():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is empty"}), 400

    errors = validate_fields(data, is_new=True)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    db = get_db()
    try:
        existing = db.execute("SELECT record_id FROM equipment WHERE equipment_id = ?", (data["equipment_id"],)).fetchone()
        if existing:
            return jsonify({"error": f"Equipment ID '{data['equipment_id']}' already exists"}), 409

        next_due, status = recalculate_status(data.get("last_inspection"), data["type"])
        db.execute(
            """INSERT INTO equipment (equipment_id, type, building, floor, last_inspection, next_due, status, remarks)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (data["equipment_id"].strip(), data["type"].strip(), data["building"].strip(),
             data["floor"].strip(), data.get("last_inspection"), next_due, status, data.get("remarks", "").strip()),
        )
        db.commit()
        new_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        row = db.execute("SELECT * FROM equipment WHERE record_id = ?", (new_id,)).fetchone()
        return jsonify(row_to_dict(row)), 201
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500


@app.route("/api/equipment/<int:record_id>", methods=["PUT"])
def update_equipment(record_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is empty"}), 400

    db = get_db()
    existing = db.execute("SELECT * FROM equipment WHERE record_id = ?", (record_id,)).fetchone()
    if not existing:
        return jsonify({"error": "Record not found"}), 404

    errors = validate_fields(data, is_new=False)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    dup = db.execute(
        "SELECT record_id FROM equipment WHERE equipment_id = ? AND record_id != ?",
        (data["equipment_id"].strip(), record_id),
    ).fetchone()
    if dup:
        return jsonify({"error": f"Equipment ID '{data['equipment_id']}' is already used by another record"}), 409

    try:
        next_due, status = recalculate_status(data.get("last_inspection"), data["type"])
        db.execute(
            """UPDATE equipment SET equipment_id=?, type=?, building=?, floor=?,
               last_inspection=?, next_due=?, status=?, remarks=? WHERE record_id=?""",
            (data["equipment_id"].strip(), data["type"].strip(), data["building"].strip(),
             data["floor"].strip(), data.get("last_inspection"), next_due, status,
             data.get("remarks", "").strip(), record_id),
        )
        db.commit()
        row = db.execute("SELECT * FROM equipment WHERE record_id = ?", (record_id,)).fetchone()
        return jsonify(row_to_dict(row))
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500


@app.route("/api/equipment/<int:record_id>", methods=["DELETE"])
def delete_equipment(record_id):
    db = get_db()
    existing = db.execute("SELECT * FROM equipment WHERE record_id = ?", (record_id,)).fetchone()
    if not existing:
        return jsonify({"error": "Record not found"}), 404
    try:
        db.execute("DELETE FROM equipment WHERE record_id = ?", (record_id,))
        db.commit()
        return jsonify({"message": "Record deleted successfully"})
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500


@app.route("/api/stats", methods=["GET"])
def get_stats():
    db = get_db()
    rows = db.execute("SELECT status, COUNT(*) as count FROM equipment GROUP BY status").fetchall()
    stats = {r["status"]: r["count"] for r in rows}
    total = db.execute("SELECT COUNT(*) FROM equipment").fetchone()[0]
    return jsonify({"total": total, "by_status": stats})


@app.route("/api/options", methods=["GET"])
def get_options():
    return jsonify({
        "types": VALID_TYPES,
        "buildings": VALID_BUILDINGS,
        "floors": VALID_FLOORS,
        "statuses": VALID_STATUSES,
    })


def validate_fields(data, is_new=False):
    errors = []
    if is_new:
        if not data.get("equipment_id", "").strip():
            errors.append("equipment_id is required")
    if not data.get("type", "").strip():
        errors.append("type is required")
    elif data["type"].strip() not in VALID_TYPES:
        errors.append(f"Invalid type. Must be one of: {', '.join(VALID_TYPES)}")
    if not data.get("building", "").strip():
        errors.append("building is required")
    elif data["building"].strip() not in VALID_BUILDINGS:
        errors.append(f"Invalid building. Must be one of: {', '.join(VALID_BUILDINGS)}")
    if not data.get("floor", "").strip():
        errors.append("floor is required")
    elif data["floor"].strip() not in VALID_FLOORS:
        errors.append(f"Invalid floor. Must be one of: {', '.join(VALID_FLOORS)}")
    li = data.get("last_inspection")
    if li:
        try:
            datetime.strptime(li, "%Y-%m-%d")
        except ValueError:
            errors.append("last_inspection must be in YYYY-MM-DD format")
    remarks = data.get("remarks", "")
    if remarks and len(remarks) > 500:
        errors.append("remarks must be 500 characters or fewer")
    return errors


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
