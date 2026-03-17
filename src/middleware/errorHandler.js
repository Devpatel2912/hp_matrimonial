import { HttpError } from "../utils/httpError.js";

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: { details: err.details },
    });
  }

  console.error("Unhandled error:", {
    message: err?.message,
    code: err?.code,
    stack: err?.stack,
  });

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
