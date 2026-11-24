"use client";

import React from "react";

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function MarkdownBubble({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="markdown-bubble text-[14.5px] leading-relaxed">
      {blocks.map((block, bIdx) => {
        const lines = block.split("\n").map((l) => l.trimEnd());
        const isBulletList =
          lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l.trim()));
        const isOrderedList =
          lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={bIdx}>
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.trim().replace(/^[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        if (isOrderedList) {
          return (
            <ol key={bIdx}>
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.trim().replace(/^\d+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={bIdx}>
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                {renderInline(line)}
                {i < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
