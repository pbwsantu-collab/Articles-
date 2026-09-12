"""Prepare teacher-style narration scripts (EN / BN / Mixed)."""

def generate_narration_scripts(lessons):
    for section in lessons.get("sections", []):
        title = section.get("title", "")
        content = section.get("source_content", "")
        bn = section.get("bengali_explanation", "")

        section["narration_en"] = f"Now let us study {title}. {content}"
        section["narration_bn"] = f"এখন আমরা শিখব {title}। {bn}"
        section["narration_mixed"] = (
            f"Today we are going to learn about {title}. "
            f"{bn} "
            f"Listen carefully to the examples."
        )
    return lessons
