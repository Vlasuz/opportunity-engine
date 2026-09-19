"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, BookOpen, ChevronRight, CircleDollarSign, Clock3, ExternalLink, Flame, Layers3, MessageCircle, Plus, Search, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";

type Evidence = { quote: string; source: string; url?: string };
type Problem = { id: string; title: string; category: string; mentions: number; severity: number; willingness: number; score: number; currentFix: string; angle: string; evidence: Evidence[] };
type RedditPost = { title: string; text: string; subreddit: string; url: string; score: number; comments: number };

const demoProblems: Problem[] = [
  { id: "missed-leads", title: "Пропущенные звонки после рабочего дня", category: "Лиды", mentions: 184, severity: 9, willingness: 9, score: 91, currentFix: "Голосовая почта, личный телефон владельца, answering service", angle: "AI-рецепционист для roofing: отвечает 24/7, задаёт 5 вопросов и назначает осмотр.", evidence: [{ quote: "By the time I call back in the morning, they already booked another roofer.", source: "r/Roofing" }, { quote: "We pay an answering service but the notes are usually useless.", source: "r/smallbusiness" }] },
  { id: "slow-estimates", title: "Сметы готовятся слишком долго", category: "Продажи", mentions: 137, severity: 8, willingness: 8, score: 84, currentFix: "Excel, PDF-шаблоны, ручные замеры и фото в WhatsApp", angle: "Черновик сметы из формы, фотографий и прайс-листа за 10 минут.", evidence: [{ quote: "I spend Sunday nights turning field notes into estimates.", source: "Contractor forum" }, { quote: "Customers go cold if the quote takes more than two days.", source: "Capterra review" }] },
  { id: "follow-up", title: "Менеджеры забывают follow-up", category: "CRM", mentions: 119, severity: 8, willingness: 7, score: 79, currentFix: "Заметки, календарь и память менеджера", angle: "Автоматическая цепочка SMS/email до ответа клиента или смены статуса.", evidence: [{ quote: "Our CRM is full of leads nobody touched for three weeks.", source: "G2 review" }, { quote: "I need something simpler than another full CRM.", source: "r/Construction" }] },
  { id: "scheduling", title: "Хаос с выездами и расписанием бригад", category: "Операции", mentions: 91, severity: 7, willingness: 8, score: 76, currentFix: "Google Calendar + групповая переписка", angle: "Диспетчерская доска: заявки, районы, навыки бригад и автоматические уведомления.", evidence: [{ quote: "A rain delay means I spend an hour texting every customer and crew.", source: "Roofing forum" }] },
  { id: "reviews", title: "Отзывы просят нерегулярно", category: "Репутация", mentions: 73, severity: 5, willingness: 6, score: 61, currentFix: "Менеджер отправляет ссылку вручную", angle: "Запрос отзыва после оплаты с приватным сбором негатива.", evidence: [{ quote: "We finish good jobs but almost nobody leaves a review.", source: "r/smallbusiness" }] },
];

const categoryRules = [
  { id: "missed", title: "Пропущенные и медленные ответы", category: "Лиды", keys: ["missed", "call back", "after hours", "no answer", "lead", "звон", "заявк"] },
  { id: "estimate", title: "Медленные сметы и предложения", category: "Продажи", keys: ["estimate", "quote", "proposal", "смет", "расчет", "кп"] },
  { id: "follow", title: "Follow-up делается вручную", category: "CRM", keys: ["follow up", "follow-up", "forgot", "crm", "remind", "напом", "забы"] },
  { id: "schedule", title: "Проблемы с расписанием", category: "Операции", keys: ["schedule", "calendar", "dispatch", "appointment", "распис", "выезд"] },
  { id: "manual", title: "Ручной перенос данных", category: "Автоматизация", keys: ["manual", "spreadsheet", "excel", "copy", "paste", "data entry", "вручную", "таблиц"] },
  { id: "expensive", title: "Текущий софт слишком дорогой или сложный", category: "Софт", keys: ["expensive", "price", "complicated", "bloated", "дорого", "сложн"] },
];

function analyzeText(raw: string, niche: string, redditPosts: RedditPost[] = []): Problem[] {
  const lines = redditPosts.length
    ? redditPosts.map((post) => `${post.title}. ${post.text}`.trim())
    : raw.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 12);
  const lower = lines.map((line) => line.toLowerCase());
  return categoryRules.map((rule) => {
    const matched = lines.filter((_, index) => rule.keys.some((key) => lower[index].includes(key)));
    const ratio = lines.length ? matched.length / lines.length : 0;
    const severity = Math.min(10, 5 + Math.round(ratio * 9));
    const willingness = rule.id === "manual" || rule.id === "missed" ? 8 : 7;
    const score = Math.min(96, Math.round(35 + ratio * 45 + severity * 1.5 + willingness * 1.5));
    return { id: `${rule.id}-${Date.now()}`, title: rule.title, category: rule.category, mentions: matched.length, severity, willingness, score, currentFix: "Нужно уточнить в интервью: какой процесс или инструмент используют сейчас.", angle: `Узкий инструмент для ${niche || "этой ниши"}, который убирает этот шаг и показывает измеримый результат.`, evidence: matched.slice(0, 3).map((quote) => {
      const post = redditPosts.find((item) => `${item.title}. ${item.text}`.trim() === quote);
      return { quote: quote.slice(0, 360), source: post ? `r/${post.subreddit} · ${post.score} score · ${post.comments} comments` : "Импортированный материал", url: post?.url };
    }) };
  }).filter((problem) => problem.mentions > 0).sort((a, b) => b.score - a.score);
}

export function OpportunityDashboard() {
  const [niche, setNiche] = useState("Roofing");
  const [market, setMarket] = useState("United States");
  const [sourceText, setSourceText] = useState("");
  const [sourceMode, setSourceMode] = useState<"manual" | "reddit">("reddit");
  const [subreddit, setSubreddit] = useState("");
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([]);
  const [problems, setProblems] = useState<Problem[]>(demoProblems);
  const [selectedId, setSelectedId] = useState(demoProblems[0].id);
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("Демо-исследование · 604 упоминания");
  const filtered = useMemo(() => problems.filter((problem) => `${problem.title} ${problem.category}`.toLowerCase().includes(query.toLowerCase())), [problems, query]);
  const selected = problems.find((problem) => problem.id === selectedId) ?? filtered[0] ?? problems[0];

  async function runResearch() {
    let importedPosts = redditPosts;
    let analysisText = sourceText;
    if (sourceMode === "reddit") {
      setIsSaving(true);
      setNotice("Ищу обсуждения в Reddit…");
      try {
        const params = new URLSearchParams({ q: niche, limit: "100", time: "year" });
        if (subreddit.trim()) params.set("subreddit", subreddit.trim().replace(/^r\//, ""));
        const response = await fetch(`/api/reddit/search?${params}`);
        const data = await response.json() as { posts?: RedditPost[]; error?: string; setupRequired?: boolean };
        if (!response.ok || !data.posts) throw new Error(data.error || "Reddit search failed");
        importedPosts = data.posts;
        analysisText = data.posts.map((post) => `${post.title}. ${post.text}`).join("\n");
        setRedditPosts(data.posts);
        setSourceText(analysisText);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Reddit временно недоступен");
        setIsSaving(false);
        return;
      }
    }
    const next = analysisText.trim() ? analyzeText(analysisText, niche, sourceMode === "reddit" ? importedPosts : []) : demoProblems.map((p) => ({ ...p, id: `${p.id}-${Date.now()}` }));
    if (!next.length) { setNotice("Не нашёл повторяющихся маркеров — добавь больше исходных сообщений"); return; }
    setProblems(next); setSelectedId(next[0].id); setNotice(`${sourceMode === "reddit" ? importedPosts.length + " Reddit-постов" : next.reduce((sum, p) => sum + p.mentions, 0) + " совпадений"} · ${next.length} кластеров`); setIsSaving(true);
    try {
      const response = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ niche, market, sourceText, problems: next }) });
      if (!response.ok) throw new Error("save failed");
      setNotice((current) => `${current} · обработано`);
    } catch { setNotice((current) => `${current} · без сохранения`); } finally { setIsSaving(false); }
  }

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "start_opportunity_research", title: "Запустить исследование ниши", description: "Запускает анализ вставленных обсуждений и показывает кластеры бизнес-проблем.",
      inputSchema: { type: "object", properties: { niche: { type: "string" }, market: { type: "string" }, sourceText: { type: "string" } }, required: ["niche", "market", "sourceText"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async (input: unknown) => {
        const value = input as { niche?: string; market?: string; sourceText?: string };
        if (!value.niche || !value.market || !value.sourceText) throw new Error("niche, market and sourceText are required");
        const result = analyzeText(value.sourceText, value.niche);
        setNiche(value.niche); setMarket(value.market); setSourceText(value.sourceText); setProblems(result); setSelectedId(result[0]?.id ?? "");
        return { clusters: result.length, topOpportunity: result[0]?.title ?? null };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <main className="min-h-screen bg-[#070b12] text-[#eef2f7]">
      <header className="border-b border-white/8 bg-[#0a101a]/95"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-7"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#71f6bd] text-[#07110c]"><Target className="size-5" /></div><div><div className="font-semibold tracking-tight">Opportunity Engine</div><div className="text-xs text-slate-500">problem intelligence</div></div></div><div className="flex items-center gap-2 text-sm text-slate-400"><span className="size-2 rounded-full bg-[#71f6bd]" /> private workspace</div></div></header>
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 sm:py-7">
        <section className="rounded-2xl border border-white/10 bg-[#0d1420] p-4 shadow-2xl shadow-black/20 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant={sourceMode === "reddit" ? "default" : "outline"} onClick={() => setSourceMode("reddit")} className={sourceMode === "reddit" ? "bg-[#ff4500] text-white hover:bg-[#ff5b20]" : "border-white/10 bg-transparent"}><MessageCircle /> Reddit</Button>
            <Button type="button" size="sm" variant={sourceMode === "manual" ? "default" : "outline"} onClick={() => setSourceMode("manual")} className={sourceMode === "manual" ? "bg-[#71f6bd] text-[#07110c]" : "border-white/10 bg-transparent"}><BookOpen /> Ручной импорт</Button>
            <span className="ml-auto text-xs text-slate-500">{sourceMode === "reddit" ? "Официальный OAuth API · посты за 12 месяцев" : "Один материал на строку"}</span>
          </div>
          <div className={`grid gap-3 ${sourceMode === "reddit" ? "lg:grid-cols-[1fr_210px_210px_auto]" : "lg:grid-cols-[1fr_210px_auto]"}`}>
            <label className="space-y-2"><span className="text-sm font-medium text-slate-300">Ниша</span><Input value={niche} onChange={(e) => setNiche(e.target.value)} className="h-11 border-white/10 bg-[#090f18] text-base" placeholder="Roofing, HVAC, dentists…" /></label>
            <label className="space-y-2"><span className="text-sm font-medium text-slate-300">Рынок</span><NativeSelect value={market} onChange={(e) => setMarket(e.target.value)} className="h-11 w-full border-white/10 bg-[#090f18]"><NativeSelectOption>United States</NativeSelectOption><NativeSelectOption>Spain</NativeSelectOption><NativeSelectOption>European Union</NativeSelectOption><NativeSelectOption>Canada</NativeSelectOption></NativeSelect></label>
            {sourceMode === "reddit" && <label className="space-y-2"><span className="text-sm font-medium text-slate-300">Subreddit <span className="text-slate-600">необязательно</span></span><Input value={subreddit} onChange={(e) => setSubreddit(e.target.value)} className="h-11 border-white/10 bg-[#090f18]" placeholder="smallbusiness" /></label>}
            <Button onClick={runResearch} disabled={isSaving} className="mt-auto h-11 rounded-xl bg-[#71f6bd] px-5 font-semibold text-[#07110c] hover:bg-[#93ffd0]"><Sparkles />{isSaving ? "Анализ…" : "Найти возможности"}</Button>
          </div>
          {sourceMode === "manual" && <details className="mt-4 group" open><summary className="cursor-pointer list-none text-sm text-slate-400 hover:text-white"><span className="inline-flex items-center gap-2"><Plus className="size-4 transition-transform group-open:rotate-45" />Вставить обсуждения, отзывы или вакансии</span></summary><div className="mt-3 grid gap-3 lg:grid-cols-[1fr_270px]"><Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} className="min-h-36 border-white/10 bg-[#090f18]" placeholder={'Каждое сообщение с новой строки. Например:\n“We miss calls after 6pm…”\n“Our CRM is too expensive…”'} /><div className="rounded-xl border border-dashed border-white/12 p-4 text-sm leading-6 text-slate-400"><BookOpen className="mb-3 size-5 text-[#71f6bd]" />MVP ищет повторяющиеся сигналы: ручная работа, потерянные лиды, сметы, расписание, дорогой софт. Исходные цитаты остаются рядом с выводом.</div></div></details>}
          {sourceMode === "reddit" && <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/8 bg-[#090f18] px-3 py-2.5 text-xs leading-5 text-slate-500"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>Поиск работает через разрешённый Reddit Data API. Система не собирает email и не профилирует пользователей — только анализирует публичные обсуждения и сохраняет ссылки на источники.</span></div>}
        </section>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1420]">
            <div className="flex flex-col gap-3 border-b border-white/8 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h1 className="text-xl font-semibold">Проблемы в {niche}</h1><p className="mt-1 text-sm text-slate-500">{notice}</p></div><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border-white/10 bg-[#090f18] pl-9 sm:w-60" placeholder="Фильтр проблем" /></label></div>
            <div className="grid grid-cols-[minmax(0,1fr)_76px_78px] border-b border-white/8 px-4 py-2 text-xs uppercase tracking-wider text-slate-600 sm:grid-cols-[minmax(0,1fr)_110px_90px_90px] sm:px-5"><span>Проблема</span><span className="hidden sm:block">Упоминания</span><span>Сила</span><span>Score</span></div>
            <div>{filtered.map((problem) => <button key={problem.id} onClick={() => setSelectedId(problem.id)} className={`grid w-full grid-cols-[minmax(0,1fr)_76px_78px] items-center gap-2 border-b border-white/6 px-4 py-4 text-left transition sm:grid-cols-[minmax(0,1fr)_110px_90px_90px] sm:px-5 ${selected?.id === problem.id ? "bg-[#13231f]" : "hover:bg-white/[0.025]"}`}><span className="min-w-0"><span className="block truncate font-medium">{problem.title}</span><span className="mt-1 block text-xs text-slate-500">{problem.category}</span></span><span className="hidden text-sm text-slate-400 sm:block">{problem.mentions}</span><span className="text-sm text-slate-400">{problem.severity}/10</span><span className="flex items-center justify-end gap-2"><span className={`font-semibold ${problem.score >= 80 ? "text-[#71f6bd]" : problem.score >= 70 ? "text-amber-300" : "text-slate-400"}`}>{problem.score}</span><ChevronRight className="size-4 text-slate-600" /></span></button>)}</div>
          </section>
          {selected && <aside className="rounded-2xl border border-white/10 bg-[#0d1420] p-5 xl:sticky xl:top-5 xl:self-start">
            <div className="flex items-start justify-between gap-4"><div><div className="mb-2 inline-flex rounded-full bg-[#71f6bd]/10 px-2.5 py-1 text-xs font-medium text-[#71f6bd]">Opportunity {selected.score}/100</div><h2 className="text-xl font-semibold leading-snug">{selected.title}</h2></div><Flame className="size-6 shrink-0 text-orange-400" /></div>
            <div className="mt-5 grid grid-cols-3 gap-2">{[{ icon: BarChart3, label: "Частота", value: selected.mentions }, { icon: Clock3, label: "Боль", value: `${selected.severity}/10` }, { icon: CircleDollarSign, label: "Оплата", value: `${selected.willingness}/10` }].map((metric) => <div key={metric.label} className="rounded-xl bg-[#091019] p-3"><metric.icon className="mb-3 size-4 text-slate-500" /><div className="font-semibold">{metric.value}</div><div className="mt-1 text-xs text-slate-600">{metric.label}</div></div>)}</div>
            <div className="mt-5"><div className="mb-2 flex justify-between text-sm"><span className="text-slate-400">Коммерческий потенциал</span><span>{selected.score}%</span></div><Progress value={selected.score} className="bg-white/8 [&_[data-slot=progress-indicator]]:bg-[#71f6bd]" /></div>
            <div className="mt-6 space-y-5"><div><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300"><Layers3 className="size-4" />Как решают сейчас</h3><p className="text-sm leading-6 text-slate-400">{selected.currentFix}</p></div><div className="rounded-xl border border-[#71f6bd]/18 bg-[#71f6bd]/[0.055] p-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#93ffd0]"><Sparkles className="size-4" />Продуктовый угол</h3><p className="text-sm leading-6 text-slate-300">{selected.angle}</p></div><div><h3 className="mb-3 text-sm font-semibold text-slate-300">Свидетельства</h3><div className="space-y-2">{selected.evidence.map((item, index) => <blockquote key={index} className="rounded-xl border border-white/8 bg-[#091019] p-3 text-sm leading-6 text-slate-400"><p>“{item.quote}”</p><footer className="mt-2 flex items-center gap-1 text-xs text-slate-600">{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[#71f6bd]">{item.source}<ExternalLink className="size-3" /></a> : item.source}</footer></blockquote>)}</div></div></div>
          </aside>}
        </div>
      </div>
    </main>
  );
}
