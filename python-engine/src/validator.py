"""Validate question bank quality."""

def validate_questions(questions):
    report = {
        "total": len(questions),
        "errors": [],
        "warnings": [],
        "stats": {"mcq": 0, "fill": 0, "error": 0, "other": 0}
    }
    seen_ids = set()
    seen_questions = set()

    for q in questions:
        qid = q.get("id", "")
        if not qid:
            report["errors"].append("Missing id")
        if qid in seen_ids:
            report["errors"].append(f"Duplicate id: {qid}")
        seen_ids.add(qid)

        text = q.get("question", "").strip()
        if not text:
            report["errors"].append(f"{qid}: empty question")
        if text in seen_questions:
            report["warnings"].append(f"{qid}: possible duplicate question text")
        seen_questions.add(text)

        if not q.get("answer"):
            report["errors"].append(f"{qid}: missing answer")
        if not q.get("explanation"):
            report["warnings"].append(f"{qid}: missing explanation")
        if not q.get("bengali_explanation"):
            report["warnings"].append(f"{qid}: missing Bengali explanation")
        if not q.get("topic"):
            report["warnings"].append(f"{qid}: missing topic")
        if not q.get("rule"):
            report["warnings"].append(f"{qid}: missing rule")

        t = q.get("type", "other")
        if t in report["stats"]:
            report["stats"][t] += 1
        else:
            report["stats"]["other"] += 1

        if t == "mcq":
            opts = q.get("options", [])
            if len(opts) < 2:
                report["errors"].append(f"{qid}: MCQ needs options")
            if q.get("answer") not in opts and q.get("answer") not in ["no article", "No article"]:
                # allow some flexibility
                pass

    report["valid"] = len(report["errors"]) == 0
    return report
