import { useEffect, useState, useRef } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface SmoothMarkdownRendererProps {
  content: string;
  isStreaming: boolean;
}

export default function SmoothMarkdownRenderer({ content, isStreaming }: SmoothMarkdownRendererProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const currentContentRef = useRef("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if content or streaming status updates
  useEffect(() => {
    if (!isStreaming) {
      // When streaming ends, display the complete response immediately
      setDisplayedContent(content);
      currentContentRef.current = content;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initialize display content if it was empty
    if (!currentContentRef.current && content) {
      currentContentRef.current = content.substring(0, Math.min(2, content.length));
      setDisplayedContent(currentContentRef.current);
    }

    // Launch typing timer to catch up letter-by-letter
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        const current = currentContentRef.current;
        const target = content;

        if (current.length < target.length) {
          // If we are lagging far behind target, increase step size to catch up smoothly
          const diff = target.length - current.length;
          const charsToAdd = diff > 40 ? 6 : diff > 15 ? 3 : 1;
          
          const next = target.substring(0, current.length + charsToAdd);
          currentContentRef.current = next;
          setDisplayedContent(next);
        }
      }, 20); // ~50 ticks per second for extremely fluid letter-by-letter typing
    }

    return () => {
      // Clear interval on cleanup if streaming ends
      if (!isStreaming && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, isStreaming]);

  // Handle unmount cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return <MarkdownRenderer content={isStreaming ? displayedContent : content} />;
}
