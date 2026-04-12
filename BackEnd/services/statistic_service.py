from datetime import date
from core.db_connector import get_db
from models.scan_history import ScanHistory


def get_dashboard_stats(user_id):
    db = get_db()
    today = date.today().isoformat()

    today_res = db.table("scan_histories").select("id", count="exact") \
        .eq("user_id", user_id) \
        .gte("created_at", f"{today}T00:00:00") \
        .execute()
    today_scans = today_res.count if today_res.count is not None else 0

    fakes_res = db.table("scan_histories").select("id", count="exact") \
        .eq("user_id", user_id) \
        .eq("result", "Deepfake") \
        .execute()
    detected_fakes = fakes_res.count if fakes_res.count is not None else 0

    all_data_res = db.table("scan_histories").select("confidence_score, processing_time").eq("user_id",
                                                                                             user_id).execute()

    avg_confidence = 0.0
    avg_time = 0.0

    if all_data_res.data:
        scores = [float(d['confidence_score']) for d in all_data_res.data if d.get('confidence_score') is not None]
        times = [float(d['processing_time']) for d in all_data_res.data if d.get('processing_time') is not None]

        avg_confidence = sum(scores) / len(scores) if scores else 0.0
        avg_time = sum(times) / len(times) if times else 0.0

    return {
        "today_scans": today_scans,
        "detected_fakes": detected_fakes,
        "avg_confidence": round(avg_confidence, 1),  # Dibulatkan 1 desimal (misal 95.2)
        "avg_processing_time": round(avg_time, 1)  # Dibulatkan 1 desimal (misal 3.0)
    }


def get_paginated_scans(user_id, page=1, limit=10):
    # ... (Kode get_paginated_scans tetap sama persis seperti punyamu sebelumnya) ...
    db = get_db()

    start = (page - 1) * limit
    end = start + limit - 1

    response = db.table("scan_histories") \
        .select("*", count="exact") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .range(start, end) \
        .execute()

    scans = [ScanHistory.from_dict(d) for d in response.data]

    total_items = response.count
    total_pages = (total_items + limit - 1) // limit

    return {
        "items": [s.__dict__ for s in scans],
        "pagination": {
            "current_page": page,
            "limit": limit,
            "total_items": total_items,
            "total_pages": total_pages
        }
    }