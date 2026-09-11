import re
from typing import List


def clean_text(text: str) -> str:
    """
    Cleans raw document text by removing non-printable characters,
    normalizing whitespace, and fixing encoding artifacts.
    """
    if not text:
        return ""
    
    # Remove null bytes and non-printable control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # Normalize multiple whitespace, tabs, and newlines
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    
    return text.strip()


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Splits text into overlapping character chunks while preserving word boundaries.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []

    if len(cleaned) <= chunk_size:
        return [cleaned]

    chunks = []
    start = 0
    text_length = len(cleaned)

    while start < text_length:
        end = start + chunk_size
        
        # Adjust end to fall on space boundary if possible
        if end < text_length:
            space_idx = cleaned.rfind(' ', start, end)
            if space_idx > start + (chunk_size // 2):
                end = space_idx

        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move start pointer back by overlap
        start = end - overlap if end < text_length else text_length

    return chunks
