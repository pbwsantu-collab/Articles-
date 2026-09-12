# BB STORE – ENGLISH PWA

**Professional, mobile-first English Grammar Learning Platform**

First chapter implemented: **Chapter X — Determiners, Articles**

## Architecture

```
GitHub.com  +  Local Python  +  GitHub Pages
```

- **No Codespaces**
- **No always-on server**
- **Static PWA** hosted on GitHub Pages from `/docs`
- **Python** runs locally on Windows as the content-generation engine

## Quick Start (Teacher Workflow)

### 1. Prerequisites
- Python 3.10+
- Git
- VS Code (recommended)

### 2. Setup

```bash
cd BB-STORE/python-engine
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### 3. Generate Content

```bash
python main.py --all
```

This will:
- Parse Chapter X rules, examples, exercises
- Generate lessons + Bengali explanations + narration scripts
- Create a 100-question master test
- Validate questions
- Export JSON into `docs/data/`

### 4. Publish

```bash
cd ../..
git add .
git commit -m "Update Chapter X content"
git push
```

### 5. Enable GitHub Pages

1. Go to repository **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**
4. Folder: **/docs**
5. Save

Your PWA will be live at:

`https://YOUR-USERNAME.github.io/BB-STORE/`

## Project Structure

```
BB-STORE/
├── python-engine/          # Local content engine
│   ├── main.py
│   ├── src/
│   ├── input/              # Drop TXT/PDF/DOCX here
│   └── output/
└── docs/                   # GitHub Pages root (the PWA)
    ├── index.html
    ├── style.css
    ├── app.js
    ├── manifest.json
    ├── sw.js
    └── data/               # Generated JSON
```

## Features

- Full Chapter X (Determiners & Articles) with all rules 90–101
- Interactive Teach Mode with progressive screens
- Browser speech synthesis (EN / BN mixed narration)
- Practice engine with immediate feedback + Bengali explanations
- Exactly 100-question master test
- Results + localStorage progress
- Offline support via Service Worker
- Print-friendly worksheets
- Mobile-first responsive design
- Ready for future chapters (Pronouns, Adjectives, Verbs…)

## Adding Future Chapters

1. Place source material in `python-engine/input/`
2. Update `config.json` chapters list
3. Extend `parser.py` / generators
4. Run `python main.py --all`
5. Push to GitHub

## License

MIT – free for educational use.
