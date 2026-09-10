import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "./Reveal";

type LexicalChild = {
  type?: string;
  text?: string;
  tag?: string;
  listType?: string;
  children?: LexicalChild[];
  [key: string]: unknown;
};

type RichTextBlockProps = {
  content: unknown;
  /** Section index used for the editorial kicker, e.g. "02 — Our Story". */
  kicker?: string | null;
};

/**
 * Minimal lexical renderer for the Pages richText block — headings,
 * paragraphs, and lists as real text (never images of text). Anything
 * unrecognised is skipped; the block never throws on edge content.
 */
export function RichTextBlock({ content, kicker }: RichTextBlockProps) {
  const root = (content as { root?: { children?: LexicalChild[] } } | null)?.root;
  if (!root?.children?.length) return null;

  const nodes: ReactNode[] = [];
  let keySeq = 0;
  const nextKey = () => `rt-${keySeq++}`;
  let listBuffer: { key: string; tag: string; items: string[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    const { key, tag, items } = listBuffer;
    const li = items.map((item) => <li key={`${key}-${item}`}>{item}</li>);
    nodes.push(
      tag === "ol" ? (
        <ol key={key} className="mt-6 list-decimal space-y-2 pl-6">
          {li}
        </ol>
      ) : (
        <ul key={key} className="mt-6 list-disc space-y-2 pl-6">
          {li}
        </ul>
      ),
    );
    listBuffer = null;
  };

  const textOf = (node: LexicalChild): string => {
    let out = typeof node.text === "string" ? node.text : "";
    for (const child of node.children ?? []) out += textOf(child);
    return out;
  };

  for (const child of root.children) {
    const text = textOf(child).trim();
    if (child.type === "heading") {
      flushList();
      if (!text) continue;
      const level = child.tag === "h1" || child.tag === "h2" ? "h2" : "h3";
      nodes.push(
        level === "h2" ? (
          <h2
            key={nextKey()}
            className="mt-14 text-balance text-3xl leading-[0.95] font-medium tracking-tight text-ink first:mt-0 md:text-4xl"
          >
            {text}
          </h2>
        ) : (
          <h3
            key={nextKey()}
            className="mt-10 text-2xl leading-tight font-medium tracking-tight text-ink"
          >
            {text}
          </h3>
        ),
      );
    } else if (child.type === "list") {
      const tag = child.listType === "number" ? "ol" : "ul";
      if (listBuffer && listBuffer.tag !== tag) flushList();
      listBuffer ??= { key: nextKey(), tag, items: [] };
      for (const item of child.children ?? []) {
        const itemText = textOf(item).trim();
        if (itemText) listBuffer.items.push(itemText);
      }
    } else {
      flushList();
      if (!text) continue;
      nodes.push(
        <p key={nextKey()} className="mt-6 max-w-2xl leading-relaxed text-foreground/70">
          {text}
        </p>,
      );
    }
  }
  flushList();

  if (nodes.length === 0) return null;

  return (
    <section className="border-t rule bg-background">
      <Container className="py-16 md:py-24">
        {kicker ? <p className="text-label mb-10 text-brass">{kicker}</p> : null}
        <Reveal>{nodes}</Reveal>
      </Container>
    </section>
  );
}
