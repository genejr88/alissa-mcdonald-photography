// Shared contract markdown renderer — used by the public signing page and the
// admin template editor's live preview, so the preview matches what clients see.
// Text wrapped in ⟦…⟧ (inserted by the editor preview for merge-field values)
// renders highlighted so it's obvious which parts are auto-filled.

function renderInline(text, keyBase) {
  // Split on bold, italic, and merge-highlight tokens. Bold's token comes
  // first in the alternation so "**x**" wins over the single-asterisk italic
  // pattern at the same position.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|⟦[^⟧]+⟧)/g);
  return parts.map((part, pi) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      if (inner.startsWith('⟦') && inner.endsWith('⟧')) {
        return (
          <strong key={`${keyBase}-${pi}`}>
            <mark className="rounded bg-accent/15 px-0.5 text-inherit">{inner.slice(1, -1)}</mark>
          </strong>
        );
      }
      return <strong key={`${keyBase}-${pi}`}>{inner}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
      return <em key={`${keyBase}-${pi}`}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('⟦') && part.endsWith('⟧')) {
      return (
        <mark key={`${keyBase}-${pi}`} className="rounded bg-accent/15 px-0.5 text-inherit">
          {part.slice(1, -1)}
        </mark>
      );
    }
    return part;
  });
}

const BULLET_RE = /^[-*]\s+(.*)/;
const NUMBERED_RE = /^\d+\.\s+(.*)/;

export function renderMarkdown(md) {
  const lines = md.split('\n');
  const elements = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '---') {
      elements.push(<hr key={key++} className="my-6" style={{ borderColor: 'rgba(46,44,39,0.15)' }} />);
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} className="font-serif text-2xl md:text-3xl mt-8 mb-3" style={{ color: 'var(--ink)' }}>
          {renderInline(line.slice(2), key)}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="font-serif text-lg md:text-xl mt-6 mb-2 font-semibold" style={{ color: 'var(--ink)' }}>
          {renderInline(line.slice(3), key)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold mt-4 mb-1" style={{ color: 'var(--ink)' }}>
          {renderInline(line.slice(4), key)}
        </h3>
      );
      i++;
      continue;
    }

    // Bullet list — consume consecutive "- "/"* " lines into one <ul>
    if (BULLET_RE.test(line)) {
      const items = [];
      while (i < lines.length && BULLET_RE.test(lines[i])) {
        items.push(lines[i].match(BULLET_RE)[1]);
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc pl-5 mb-2 space-y-0.5">
          {items.map((item, ii) => (
            <li key={ii} className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
              {renderInline(item, `${key}-${ii}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list — consume consecutive "1. " lines into one <ol>
    if (NUMBERED_RE.test(line)) {
      const items = [];
      while (i < lines.length && NUMBERED_RE.test(lines[i])) {
        items.push(lines[i].match(NUMBERED_RE)[1]);
        i++;
      }
      elements.push(
        <ol key={key++} className="list-decimal pl-5 mb-2 space-y-0.5">
          {items.map((item, ii) => (
            <li key={ii} className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
              {renderInline(item, `${key}-${ii}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-3" />);
      i++;
      continue;
    }

    elements.push(
      <p key={key++} className="text-sm leading-relaxed mb-1" style={{ color: 'var(--ink)' }}>
        {renderInline(line, key)}
      </p>
    );
    i++;
  }

  return elements;
}
