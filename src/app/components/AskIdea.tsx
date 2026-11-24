import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, SendHorizontal, Sparkles, X } from "lucide-react";
import rawCatalogue from "../data/artceramic.json";
import { useI18n } from "../i18n/i18n";
import { IdeaLogo } from "./IdeaLogo";
import "./AskIdea.css";

type Product = { id: string; slug: string; name: string; size?: string; color?: string; texture?: string; types?: string[] };
type Message = { role: "assistant" | "user"; text: string; products?: Product[]; offline?: boolean };
const catalogue = rawCatalogue as Product[];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFKC")
    .replace(/[\u064b-\u065f]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/\s+/g, " ").trim();
}
function searchProducts(question: string): Product[] {
  const aliases: Record<string, string> = {
    "حمام": "bathroom", "حمامات": "bathroom", "ارض": "floor", "ارضيات": "floor",
    "حائط": "wall", "حوائط": "wall", "حيطان": "wall", "جدران": "wall",
    "مط": "matt", "لامع": "glossy", "رمادي": "grey", "رصاصي": "grey",
    "ابيض": "white", "اسود": "black"
  };
  const tokens = normalize(question).split(/[^\p{L}\p{N}x]+/u).filter(word => word.length >= 2);
  const terms = [...new Set(tokens.flatMap(word => [word, aliases[word]].filter(Boolean) as string[]))];
  if (!terms.length) return [];
  return catalogue.map(product => {
    const title = normalize(product.name);
    const haystack = normalize([product.name, product.size, product.color, product.texture, ...(product.types ?? [])].join(" "));
    const score = terms.reduce((n, term) => n + (haystack.includes(term) ? (title.includes(term) ? 5 : 2) : 0), 0);
    return { product, score };
  }).filter(row => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(row => row.product);
}

export function AskIdea() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const tr = (arabic: string, english: string) => ar ? arabic : english;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  const send = async (suggestion?: string) => {
    const question = (suggestion ?? draft).trim().slice(0, 750);
    if (!question || busy) return;
    const matches = searchProducts(question);
    setDraft("");
    const userMessage: Message = { role: "user", text: question };
    setMessages(old => [...old, userMessage].slice(-16));
    setBusy(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 22000);
    try {
      const response = await fetch("/api/ask-idea.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ message: question }),
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("assistant-unavailable");
      const data: unknown = await response.json();
      const answer = data && typeof data === "object" && "answer" in data ? data.answer : null;
      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("invalid-answer");
      }
      const assistantMessage: Message = { role: "assistant", text: answer.slice(0, 4000), products: matches };
      setMessages(old => [...old, assistantMessage].slice(-16));
    } catch {
      const fallbackMessage: Message = {
        role: "assistant",
        text: matches.length
          ? tr("لقيت منتجات مطابقة في كتالوج IDEA. تقدر تفتح تفاصيل كل منتج من النتائج دي. الرد الذكي غير متاح دلوقتي، والأسعار والتوافر يؤكدهم المورد.", "I found matching IDEA catalogue products below. The AI service is currently unavailable; suppliers confirm prices and availability.")
          : tr("الرد الذكي غير متاح حاليًا. تقدر تتصفح المنتجات أو استوديو 3D أو أداة تعديل الصور من الروابط. مش هقدّم مقاسات أو مواصفات غير موثقة.", "The AI service is unavailable right now. Explore the catalogue, 3D studio or image visualizer from the links below. I won't invent product specifications."),
        products: matches, offline: true,
      };
      setMessages(old => [...old, fallbackMessage].slice(-16));
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  };

  return <aside className="idea-ask-root" aria-label="Ask IDEA">
    {open && <section className="idea-ask-panel" role="dialog" aria-modal="false" aria-label="Ask IDEA">
      <header className="idea-ask-header">
        <div className="idea-ask-identity"><span className="idea-ask-spark"><Sparkles size={17} /></span>
          <div><strong>ask IDEA</strong><small>{tr("مساعد المنتجات والتصميم", "Product & design assistant")}</small></div>
        </div>
        <button type="button" className="idea-ask-close" onClick={() => setOpen(false)} aria-label={tr("إغلاق المساعد", "Close assistant")}><X size={19}/></button>
      </header>
      <div className="idea-ask-messages" ref={listRef} aria-live="polite" dir={ar ? "rtl" : "ltr"}>
        {messages.length === 0 && <div className="idea-ask-welcome">
          <span className="idea-ask-welcome-icon"><Sparkles size={22}/></span>
          <h3>{tr("أهلاً بيك في IDEA", "Welcome to IDEA")}</h3>
          <p>{tr("اسأل عن خامات السيراميك والبورسلين والمقاسات والاستخدامات، أو دور على منتج في كتالوجنا.", "Ask about ceramic and porcelain materials, dimensions and uses, or find an item in our catalogue.")}</p>
          <div className="idea-ask-suggestions">
            {[tr("مقاسات بلاط الحمام", "Bathroom tile sizes"), tr("بلاط رمادي مط", "Matt grey tiles"), tr("إزاي أجرب الخامة في 3D؟", "How do I try materials in 3D?")].map(item =>
              <button key={item} type="button" disabled={busy} onClick={() => void send(item)}>{item}</button>)}
          </div>
        </div>}
        {messages.map((message, index) =>
          <div key={index} className={`idea-ask-message idea-ask-message--${message.role}`}>
            <div className="idea-ask-bubble">{message.text}</div>
            {message.role === "assistant" && !!message.products?.length && <div className="idea-ask-products">
              {message.products.map(product => <Link key={product.id} to={`/product/${encodeURIComponent(product.slug)}`} onClick={() => setOpen(false)}>
                <span><strong>{product.name}</strong><small>{[product.size, product.color, product.texture].filter(Boolean).join(" · ")}</small></span>
                <ArrowUpRight size={17} aria-hidden="true"/>
              </Link>)}
            </div>}
            {message.offline && <small className="idea-ask-offline">{tr("نتائج كتالوج محلية · خدمة AI غير متاحة", "Local catalogue results · AI unavailable")}</small>}
          </div>)}
        {busy && <p className="idea-ask-thinking" role="status">{tr("IDEA بيدوّر في الكتالوج…", "IDEA is checking the catalogue…")}</p>}
      </div>
      <div className="idea-ask-quick-links">
        <Link to="/products" onClick={() => setOpen(false)}>{tr("المنتجات", "Products")}</Link>
        <Link to="/room-designer/3d" onClick={() => setOpen(false)}>3D Studio</Link>
        <Link to="/ai-room-visualizer" onClick={() => setOpen(false)}>AI Visualizer</Link>
      </div>
      <form className="idea-ask-compose" onSubmit={event => { event.preventDefault(); void send(); }}>
        <textarea ref={inputRef} rows={2} dir={ar ? "rtl" : "ltr"} value={draft} onChange={event => setDraft(event.target.value)}
          maxLength={750} placeholder={tr("اسأل IDEA عن أي خامة أو مقاس…", "Ask IDEA about materials or dimensions…")}
          onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}
          aria-label={tr("سؤالك لـ IDEA", "Your question for IDEA")}/>
        <button type="submit" aria-label={tr("إرسال السؤال", "Send question")} disabled={busy || !draft.trim()}><SendHorizontal size={19}/></button>
      </form>
      <p className="idea-ask-disclaimer">{tr("المواصفات من الكتالوج، والتوافر والسعر يحددهم المورد.", "Catalogue specifications only. Supplier confirms stock and pricing.")}</p>
    </section>}
    <button type="button" className="idea-ask-launcher" onClick={() => setOpen(value => !value)}
      aria-label={open ? tr("إغلاق ask IDEA", "Close ask IDEA") : tr("افتح ask IDEA", "Open ask IDEA")}
      aria-expanded={open} title="ask IDEA">
      <span className="idea-ask-launcher-logo"><IdeaLogo compact /></span>
    </button>
  </aside>;
}
