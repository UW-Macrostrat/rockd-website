import hyper from "@macrostrat/hyper";
import { useState } from "react";
import styles from "./truncated-text.module.sass";

const h = hyper.styled(styles);

export interface TruncatedTextProps {
  text: string;
  /** Characters shown before the cut, which falls on the word boundary before */
  maxLength?: number;
}

/**
 * Long text cut short, ending in a clickable "…" that shows it all. Cut by
 * characters (at a word boundary) rather than measured lines, so it needs no
 * layout measuring and renders the same on the server.
 */
export function TruncatedText({ text, maxLength = 90 }: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false);
  if (expanded || text.length <= maxLength) return h("span", text);

  // The last word and the "…" don't wrap apart, so the "…" never sits alone
  // on a line
  const shortened = shorten(text, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");
  const head = shortened.slice(0, lastSpace + 1);
  const lastWord = shortened.slice(lastSpace + 1);

  return h("span", [
    head,
    h("span.truncation-end", [
      lastWord,
      h(
        "button.truncation-toggle",
        {
          type: "button",
          title: "Show all",
          "aria-label": "Show all",
          "aria-expanded": false,
          onClick: () => setExpanded(true),
        },
        "…"
      ),
    ]),
  ]);
}

/** `text` up to `maxLength` characters, ending at the last whole sentence or,
 * failing one past halfway, the last whole word */
function shorten(text: string, maxLength: number): string {
  const cut = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? ")
  );
  const lastSpace = cut.lastIndexOf(" ");

  let shortened = cut;
  if (sentenceEnd > maxLength / 2) {
    shortened = cut.slice(0, sentenceEnd);
  } else if (lastSpace > maxLength / 2) {
    shortened = cut.slice(0, lastSpace);
  }
  return shortened.replace(/[\s.,;:–—-]+$/, "");
}
