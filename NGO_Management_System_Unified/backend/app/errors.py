import logging

from flask import jsonify
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def api_error(error: ApiError):
        return jsonify({"detail": error.detail}), error.status

    @app.errorhandler(HTTPException)
    def http_error(error: HTTPException):
        return jsonify({"detail": error.description or error.name}), error.code or 500

    @app.errorhandler(Exception)
    def unexpected(error: Exception):
        logger.exception("Unhandled error")
        return jsonify({"detail": "Unexpected server error."}), 500
