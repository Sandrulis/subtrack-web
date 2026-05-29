function escHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isSafeHttpUrl(raw: string): boolean {
  const u = raw.trim();
  if (!u) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function extractYoutubeId(raw: string): string | null {
  const t = raw.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  try {
    const u = new URL(t);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const embed = u.pathname.match(/\/embed\/([\w-]{11})/);
      if (embed?.[1]) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

function replaceCodeBlocks(input: string): { text: string; codes: string[] } {
  const codes: string[] = [];
  const text = input.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, (_, code: string) => {
    const idx = codes.length;
    codes.push(`<pre class="blog-code"><code>${escHtml(String(code).trim())}</code></pre>`);
    return `\x00CODE${idx}\x00`;
  });
  return { text, codes };
}

function restoreCodeBlocks(html: string, codes: string[]): string {
  return html.replace(/\x00CODE(\d+)\x00/g, (_, i: string) => codes[Number(i)] ?? "");
}

function applyInlineTags(html: string): string {
  let out = html;
  out = out.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  out = out.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  out = out.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  out = out.replace(
    /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi,
    (_, href: string, label: string) => {
      const url = href.trim();
      if (!isSafeHttpUrl(url)) return escHtml(label);
      return `<a href="${escHtml(url)}" rel="noopener noreferrer" target="_blank">${label}</a>`;
    },
  );
  out = out.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_, inner: string) => {
    const url = inner.trim();
    if (!isSafeHttpUrl(url)) return escHtml(inner);
    return `<a href="${escHtml(url)}" rel="noopener noreferrer" target="_blank">${escHtml(url)}</a>`;
  });
  out = out.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="blog-quote">$1</blockquote>');
  return out;
}

function applyBlockTags(html: string): string {
  let out = html;
  out = out.replace(
    /\[youtube\]([\s\S]*?)\[\/youtube\]/gi,
    (_, inner: string) => {
      const id = extractYoutubeId(String(inner));
      if (!id) return "";
      return (
        `<div class="blog-youtube-wrap">` +
        `<iframe class="blog-youtube" src="https://www.youtube-nocookie.com/embed/${escHtml(id)}" ` +
        `title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
        `</div>`
      );
    },
  );
  out = out.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, (_, inner: string) => {
    const url = String(inner).trim();
    if (!isSafeHttpUrl(url)) return "";
    return `<figure class="blog-figure"><img class="blog-img" src="${escHtml(url)}" alt="" loading="lazy" decoding="async" /></figure>`;
  });
  out = out.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, body: string) => {
    const items = String(body)
      .split(/\[\*\]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item) => `<li>${item}</li>`)
      .join("");
    return items ? `<ul class="blog-list">${items}</ul>` : "";
  });
  return out;
}

/** BBCode -> drošs HTML fragments (izmanto ar dangerouslySetInnerHTML). */
export function parseBbcodeToHtml(input: string): string {
  const { text, codes } = replaceCodeBlocks(input);
  let html = escHtml(text);
  html = applyBlockTags(html);
  html = applyInlineTags(html);
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = html.replace(/\n/g, "<br />");
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = restoreCodeBlocks(html, codes);
  return html;
}

/** Īss teksts bez BBCode (excerpt). */
export function bbcodeToPlainText(input: string, maxLen = 200): string {
  let s = input
    .replace(/\[code\][\s\S]*?\[\/code\]/gi, " ")
    .replace(/\[\/?\w+(?:=[^\]]+)?\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > maxLen) s = `${s.slice(0, maxLen - 1)}…`;
  return s;
}
