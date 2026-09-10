import logging
from app.services.document_processor import DocumentProcessor
from app.services.knowledge_service import KnowledgeService

logger = logging.getLogger("uvicorn.error")


async def process_document_background(project_id: str, pdf_bytes: bytes, filename: str):
    try:
        logger.info(f"Starting background processing for {filename} (Project: {project_id})")
        text = DocumentProcessor.extract_text_from_pdf_bytes(pdf_bytes)
        chunks = DocumentProcessor.chunk_text(text)
        await KnowledgeService.index_document_chunks(project_id, chunks)
        logger.info(f"Finished background processing for {filename}")
    except Exception as e:
        logger.error(f"Error in background document processing: {e}")
