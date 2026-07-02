import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const message = body.message;

  // Simulate thinking time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json({
    response: `You said: ${message}`,
  });
}