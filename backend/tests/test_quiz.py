import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock
from app.services.quiz_service import QuizService


def test_quiz_service_start_and_adaptive_select():
    """Test start_quiz and adaptive question generation algorithm."""
    async def run_test():
        mock_supabase = MagicMock()
        mock_gemini = MagicMock()
        mock_gemini.generate_structured = AsyncMock(return_value={
            "question_text": "What is vector embedding in semantic search?",
            "options": [
                {"label": "A", "text": "Text converted into math vectors.", "is_correct": True},
                {"label": "B", "text": "PDF compression format.", "is_correct": False},
                {"label": "C", "text": "Database encryption key.", "is_correct": False},
                {"label": "D", "text": "HTTP header token.", "is_correct": False}
            ],
            "correct_answer": "A",
            "explanation": "Vector embedding represents semantic text as float arrays."
        })
        mock_gemini.generate_text = AsyncMock(return_value="Great job on completing your quiz!")

        mock_knowledge = MagicMock()
        mock_knowledge.search_knowledge = AsyncMock(return_value=[
            {"source_reference": "Lecture 1", "content": "Vector embeddings represent semantic meanings in space."}
        ])
        mock_knowledge.get_project_context = AsyncMock(return_value={"project": {"learning_goal": "Master AI"}})

        qs = QuizService(supabase=mock_supabase, gemini_client=mock_gemini, knowledge_service=mock_knowledge)

        # Test start_quiz
        res = await qs.start_quiz(
            project_id="test-proj-123",
            user_id="test-user-456",
            num_questions=5,
            question_types=["mcq", "open_ended"]
        )

        assert "quiz_id" in res
        assert "first_question" in res
        q = res["first_question"]
        assert q["question_text"] == "What is vector embedding in semantic search?"
        assert q["question_type"] == "mcq"
        assert q["options"] is not None
        # Verify correct_answer is NOT exposed in client options payload
        assert "is_correct" not in q["options"][0]

    asyncio.run(run_test())


def test_submit_answer_mcq():
    """Test submitting MCQ answer and verifying mastery updates."""
    async def run_test():
        mock_supabase = MagicMock()

        # Mock DB query for question
        q_mock = MagicMock()
        q_mock.data = [{
            "id": "q-1",
            "quiz_id": "qz-1",
            "question_type": "mcq",
            "difficulty": "medium",
            "concept_id": "c-1",
            "concept_name": "Vector Embeddings",
            "correct_answer": "A",
            "explanation": "Option A is correct."
        }]

        # Mock table calls
        table_mock = MagicMock()
        table_mock.select.return_value.eq.return_value.execute.return_value = q_mock
        mock_supabase.table.return_value = table_mock

        qs = QuizService(supabase=mock_supabase)

        res = await qs.submit_answer(
            quiz_id="qz-1",
            question_id="q-1",
            user_id="u-1",
            answer="A"
        )

        assert res["is_correct"] is True
        assert res["score"] == 100.0
        assert "mastery_update" in res
        assert res["mastery_update"]["concept"] == "Vector Embeddings"

    asyncio.run(run_test())


def test_complete_quiz():
    """Test complete_quiz summary generation and overall project mastery updates."""
    async def run_test():
        mock_supabase = MagicMock()
        mock_gemini = MagicMock()
        mock_gemini.generate_text = AsyncMock(return_value="Excellent performance! You scored 100%.")

        qs = QuizService(supabase=mock_supabase, gemini_client=mock_gemini)

        summary = await qs.complete_quiz(
            quiz_id="qz-100",
            user_id="u-1",
            project_id="p-1"
        )

        assert "total_questions" in summary
        assert "score" in summary
        assert "summary" in summary
        assert summary["summary"] == "Excellent performance! You scored 100%."

    asyncio.run(run_test())
