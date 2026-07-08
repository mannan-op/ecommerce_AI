from django.test import TestCase

from apps.common.exceptions import format_error_response


class ErrorFormatTests(TestCase):
    def test_validation_error_format(self):
        data = {"email": ["This field is required."]}
        result = format_error_response(400, data)
        self.assertFalse(result["success"])
        self.assertEqual(result["error"]["code"], "VALIDATION_ERROR")
        self.assertIn("fields", result["error"])
        self.assertIn("email", result["error"]["fields"])

    def test_rate_limit_code(self):
        result = format_error_response(429, {"detail": "Request was throttled."})
        self.assertEqual(result["error"]["code"], "RATE_LIMITED")

    def test_cart_empty_code(self):
        result = format_error_response(400, {"detail": "Cart is empty."})
        self.assertEqual(result["error"]["code"], "CART_EMPTY")
