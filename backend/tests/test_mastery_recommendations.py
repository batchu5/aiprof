import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock
from app.services.mastery_service import MasteryService
from app.services.recommendation_service import RecommendationService


def test_mastery_service_overview_and_growth():
    """Test get_project_mastery and get_growth_data methods."""
    async def run_test():
        mock_supabase = MagicMock()

        # Mock concepts query response
        c_mock = MagicMock()
        c_mock.data = [
            {"id": "c-1", "name": "Neural Networks", "description": "Deep learning models"},
            {"id": "c-2", "name": "Vector Embeddings", "description": "RAG embeddings"}
        ]

        # Mock concept_mastery response
        m_mock = MagicMock()
        m_mock.data = [{
            "concept_id": "c-1",
            "mastery_level": 85.0,
            "previous_level": 70.0,
            "trend": "improving",
            "evidence_count": 5
        }]

        table_mock = MagicMock()
        # Direct return values based on table name
        def table_side_effect(table_name):
            t_mock = MagicMock()
            if table_name == "concepts":
                t_mock.select.return_value.eq.return_value.execute.return_value = c_mock
            elif table_name == "concept_mastery":
                t_mock.select.return_value.eq.return_value.eq.return_value.execute.return_value = m_mock
            elif table_name == "quizzes":
                q_mock = MagicMock()
                q_mock.data = [{"score": 80.0}, {"score": 90.0}]
                t_mock.select.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = q_mock
            return t_mock

        mock_supabase.table.side_effect = table_side_effect

        ms = MasteryService(supabase=mock_supabase)

        # Test mastery overview
        overview = await ms.get_project_mastery("proj-1", "user-1")
        assert "overall_mastery" in overview
        assert overview["total_concepts"] == 2

        # Test growth data
        growth = await ms.get_growth_data("proj-1", "user-1")
        assert "growth_summary" in growth
        assert "concept_trends" in growth
        assert "quiz_performance" in growth

    asyncio.run(run_test())


def test_recommendation_service_generation_and_management():
    """Test generating, getting, dismissing, and completing recommendations."""
    async def run_test():
        mock_supabase = MagicMock()
        mock_gemini = MagicMock()
        mock_gemini.generate_structured = AsyncMock(return_value=[
            {
                "type": "review_material",
                "title": "Review Softmax Loss",
                "description": "Re-read material to reinforce concept understanding.",
                "priority": 9,
                "related_concept": "Softmax Loss"
            }
        ])

        mock_mastery = MagicMock()
        mock_mastery.get_project_mastery = AsyncMock(return_value={
            "concepts": [{"name": "Softmax Loss", "mastery_level": 35.0, "trend": "needs_attention"}]
        })

        rs = RecommendationService(supabase=mock_supabase, gemini_client=mock_gemini, mastery_service=mock_mastery)

        # Generate recommendations
        recs = await rs.generate_recommendations("proj-1", "user-1")
        assert isinstance(recs, list)
        assert len(recs) == 1
        assert recs[0]["title"] == "Review Softmax Loss"

        # Dismiss recommendation
        dismissed = await rs.dismiss_recommendation("rec-1", "user-1")
        assert dismissed["is_dismissed"] is True

        # Complete recommendation
        completed = await rs.complete_recommendation("rec-1", "user-1")
        assert completed["is_completed"] is True

    asyncio.run(run_test())
