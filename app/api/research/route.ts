export async function GET() {
  return Response.json({ runs: [] });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    niche?: string;
    market?: string;
    problems?: unknown[];
  };

  if (!body.niche?.trim() || !body.market?.trim() || !Array.isArray(body.problems)) {
    return Response.json({ error: "Invalid research payload" }, { status: 400 });
  }

  return Response.json({
    id: crypto.randomUUID(),
    saved: false,
    message: "Public demo processed the research without permanent storage.",
  }, { status: 201 });
}
