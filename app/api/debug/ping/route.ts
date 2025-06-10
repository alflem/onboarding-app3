import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    status: "success",
    message: "Debug API is accessible",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown"
  });
}