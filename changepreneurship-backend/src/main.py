import os
import sys

# Keep project root on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, make_response
from flask_cors import CORS
from flask_migrate import Migrate

from src.models.assessment import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.assessment import assessment_bp
from src.routes.analytics import analytics_bp


def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), "static"),
    )

    # Make both /path and /path/ work (avoids proxy redirects causing method changes)
    app.url_map.strict_slashes = False

    # Secret key
    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY", "changepreneurship-secret-key-2024-secure"
    )

    # Database config (Render often provides DATABASE_URL)
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url.replace(
            "postgres://", "postgresql://"
        )
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = (
            f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
        )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # CORS for API
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=False,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # DB + migrations
    db.init_app(app)
    Migrate(app, db)

    # Blueprints with API prefixes
    app.register_blueprint(user_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(assessment_bp, url_prefix="/api/assessment")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    # Health check
    @app.get("/health")
    def health():
        return {"status": "ok"}, 200

    # Explicit preflight for all /api/* paths (prevents 405 on OPTIONS)
    @app.route("/api/<path:_any>", methods=["OPTIONS"])
    def api_options(_any):
        resp = make_response("", 204)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return resp

    # Optional static serving / SPA fallback
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path and path != "" and os.path.exists(
            os.path.join(static_folder_path, path)
        ):
            return send_from_directory(static_folder_path, path)
        index_path = os.path.join(static_folder_path or "", "index.html")
        if static_folder_path and os.path.exists(index_path):
            return send_from_directory(static_folder_path, "index.html")
        return ("index.html not found", 404)

    return app


if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 5000))
    app = create_app()
    app.run(host="0.0.0.0", port=PORT, debug=True)
