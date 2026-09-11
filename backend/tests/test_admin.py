import pytest
import asyncio
from unittest.mock import MagicMock
from app.services.admin_service import AdminService


def test_admin_service_methods():
    """Test platform overview, user management, activity, AI usage, and health checks in AdminService."""
    async def run_test():
        mock_supabase = MagicMock()

        # Mock database queries for profiles, spaces, projects, materials, activity, AI logs
        def table_side_effect(table_name):
            t_mock = MagicMock()

            if table_name == "profiles":
                p_mock = MagicMock()
                p_mock.data = [
                    {"id": "usr-1", "email": "admin@test.com", "full_name": "Admin User", "role": "admin", "created_at": "2026-09-01T00:00:00Z"},
                    {"id": "usr-2", "email": "student@test.com", "full_name": "Student User", "role": "user", "created_at": "2026-09-05T00:00:00Z"}
                ]
                t_mock.select.return_value.execute.return_value = p_mock
                t_mock.select.return_value.order.return_value.execute.return_value = p_mock
                t_mock.select.return_value.eq.return_value.execute.return_value = p_mock

            elif table_name == "spaces":
                s_mock = MagicMock()
                s_mock.data = [
                    {"id": "sp-1", "name": "AI Systems", "user_id": "usr-1", "created_at": "2026-09-02T00:00:00Z"}
                ]
                t_mock.select.return_value.execute.return_value = s_mock
                t_mock.select.return_value.order.return_value.execute.return_value = s_mock
                t_mock.select.return_value.eq.return_value.execute.return_value = s_mock

            elif table_name == "projects":
                pj_mock = MagicMock()
                pj_mock.data = [
                    {"id": "pj-1", "name": "RAG Pipeline", "status": "active", "overall_mastery": 88.0, "user_id": "usr-1", "created_at": "2026-09-03T00:00:00Z"}
                ]
                t_mock.select.return_value.execute.return_value = pj_mock
                t_mock.select.return_value.order.return_value.execute.return_value = pj_mock
                t_mock.select.return_value.eq.return_value.execute.return_value = pj_mock

            elif table_name == "materials":
                m_mock = MagicMock()
                m_mock.data = [
                    {"id": "mat-1", "processing_status": "ready"},
                    {"id": "mat-2", "processing_status": "processing"}
                ]
                t_mock.select.return_value.execute.return_value = m_mock

            elif table_name == "activity_events":
                act_mock = MagicMock()
                act_mock.data = [
                    {"id": "ev-1", "user_id": "usr-1", "event_type": "quiz_completed", "created_at": "2026-09-10T10:00:00Z"}
                ]
                t_mock.select.return_value.gte.return_value.execute.return_value = act_mock
                t_mock.select.return_value.order.return_value.limit.return_value.execute.return_value = act_mock
                t_mock.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = act_mock

            elif table_name == "ai_usage_logs":
                ai_mock = MagicMock()
                ai_mock.data = [
                    {"status": "success", "latency_ms": 1200, "created_at": "2026-09-10T10:00:00Z"},
                    {"status": "error", "latency_ms": 2500, "created_at": "2026-09-10T11:00:00Z"}
                ]
                t_mock.select.return_value.gte.return_value.execute.return_value = ai_mock

            return t_mock

        mock_supabase.table.side_effect = table_side_effect
        service = AdminService(supabase=mock_supabase)

        # 1. Platform Overview
        overview = await service.get_platform_overview()
        assert overview["users"]["total"] == 2
        assert overview["spaces"]["total"] == 1
        assert overview["projects"]["total"] == 1
        assert overview["materials"]["total"] == 2
        assert "system_health" in overview

        # 2. Users list & search
        users_resp = await service.get_users_list(page=1, per_page=10, search="admin")
        assert users_resp["total"] == 1
        assert users_resp["users"][0]["email"] == "admin@test.com"

        # 3. User detail
        user_detail = await service.get_user_detail("usr-1")
        assert "profile" in user_detail
        assert "stats" in user_detail
        assert "spaces" in user_detail

        # 4. Spaces & Projects
        spaces_resp = await service.get_all_spaces()
        assert len(spaces_resp["spaces"]) == 1

        projects_resp = await service.get_all_projects()
        assert len(projects_resp["projects"]) == 1

        # 5. Activity Feed
        activity_resp = await service.get_platform_activity()
        assert len(activity_resp["events"]) >= 1

        # 6. Learning Analytics & AI Analytics
        learning_analytics = await service.get_learning_analytics()
        assert "engagement" in learning_analytics
        assert "mastery_distribution" in learning_analytics

        ai_analytics = await service.get_ai_analytics()
        assert "stats" in ai_analytics
        assert "requests_over_time" in ai_analytics

        # 7. Health & Evaluation
        health = await service.get_system_health()
        assert health["status"] == "healthy"

        eval_summary = await service.get_ai_evaluation_summary()
        assert "overall_quality_score" in eval_summary

    asyncio.run(run_test())
