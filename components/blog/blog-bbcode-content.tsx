"use client";

import { parseBbcodeToHtml } from "@/lib/blog/bbcode";
import { useMemo } from "react";

export function BlogBbcodeContent({ bbcode }: { bbcode: string }) {
  const html = useMemo(() => parseBbcodeToHtml(bbcode), [bbcode]);
  return (
    <div
      className="blog-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
