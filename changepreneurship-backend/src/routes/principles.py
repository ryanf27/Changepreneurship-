from flask import Blueprint, request, jsonify
from src.services.principles_service import get_principles

principles_bp = Blueprint("principles", __name__)

@principles_bp.get("/principles")
def fetch_principles():
    category = request.args.get("category")
    stage = request.args.get("stage")
    limit = request.args.get("limit", 5)
    principles = get_principles(category=category, stage=stage, limit=limit)
    return jsonify(principles)
