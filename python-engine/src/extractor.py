"""Extract text from TXT / PDF / DOCX."""
from pathlib import Path

def extract_content(filepath: str) -> str:
    path = Path(filepath)
    suffix = path.suffix.lower()

    if suffix == ".txt":
        return path.read_text(encoding="utf-8")

    if suffix == ".pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(filepath)
            text = []
            for page in doc:
                text.append(page.get_text())
            return "\n".join(text)
        except ImportError:
            raise ImportError("Install PyMuPDF: pip install PyMuPDF")

    if suffix in (".docx", ".doc"):
        try:
            from docx import Document
            doc = Document(filepath)
            return "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            raise ImportError("Install python-docx: pip install python-docx")

    raise ValueError(f"Unsupported format: {suffix}")
