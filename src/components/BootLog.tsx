"use client";

import { useEffect, useRef } from "react";

interface Props {
  lines: string[];
  className?: string;
}

export default function BootLog({ lines, className }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div
      ref={scrollRef}
      className={
        "overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-950 p-4 font-mono text-xs leading-relaxed text-gray-200 " +
        (className ?? "")
      }
    >
      {lines.length === 0 ? (
        <span className="text-gray-500">Waiting for boot…</span>
      ) : (
        lines.map((line, i) => <div key={i}>{line}</div>)
      )}
    </div>
  );
}
