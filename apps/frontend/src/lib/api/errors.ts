export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    (data as ApiErrorBody).success === false &&
    "error" in data
  );
}

export function parseApiError(data: unknown, fallback = "Something went wrong"): {
  message: string;
  code: string;
  fields?: Record<string, string[]>;
} {
  if (isApiErrorBody(data)) {
    return {
      message: data.error.message,
      code: data.error.code,
      fields: data.error.fields,
    };
  }
  if (typeof data === "object" && data !== null && "detail" in data) {
    return {
      message: String((data as { detail: string }).detail),
      code: "API_ERROR",
    };
  }
  return { message: fallback, code: "UNKNOWN" };
}

export function getFieldError(
  fields: Record<string, string[]> | undefined,
  field: string
): string | undefined {
  return fields?.[field]?.[0];
}
