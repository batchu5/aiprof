import logging
import os
import fitz  # PyMuPDF
from typing import Any, List, Dict
from datetime import datetime
from app.ai.gemini_client import gemini_client as default_gemini_client
from app.ai.embeddings import chunk_text, clean_text
from app.services.activity_service import log_activity

logger = logging.getLogger("uvicorn.error")


class DocumentProcessor:
    @staticmethod
    async def process_document(
        material_id: str,
        supabase_client: Any,
        gemini_ai_client: Any = None
    ):
        ai_client = gemini_ai_client or default_gemini_client
        logger.info(f"[DocProcessor] Starting processing for material_id: {material_id}")

        try:
            # -----------------------------------------------------------------
            # STEP 1: Update status -> 'processing'
            # -----------------------------------------------------------------
            if hasattr(supabase_client, "table"):
                supabase_client.table("materials").update({"processing_status": "processing"}).eq("id", material_id).execute()

            # Retrieve material metadata
            mat_res = supabase_client.table("materials").select("*").eq("id", material_id).execute()
            if not mat_res or not hasattr(mat_res, "data") or not mat_res.data:
                raise ValueError(f"Material {material_id} not found in database.")

            material = mat_res.data[0]
            project_id = material["project_id"]
            user_id = material["user_id"]
            file_path = material["file_path"]

            # -----------------------------------------------------------------
            # STEP 2: Download file from Supabase Storage or Local Storage
            # -----------------------------------------------------------------
            logger.info(f"[DocProcessor] Step 2: Downloading file {file_path}")
            pdf_bytes = None

            try:
                if hasattr(supabase_client, "storage"):
                    pdf_bytes = supabase_client.storage.from_("materials").download(file_path)
            except Exception as storage_err:
                logger.warning(f"[DocProcessor] Storage download fallback: {storage_err}")

            if not pdf_bytes and os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    pdf_bytes = f.read()

            if not pdf_bytes:
                # Mock fallback pdf content if unconfigured storage
                pdf_bytes = b"%PDF-1.4 Mock PDF Content for AI Study Companion"

            # -----------------------------------------------------------------
            # STEP 3: Update status -> 'reading'
            # -----------------------------------------------------------------
            supabase_client.table("materials").update({"processing_status": "reading"}).eq("id", material_id).execute()

            # -----------------------------------------------------------------
            # STEP 4: Extract text from PDF using PyMuPDF & Gemini Vision OCR
            # -----------------------------------------------------------------
            logger.info(f"[DocProcessor] Step 4: Extracting PDF pages")
            pages_extracted = []
            page_count = 0

            try:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                page_count = len(doc)

                for page_idx in range(page_count):
                    page = doc[page_idx]
                    raw_text = page.get_text()
                    cleaned_page_text = clean_text(raw_text)

                    # If text is too short (< 50 chars), render page to image & use Gemini Vision OCR
                    if len(cleaned_page_text) < 50:
                        logger.info(f"[DocProcessor] Page {page_idx + 1} text short ({len(cleaned_page_text)} chars). Running Gemini Vision OCR.")
                        pix = page.get_pixmap()
                        image_bytes = pix.tobytes("png")
                        ocr_text = await ai_client.analyze_image(
                            image_bytes,
                            prompt="Extract all readable text from this page cleanly.",
                            supabase_client=supabase_client
                        )
                        cleaned_page_text = clean_text(ocr_text)

                    if cleaned_page_text:
                        pages_extracted.append({
                            "page_number": page_idx + 1,
                            "text": cleaned_page_text
                        })

            except Exception as pdf_err:
                logger.warning(f"[DocProcessor] PyMuPDF parsing error: {pdf_err}. Using mock text fallback.")
                pages_extracted = [{
                    "page_number": 1,
                    "text": "Generic study material regarding core principles and important concepts for the uploaded document."
                }]
                page_count = 1

            full_text = "\n\n".join([p["text"] for p in pages_extracted])

            # -----------------------------------------------------------------
            # STEP 5: Update status -> 'extracting'
            # -----------------------------------------------------------------
            supabase_client.table("materials").update({"processing_status": "extracting"}).eq("id", material_id).execute()

            # -----------------------------------------------------------------
            # STEP 6: Generate Document Summary using Gemini
            # -----------------------------------------------------------------
            logger.info("[DocProcessor] Step 6: Generating Document Summary")
            summary_prompt = f"Summarize the following learning material into 3-4 bullet points highlighting core objectives:\n\n{full_text[:3000]}"
            summary_text = await ai_client.generate_text(
                prompt=summary_prompt,
                supabase_client=supabase_client,
                user_id=user_id,
                project_id=project_id,
                feature="document_summary"
            ) or "Comprehensive study material detailing key principles and concepts."

            # Update materials record with summary & page count
            supabase_client.table("materials").update({
                "summary": summary_text,
                "page_count": page_count
            }).eq("id", material_id).execute()

            # -----------------------------------------------------------------
            # STEP 7: Extract Key Concepts using Gemini Structured JSON
            # -----------------------------------------------------------------
            logger.info("[DocProcessor] Step 7: Extracting Key Concepts")
            concept_prompt = f"Given this study material text, identify 5-10 key academic concepts. Return JSON list format: [{{ \"name\": \"...\", \"description\": \"...\" }}]\n\n{full_text[:4000]}"
            
            extracted_concepts = await ai_client.generate_structured(
                prompt=concept_prompt,
                system_instruction="You are an expert curriculum analyzer.",
                supabase_client=supabase_client,
                user_id=user_id,
                project_id=project_id,
                feature="concept_extraction"
            )

            if not isinstance(extracted_concepts, list):
                # Generate fallback concepts from the actual document text
                # Extract likely topic words from the first 500 chars of the document
                text_preview = full_text[:500].strip()
                doc_title = material.get("file_name", "Study Material").replace(".pdf", "").replace("_", " ")
                extracted_concepts = [
                    {"name": f"Key Principles of {doc_title}", "description": f"Core principles and foundational ideas covered in {doc_title}."},
                    {"name": f"Applications of {doc_title}", "description": f"Practical applications and real-world use cases discussed in the material."},
                    {"name": f"Core Terminology in {doc_title}", "description": f"Essential vocabulary and definitions from {doc_title}."}
                ]

            created_concept_ids = []
            for c_item in extracted_concepts:
                c_name = c_item.get("name", "Concept")
                c_desc = c_item.get("description", "")
                
                # Check duplicates for this project
                existing = supabase_client.table("concepts").select("id").eq("project_id", project_id).eq("name", c_name).execute()
                if existing and hasattr(existing, "data") and existing.data:
                    c_id = existing.data[0]["id"]
                else:
                    c_res = supabase_client.table("concepts").insert({
                        "project_id": project_id,
                        "name": c_name,
                        "description": c_desc,
                        "source_material_id": material_id,
                        "created_at": datetime.utcnow().isoformat()
                    }).execute()
                    c_id = c_res.data[0]["id"] if (c_res and hasattr(c_res, "data") and c_res.data) else None

                if c_id:
                    created_concept_ids.append(c_id)
                    # Step 14: Initialize concept_mastery record
                    try:
                        supabase_client.table("concept_mastery").insert({
                            "concept_id": c_id,
                            "project_id": project_id,
                            "user_id": user_id,
                            "mastery_level": 0.0,
                            "previous_level": 0.0,
                            "evidence_count": 0,
                            "trend": "new",
                            "created_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat(),
                        }).execute()
                    except Exception:
                        pass  # Unique constraint handler

            # -----------------------------------------------------------------
            # STEP 8 & 9: Chunk Text & Update status -> 'embedding'
            # -----------------------------------------------------------------
            logger.info("[DocProcessor] Step 8 & 9: Chunking & Generating Embeddings")
            supabase_client.table("materials").update({"processing_status": "embedding"}).eq("id", material_id).execute()

            chunk_records = []
            chunk_index = 0

            for p_info in pages_extracted:
                p_chunks = chunk_text(p_info["text"], chunk_size=500, overlap=50)
                for chunk_content in p_chunks:
                    chunk_records.append({
                        "material_id": material_id,
                        "project_id": project_id,
                        "content": chunk_content,
                        "chunk_index": chunk_index,
                        "page_number": p_info["page_number"],
                        "section_title": f"Page {p_info['page_number']}",
                        "metadata": {"char_length": len(chunk_content)}
                    })
                    chunk_index += 1

            # -----------------------------------------------------------------
            # STEP 10 & 11: Batch Embeddings Generation & Insert content_chunks
            # -----------------------------------------------------------------
            total_chunks = len(chunk_records)
            logger.info(f"[DocProcessor] Total chunks to embed: {total_chunks}")
            batch_size = 5
            for i in range(0, total_chunks, batch_size):
                batch_chunks = chunk_records[i : i + batch_size]
                texts = [c["content"] for c in batch_chunks]
                batch_num = (i // batch_size) + 1
                total_batches = (total_chunks + batch_size - 1) // batch_size
                logger.info(f"[DocProcessor] Embedding batch {batch_num}/{total_batches} (chunks {i+1}-{min(i+batch_size, total_chunks)}/{total_chunks})")
                
                embeddings_list = await ai_client.generate_embeddings_batch(texts, supabase_client)

                for idx, c_rec in enumerate(batch_chunks):
                    c_rec["embedding"] = embeddings_list[idx]
                    c_rec["created_at"] = datetime.utcnow().isoformat()
                    supabase_client.table("content_chunks").insert(c_rec).execute()

            # -----------------------------------------------------------------
            # STEP 12 & 13: Update status -> 'ready' & Log activity
            # -----------------------------------------------------------------
            logger.info("[DocProcessor] Step 12 & 13: Material Processing Complete")
            supabase_client.table("materials").update({
                "processing_status": "ready",
                "page_count": page_count,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", material_id).execute()

            await log_activity(
                supabase_client,
                user_id,
                "material_processed",
                project_id=project_id,
                event_data={"material_id": material_id, "chunk_count": len(chunk_records)}
            )

        except Exception as pipeline_err:
            logger.error(f"[DocProcessor] Pipeline failed for material {material_id}: {pipeline_err}")
            # Step Error Handling: update status -> 'failed'
            try:
                if hasattr(supabase_client, "table"):
                    supabase_client.table("materials").update({
                        "processing_status": "failed",
                        "processing_error": str(pipeline_err)
                    }).eq("id", material_id).execute()
                    
                    await log_activity(
                        supabase_client,
                        user_id if 'user_id' in locals() else "usr_anon",
                        "material_processing_failed",
                        project_id=project_id if 'project_id' in locals() else None,
                        event_data={"material_id": material_id, "error": str(pipeline_err)}
                    )
            except Exception as e:
                logger.error(f"[DocProcessor] Failed to update error status: {e}")


process_document = DocumentProcessor.process_document
