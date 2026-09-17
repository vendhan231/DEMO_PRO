import time
import cloudinary
import cloudinary.uploader
import cloudinary.api
from flask import current_app


def init_cloudinary():
    cloud_name = current_app.config.get("CLOUDINARY_CLOUD_NAME")
    api_key = current_app.config.get("CLOUDINARY_API_KEY")
    api_secret = current_app.config.get("CLOUDINARY_API_SECRET")

    if not cloud_name or not api_key or not api_secret:
        return False

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    return True


def generate_upload_signature(resource_type="image", folder=None):
    if not init_cloudinary():
        return None

    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "resource_type": resource_type,
    }
    if folder:
        params["folder"] = folder

    signature = cloudinary.utils.api_sign_request(params, current_app.config["CLOUDINARY_API_SECRET"])
    return {
        "signature": signature,
        "timestamp": timestamp,
        "api_key": current_app.config["CLOUDINARY_API_KEY"],
        "cloud_name": current_app.config["CLOUDINARY_CLOUD_NAME"],
        "folder": folder or "",
        "resource_type": resource_type,
    }


def upload_image(file_stream, folder="bookverse/covers", public_id=None):
    if not init_cloudinary():
        return {"error": "Cloudinary not configured"}

    try:
        result = cloudinary.uploader.upload(
            file_stream,
            resource_type="image",
            folder=folder,
            public_id=public_id,
            overwrite=True,
            transformation=[
                {"width": 800, "height": 1000, "crop": "limit", "quality": "auto:good"}
            ]
        )
        return {
            "secure_url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "format": result.get("format"),
            "width": result.get("width"),
            "height": result.get("height"),
        }
    except Exception as e:
        return {"error": str(e)}


def upload_pdf(file_stream, folder="bookverse/pdfs", public_id=None):
    if not init_cloudinary():
        return {"error": "Cloudinary not configured"}

    try:
        result = cloudinary.uploader.upload(
            file_stream,
            resource_type="raw",
            folder=folder,
            public_id=public_id,
            overwrite=True
        )
        return {
            "secure_url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "format": result.get("format"),
            "bytes": result.get("bytes"),
        }
    except Exception as e:
        return {"error": str(e)}


def delete_asset(public_id, resource_type="image"):
    if not init_cloudinary():
        return {"error": "Cloudinary not configured"}

    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return {"result": result.get("result"), "success": result.get("result") == "ok"}
    except Exception as e:
        return {"error": str(e)}


def is_cloudinary_configured():
    cloud_name = current_app.config.get("CLOUDINARY_CLOUD_NAME")
    api_key = current_app.config.get("CLOUDINARY_API_KEY")
    api_secret = current_app.config.get("CLOUDINARY_API_SECRET")
    return bool(cloud_name and api_key and api_secret)