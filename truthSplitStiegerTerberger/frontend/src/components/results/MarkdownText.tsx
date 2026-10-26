import React from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

/**
 * Simple markdown renderer for chat messages
 * Supports: bold, italic, lists, headings, line breaks
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, className = "" }) => {
  const renderLine = (line: string, index: number) => {
    // Empty line
    if (line.trim() === '') {
      return <br key={index} />;
    }

    // Heading (##)
    if (line.startsWith('## ')) {
      return (
        <h3 key={index} className="font-semibold text-base mt-3 mb-1">
          {processInlineFormatting(line.substring(3))}
        </h3>
      );
    }

    // Heading (###)
    if (line.startsWith('### ')) {
      return (
        <h4 key={index} className="font-semibold text-sm mt-2 mb-1">
          {processInlineFormatting(line.substring(4))}
        </h4>
      );
    }

    // Unordered list
    if (line.match(/^[-*]\s/)) {
      return (
        <li key={index} className="ml-4">
          {processInlineFormatting(line.substring(2))}
        </li>
      );
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      return (
        <li key={index} className="ml-4">
          {processInlineFormatting(line.replace(/^\d+\.\s/, ''))}
        </li>
      );
    }

    // Regular paragraph
    return (
      <p key={index} className="mb-2">
        {processInlineFormatting(line)}
      </p>
    );
  };

  const processInlineFormatting = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold (**text**)
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        const beforeBold = remaining.substring(0, boldMatch.index);
        if (beforeBold) parts.push(beforeBold);
        parts.push(
          <strong key={`bold-${key++}`} className="font-semibold">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(boldMatch.index! + boldMatch[0].length);
        continue;
      }

      // Italic (*text* but not **)
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);
      if (italicMatch) {
        const beforeItalic = remaining.substring(0, italicMatch.index);
        if (beforeItalic) parts.push(beforeItalic);
        parts.push(
          <em key={`italic-${key++}`} className="italic">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.substring(italicMatch.index! + italicMatch[0].length);
        continue;
      }

      // Code (`code`)
      const codeMatch = remaining.match(/`(.+?)`/);
      if (codeMatch) {
        const beforeCode = remaining.substring(0, codeMatch.index);
        if (beforeCode) parts.push(beforeCode);
        parts.push(
          <code key={`code-${key++}`} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.substring(codeMatch.index! + codeMatch[0].length);
        continue;
      }

      // No more formatting found, add the rest
      parts.push(remaining);
      break;
    }

    return parts;
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let currentList: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const isList = line.match(/^[-*]\s/) || line.match(/^\d+\.\s/);

    if (isList) {
      if (!inList) {
        inList = true;
        currentList = [];
      }
      currentList.push(renderLine(line, index));
    } else {
      if (inList) {
        // Close the list
        elements.push(
          <ul key={`list-${index}`} className="list-disc space-y-1 mb-2">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      elements.push(renderLine(line, index));
    }
  });

  // Close any remaining list
  if (inList && currentList.length > 0) {
    elements.push(
      <ul key="list-end" className="list-disc space-y-1 mb-2">
        {currentList}
      </ul>
    );
  }

  return <div className={className}>{elements}</div>;
};

