# Fire Safety Equipment Inspection & Expiry Register

**Problem:** Fire extinguishers and safety equipment in institutional buildings carry paper tags for inspection dates. No central list exists, so expired units are discovered during audits or when one is needed and fails.

**Solution:** A web-based register that stores every unit of safety equipment with its location and last inspection date, automatically calculates the next due date, and shows which units are overdue or approaching expiry.

## How to Run

1. Install Python 3.8+ and pip.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   python app.py
   ```
4. Open http://localhost:5000 in your browser.

## Field Definitions

| Field | Description | Possible Values |
|---|---|---|
| `record_id` | Auto-incrementing database primary key | Integer (1, 2, 3...) |
| `equipment_id` | Unique identifier printed on the physical tag | e.g., FE-001, FE-002 |
| `type` | Category of fire safety equipment | ABC Fire Extinguisher, CO2 Fire Extinguisher, Water Fire Extinguisher, Foam Fire Extinguisher, Fire Hose Reel, Fire Blanket, Emergency Exit Light, Smoke Detector, Sprinkler Head, Fire Alarm Panel, Fire Bell, Fire Bucket |
| `building` | Building where the equipment is installed | Main Building, Admin Block, Laboratory Wing, Library Block, Hostel A, Hostel B, Workshop, Auditorium |
| `floor` | Floor level within the building | Basement, Ground, 1, 2, 3, 4, 5 |
| `last_inspection` | Date the equipment was last inspected (YYYY-MM-DD) | Any valid date, or null if never inspected |
| `next_due` | **Derived** — date when next inspection is due | Calculated from `last_inspection` + interval |
| `status` | **Derived** — current compliance status | Active, Overdue, Expired, Under Maintenance, Decommissioned |
| `remarks` | Free-text notes from the inspector | Up to 500 characters |

## Derived Value Calculation

### `next_due`
`next_due = last_inspection_date + inspection_interval`

The inspection interval depends on equipment type:

| Equipment Type | Interval (days) |
|---|---|
| ABC / CO2 / Water / Foam Fire Extinguisher | 365 (1 year) |
| Fire Hose Reel | 180 (6 months) |
| Fire Blanket | 365 (1 year) |
| Emergency Exit Light | 730 (2 years) |
| Smoke Detector | 365 (1 year) |
| Sprinkler Head | 1825 (5 years) |
| Fire Alarm Panel | 365 (1 year) |
| Fire Bell | 365 (1 year) |
| Fire Bucket | 730 (2 years) |

### `status`
- **Active**: `next_due` is more than 30 days away.
- **Overdue**: `next_due` is within 30 days (including today).
- **Expired**: `next_due` has already passed.
- **Under Maintenance**: `last_inspection` is null (equipment not yet inspected).
- **Decommissioned**: Set manually.

### `days_remaining` (display only)
`days_remaining = next_due - today`
Negative values indicate how many days overdue the equipment is.

## Hand-Verified Example

**Record FE-001** (ABC Fire Extinguisher):
- `last_inspection` = 2025-06-15
- Interval = 365 days
- `next_due` = 2025-06-15 + 365 = **2026-06-15**
- Today = 2026-07-26
- `days_remaining` = 2026-06-15 − 2026-07-26 = **-41 days** (41 days overdue)
- Expected status = **Expired** ✓

## Sample Dataset — 20 Records with Awkward Cases

The dataset includes the following intentional edge cases:

1. **FE-011** — Very old inspection date (2015-09-01), likely 10+ years expired.
2. **FE-014** — No `last_inspection` value (null), status = Under Maintenance.
3. **FE-006, FE-020** — Empty `remarks` field.
4. **FE-019, FE-020** — Duplicate equipment type and inspection date in same building (Hostel A), testing duplicate detection.
5. **FE-008** — Inspection date causes borderline status.
6. **FE-020** — Remarks note a duplicate entry was created by mistake.

## What Is Not Finished

- User authentication / role-based access control.
- Automated email/SMS reminders before expiry.
- Bulk CSV import/export.
- Audit log of changes.
- Image upload for inspection photos.
- Deployment to a production server (runs locally only).
