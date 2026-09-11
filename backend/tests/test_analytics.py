import pytest
import asyncio
from unittest.mock import MagicMock
from app.services.analytics_service import AnalyticsService


def test_analytics_service_methods():
    """Test get_project_analytics, get_global_analytics, and get_ai_usage_stats."""
    async def run_test():
        mock_supabase = MagicMock()

        # Mock table calls
        def table_side_effect(table_name):
            t_mock = MagicMock()

            if table_name == "activity_events":
                e_mock = MagicMock()
                e_mock.data = [
                    {"event_type": "tutor_message_sent", "created_at": "2026-09-10T10:00:00Z"},
                    {"event_type": "quiz_started", "created_at": "2026-09-10T11:00:00Z"},
                    {"event_type": "quiz_answer_submitted", "created_at": "2026-09-10T11:05:00Z"}
                ]
                t_mock.select.return_value.eq.return_value.eq.return_value.gte.return_value.order.return_value.execute.return_value = e_mock

            elif table_name == "concepts":
                c_mock = MagicMock()
                c_mock.data = [
                    {"id": "c-1", "name": "Neural Networks"},
                    {"id": "c-2", "name": "Softmax Loss"}
                ]
                t_mock.select.return_value.eq.return_value.execute.return_value = c_mock

            elif table_name == "quizzes":
                q_mock = MagicMock()
                q_mock.data = [{"score": 85.0}, {"score": 90.0}]
                t_mock.select.return_value.eq.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = q_mock

            return t_mock

        mock_supabase.table.side_effect = table_side_effect

        ans = AnalyticsService(supabase=mock_supabase)

        # 1. Project Analytics
        proj_analytics = await ans.get_project_analytics("proj-1", "user-1")
        assert "activity" in proj_analytics
        assert "performance" in proj_analytics
        assert "growth" in proj_analytics
        assert "ai_activity" in proj_analytics
        assert proj_analytics["performance"]["avg_quiz_score"] == 87.5

        # 2. Global Analytics
        global_analytics = await ans.get_global_analytics("user-1")
        assert "overall_learning" in global_analytics
        assert "learning_performance" in global_analytics
        assert "trends" in global_analytics

        # 3. AI Usage Stats
        ai_stats = await ans.get_ai_usage_stats(user_id="user-1", days=30)
        assert "total_requests" in ai_stats
        assert "by_feature" in ai_stats
        assert "by_model" in ai_stats

    asyncio.run(run_test())
