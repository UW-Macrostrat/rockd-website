import h from "@macrostrat/hyper";
import { useState } from "react";

export interface ImageProps {
  src: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
  alt?: string;
  onError?: () => void;
}

/** An image from Rockd's asset bucket, hidden if it fails to load. */
export function Image(props: ImageProps) {
  const { src, className, width, height, onClick, alt } = props;
  const [hasError, setHasError] = useState(false);
  const srcWithAddedPrefix =
    "https://storage.macrostrat.org/assets/rockd/" + src;

  if (!src || hasError) {
    return null;
  }

  return h("img", {
    src: srcWithAddedPrefix,
    className,
    width,
    height,
    onClick,
    onError: () => setHasError(true),
    alt,
  });
}
