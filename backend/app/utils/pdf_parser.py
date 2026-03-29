# backend/app/utils/pdf_parser.py
import pdfplumber

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts all text from a given PDF file."""
    text_content = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content.append(page_text)
        return "\n".join(text_content)
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return ""