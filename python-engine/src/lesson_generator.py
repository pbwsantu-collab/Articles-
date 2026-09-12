"""Generate lesson objects for the PWA from structured chapter data."""

def generate_lessons(structured, chapter_meta):
    lessons = {
        "chapter_id": chapter_meta["id"],
        "title": structured["title"],
        "number": structured["number"],
        "sections": [],
        "progress": 0
    }

    for rule in structured.get("rules", []):
        section = {
            "id": f"rule-{rule['id']}",
            "rule_number": rule["id"],
            "title": rule["title"],
            "source_content": rule.get("content", ""),
            "bengali_explanation": rule.get("bengali", ""),
            "examples": rule.get("examples", []),
            "subsections": rule.get("subsections", []),
            "categories": rule.get("categories", []),
            "cases": rule.get("cases", []),
            "key_contrast": rule.get("key_contrast", []),
            "note": rule.get("note", ""),
            "type": "rule",
            "narration_en": "",
            "narration_bn": "",
            "narration_mixed": ""
        }
        lessons["sections"].append(section)

    # Add special interactive sections
    lessons["sections"].append({
        "id": "worked-examples",
        "title": "Worked Examples",
        "type": "interactive_examples",
        "description": "Practice the filled blanks from the textbook with immediate feedback."
    })

    lessons["sections"].append({
        "id": "exercise-11",
        "title": "Exercise 11",
        "type": "full_exercise",
        "parts": ["a", "b", "c", "d", "e", "f"]
    })

    return lessons
