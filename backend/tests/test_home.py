import pytest
import asyncio
from unittest.mock import MagicMock
from app.routers.home import get_home_dashboard


def test_get_home_dashboard():
    """Test get_home_dashboard returns all expected fields for home view."""
    async def run_test():
        mock_user = {"id": "user-123", "email": "student@university.edu", "full_name": "Varsh"}
        mock_supabase = MagicMock()

        dashboard = await get_home_dashboard(current_user=mock_user, supabase_client=mock_supabase)
        assert "welcome_message" in dashboard
        assert "Varsh" in dashboard["welcome_message"]
        assert "continue_learning" in dashboard
        assert "recent_projects" in dashboard
        assert "overall_progress" in dashboard
        assert "areas_to_improve" in dashboard
        assert "recommended_actions" in dashboard
        assert "activity_summary" in dashboard

    asyncio.run(run_test())
