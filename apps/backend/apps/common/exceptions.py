from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class BusinessError(APIException):
    status_code = 400
    default_code = "BUSINESS_ERROR"

    def __init__(self, message: str, code: str | None = None, status_code: int = 400):
        self.detail = message
        if code:
            self.default_code = code
        self.status_code = status_code
        super().__init__(detail=message, code=code or self.default_code)


def _extract_fields(data: dict) -> dict | None:
    fields = {}
    for key, value in data.items():
        if key in ("detail", "non_field_errors"):
            continue
        if isinstance(value, list):
            fields[key] = [str(v) for v in value]
    return fields or None


def _error_code(status_code: int, fields: dict | None, detail: str) -> str:
    if fields:
        return "VALIDATION_ERROR"
    if status_code == 401:
        return "UNAUTHORIZED"
    if status_code == 403:
        return "FORBIDDEN"
    if status_code == 404:
        return "NOT_FOUND"
    if status_code == 429:
        return "RATE_LIMITED"
    if "empty" in detail.lower():
        return "CART_EMPTY"
    return "API_ERROR"


def format_error_response(status_code: int, data) -> dict:
    if isinstance(data, dict):
        detail = data.get("detail", "Request failed.")
        if isinstance(detail, list):
            detail = detail[0] if detail else "Request failed."
        fields = _extract_fields(data)
        if "non_field_errors" in data:
            detail = str(data["non_field_errors"][0])
    else:
        detail = str(data)
        fields = None

    code = _error_code(status_code, fields if isinstance(data, dict) else None, detail)
    error = {"code": code, "message": str(detail)}
    if isinstance(data, dict):
        field_errors = _extract_fields(data)
        if field_errors:
            error["fields"] = field_errors

    return {"success": False, "error": error}


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = format_error_response(response.status_code, response.data)
    return response
