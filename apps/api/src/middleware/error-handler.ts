import type { ErrorRequestHandler, RequestHandler } from "express";
import { inspectDbError } from "../modules/db-errors.js";
import { ErrorCodes, errorBody, findHttpError } from "../modules/http-error.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json(errorBody(ErrorCodes.notFound, "Not found"));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const httpError = findHttpError(error);
  if (httpError !== undefined) {
    res.status(httpError.status).json(errorBody(httpError.code, httpError.message));
    return;
  }

  if (isParseError(error)) {
    res.status(400).json(errorBody(ErrorCodes.validation, "Request body must be valid JSON"));
    return;
  }

  if (isTooLarge(error)) {
    res.status(400).json(errorBody(ErrorCodes.validation, "Request body is too large"));
    return;
  }

  const info = inspectDbError(error);
  console.error("Unhandled API error", {
    name: error instanceof Error ? error.name : "UnknownError",
    code: info.prismaCode,
  });

  res.status(500).json(errorBody(ErrorCodes.internal, "Internal server error"));
};

function isParseError(error: unknown): boolean {
  if (readType(error) === "entity.parse.failed") {
    return true;
  }
  return error instanceof SyntaxError && readStatus(error) === 400;
}

function isTooLarge(error: unknown): boolean {
  return readType(error) === "entity.too.large";
}

function readType(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "type" in error && typeof error.type === "string") {
    return error.type;
  }
  return undefined;
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return undefined;
}
