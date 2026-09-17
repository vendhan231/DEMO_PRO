from app import create_app


def test_mongo_fallback_does_not_report_connected_on_failure():
    app = create_app()
    assert app.config.get("USE_MONGO") is False
    assert app.config.get("MONGO_DB") is None

    health = app.test_client().get("/health")
    payload = health.get_json()
    assert payload["database"] == "sqlite"
    assert payload["mongo"]["connected"] is False
