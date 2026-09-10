from datetime import datetime, timezone


def get_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sanitize_filename(filename: str) -> str:
    return "".join(c for c in filename if c.isalnum() or c in (".", "_", "-")).rstrip()
