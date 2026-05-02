import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public details?: unknown
  ) {
    super(message);
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    const message = error.status >= 500 ? "Internal server error" : error.message;

    return NextResponse.json(
      {
        error: message,
        details: error.details ?? null,
      },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.flatten(),
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new ApiError("Content-Type must be application/json", 415);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }

  return schema.parse(body);
}
