type RedditChild = {
  data: {
    title?: string;
    selftext?: string;
    subreddit?: string;
    permalink?: string;
    score?: number;
    num_comments?: number;
    over_18?: boolean;
  };
};

export async function GET(request: Request) {
  const runtime = process.env;
  if (!runtime.REDDIT_CLIENT_ID || !runtime.REDDIT_CLIENT_SECRET) {
    return Response.json({ error: "Reddit ещё не активирован: добавь Client ID и Client Secret приложения.", setupRequired: true }, { status: 503 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const subreddit = url.searchParams.get("subreddit")?.trim().replace(/^r\//, "");
  const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit")) || 75));
  const time = ["day", "week", "month", "year", "all"].includes(url.searchParams.get("time") || "") ? url.searchParams.get("time")! : "year";
  if (!query) return Response.json({ error: "Укажи нишу или поисковую фразу." }, { status: 400 });

  try {
    const basic = btoa(`${runtime.REDDIT_CLIENT_ID}:${runtime.REDDIT_CLIENT_SECRET}`);
    const tokenResponse = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: { authorization: `Basic ${basic}`, "content-type": "application/x-www-form-urlencoded", "user-agent": runtime.REDDIT_USER_AGENT || "web:opportunity-engine:1.0 (by /u/opportunity_engine)" },
      body: "grant_type=client_credentials",
    });
    if (!tokenResponse.ok) throw new Error(`Reddit OAuth failed (${tokenResponse.status})`);
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) throw new Error("Reddit did not return an access token");

    const searchUrl = new URL(subreddit ? `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/search` : "https://oauth.reddit.com/search");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("limit", String(limit));
    searchUrl.searchParams.set("sort", "relevance");
    searchUrl.searchParams.set("t", time);
    searchUrl.searchParams.set("raw_json", "1");
    if (subreddit) searchUrl.searchParams.set("restrict_sr", "1");
    const searchResponse = await fetch(searchUrl, { headers: { authorization: `Bearer ${token.access_token}`, "user-agent": runtime.REDDIT_USER_AGENT || "web:opportunity-engine:1.0 (by /u/opportunity_engine)" } });
    if (!searchResponse.ok) throw new Error(`Reddit search failed (${searchResponse.status})`);
    const payload = await searchResponse.json() as { data?: { children?: RedditChild[] } };
    const posts = (payload.data?.children || []).filter((child) => !child.data.over_18).map((child) => ({
      title: child.data.title || "",
      text: child.data.selftext || "",
      subreddit: child.data.subreddit || "",
      url: `https://www.reddit.com${child.data.permalink || ""}`,
      score: child.data.score || 0,
      comments: child.data.num_comments || 0,
    })).filter((post) => post.title.length > 8);
    return Response.json({ posts, count: posts.length });
  } catch (error) {
    console.error("reddit:search", error);
    return Response.json({ error: error instanceof Error ? error.message : "Reddit search is unavailable" }, { status: 502 });
  }
}
