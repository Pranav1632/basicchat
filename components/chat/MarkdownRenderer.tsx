"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  content: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className="code-copy-btn" title="Copy code">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeStr = String(children).replace(/\n$/, "");
          const isBlock = !!match;

          if (isBlock) {
            return (
              <div className="code-block-wrapper">
                <div className="code-block-header">
                  <span className="code-lang">{match[1]}</span>
                  <CopyButton text={codeStr} />
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "0 0 0.625rem 0.625rem",
                    fontSize: "0.82rem",
                    background: "#0d1117",
                  }}
                >
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          }

          return (
            <code className="inline-code" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="md-p">{children}</p>,
        h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
        h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
        h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
        ul: ({ children }) => <ul className="md-ul">{children}</ul>,
        ol: ({ children }) => <ol className="md-ol">{children}</ol>,
        li: ({ children }) => <li className="md-li">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="md-blockquote">{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="md-link"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="md-table-wrapper">
            <table className="md-table">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="md-th">{children}</th>,
        td: ({ children }) => <td className="md-td">{children}</td>,
        hr: () => <hr className="md-hr" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
