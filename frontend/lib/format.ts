/**
 * format.ts — shared markdown → HTML converter
 * Used by: planner, explain, summarize, flashcards, quiz pages
 *
 * Handles the subset of markdown that Groq typically returns:
 *   - **bold**  →  <strong>
 *   - *italic*  →  <em>
 *   - `code`    →  <code>
 *   - ## Heading → <h2> / <h3>
 *   - - bullet   →  <ul><li>
 *   - Blank line →  paragraph break
 */

export function markdownToHtml(md: string): string {
  if (!md) return ""

  const lines = md.split("\n")
  const output: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw.trimEnd()

    // Headings
    if (line.startsWith("### ")) {
      if (inList) { output.push("</ul>"); inList = false }
      output.push(`<h3 class="text-base font-semibold mt-4 mb-1">${inline(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith("## ")) {
      if (inList) { output.push("</ul>"); inList = false }
      output.push(`<h2 class="text-lg font-bold mt-5 mb-2">${inline(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith("# ")) {
      if (inList) { output.push("</ul>"); inList = false }
      output.push(`<h1 class="text-xl font-bold mt-6 mb-2">${inline(line.slice(2))}</h1>`)
      continue
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) { output.push('<ul class="list-disc pl-5 space-y-1">'); inList = true }
      output.push(`<li>${inline(line.slice(2))}</li>`)
      continue
    }

    // Close list on blank or non-bullet line
    if (inList) { output.push("</ul>"); inList = false }

    // Blank line → paragraph spacer
    if (line === "") {
      output.push('<div class="mt-2"></div>')
      continue
    }

    // Normal paragraph line
    output.push(`<p class="leading-relaxed">${inline(line)}</p>`)
  }

  if (inList) output.push("</ul>")
  return output.join("\n")
}

/** Apply inline formatting: bold, italic, inline code */
function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
}
