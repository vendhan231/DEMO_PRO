from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.cloudinary_service import (
    generate_upload_signature,
    is_cloudinary_configured,
)

uploads_bp = Blueprint("uploads", __name__)


@uploads_bp.route("/signature", methods=["POST"])
@jwt_required()
def upload_signature():
    if not is_cloudinary_configured():
        return jsonify({"error": "Cloudinary not configured on server"}), 503

    data = request.get_json() or {}
    resource_type = data.get("resource_type", "image")
    folder = data.get("folder")

    if resource_type == "image":
        folder = folder or "bookverse/covers"
    elif resource_type == "raw":
        folder = folder or "bookverse/pdfs"
    else:
        return jsonify({"error": "Invalid resource_type. Use 'image' or 'raw'"}), 400

    signature_data = generate_upload_signature(resource_type=resource_type, folder=folder)
    if not signature_data:
        return jsonify({"error": "Failed to generate upload signature"}), 500

    return jsonify(signature_data), 200