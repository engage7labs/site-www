import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ detail: "This route is retired." }, { status: 410 });
}
