// Shared contract markdown renderer — used by the public signing page and the
// admin template editor's live preview, so the preview matches what clients see.
// Text wrapped in ⟦…⟧ (inserted by the editor preview for merge-field values)
// renders highlighted so it's obvious which parts are auto-filled.

function renderInline(text, keyBase) {
  // Split on bold and merge-highlight tokens
  const parts = text.split(/(\*\*[^*]+\*\*|⟦[^⟧]+⟧)/g);
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

export function renderMarkdown(md) {
  const lines = md.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} className="font-serif text-2xl md:text-3xl mt-8 mb-3" style={{ color: 'var(--ink)' }}>
          {renderInline(line.slice(2), key)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="font-serif text-lg md:text-xl mt-6 mb-2 font-semibold" style={{ color: 'var(--ink)' }}>
          {renderInline(line.slice(3), key)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold mt-4 mb-1" style={{ color: 'var(--ink)' }}>
          {renderInline(line.slice(4), key)}
        </h3>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-3" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm leading-relaxed mb-1" style={{ color: 'var(--ink)' }}>
          {renderInline(line, key)}
        </p>
      );
    }
  }
  return elements;
}
