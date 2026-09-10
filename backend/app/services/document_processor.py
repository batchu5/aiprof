import fitz  # PyMuPDF
import logging
from typing import List

logger = logging.getLogger("uvicorn.error")


class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            extracted_text = []
            for page in doc:
                extracted_text.append(page.get_text())
            return "\n".join(extracted_text)
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            return ""

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
        return chunks
