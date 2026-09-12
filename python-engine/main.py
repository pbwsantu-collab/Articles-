#!/usr/bin/env python3
"""
BB STORE – ENGLISH PWA
Local Content Generation Engine
GitHub.com + Local Python + GitHub Pages architecture
"""

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from extractor import extract_content
from parser import parse_chapter
from lesson_generator import generate_lessons
from question_generator import generate_questions
from validator import validate_questions
from exporter import export_to_docs
from narration import generate_narration_scripts
from bengali_helper import ensure_bengali_support

BASE_DIR = Path(__file__).parent
CONFIG_PATH = BASE_DIR / "config.json"

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def run_pipeline(config, all_mode=False):
    print("=" * 60)
    print("BB STORE – ENGLISH PWA Content Engine")
    print("Local Python → GitHub Pages PWA")
    print("=" * 60)

    ensure_bengali_support()

    chapters = config.get("chapters", [])
    settings = config.get("settings", {})

    for chapter in chapters:
        print(f"\n▶ Processing: {chapter['title']} (Chapter {chapter['number']})")

        input_path = BASE_DIR / config["input_dir"] / chapter.get("source_file", "")
        if not input_path.exists():
            print("  ℹ Using built-in Chapter X source content")
            raw_text = None
        else:
            raw_text = extract_content(str(input_path))
            print(f"  ✓ Extracted from {input_path.name}")

        structured = parse_chapter(raw_text, chapter)
        print("  ✓ Parsed rules, examples, exercises")

        lessons = generate_lessons(structured, chapter)
        print(f"  ✓ Generated {len(lessons.get('sections', []))} lesson sections")

        if settings.get("generate_narration", True):
            lessons = generate_narration_scripts(lessons)
            print("  ✓ Narration scripts (EN / BN / Mixed) prepared")

        questions = generate_questions(structured, chapter, max_q=settings.get("max_questions", 100))
        print(f"  ✓ Generated {len(questions)} questions")

        if settings.get("validate_questions", True):
            report = validate_questions(questions)
            report_path = BASE_DIR / config["output_dir"] / "question_validation_report.json"
            report_path.parent.mkdir(parents=True, exist_ok=True)
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            print(f"  ✓ Validation report → {report_path.name}")
            if report.get("errors"):
                print(f"  ⚠ {len(report['errors'])} issues found (see report)")

        export_to_docs(lessons, questions, structured, config)
        print("  ✓ Exported JSON to docs/data/")

    print("\n" + "=" * 60)
    print("Pipeline complete.")
    print("Next steps:")
    print("  1. Review docs/data/*.json")
    print("  2. git add . && git commit -m \"Update Chapter X\"")
    print("  3. git push")
    print("  4. GitHub Pages will serve the PWA from /docs")
    print("=" * 60)

def main():
    parser = argparse.ArgumentParser(description="BB STORE Content Engine")
    parser.add_argument("--all", action="store_true", help="Run full pipeline")
    parser.add_argument("--validate-only", action="store_true", help="Only validate existing questions")
    args = parser.parse_args()

    config = load_config()

    if args.validate_only:
        qpath = BASE_DIR / config["docs_data_dir"] / "questions.json"
        if qpath.exists():
            with open(qpath, "r", encoding="utf-8") as f:
                questions = json.load(f)
            report = validate_questions(questions)
            print(json.dumps(report, indent=2, ensure_ascii=False))
        else:
            print("No questions.json found")
        return

    run_pipeline(config, all_mode=args.all or True)

if __name__ == "__main__":
    main()
