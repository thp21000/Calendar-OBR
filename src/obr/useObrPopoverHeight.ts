import { useEffect, type RefObject } from "react";
import OBR from "@owlbear-rodeo/sdk";

type Params = {
  containerRef: RefObject<HTMLElement>;
  minHeight?: number;
  maxHeight?: number;
  padding?: number;
};

export const useObrPopoverHeight = ({ containerRef, minHeight = 420, maxHeight = 900, padding = 20 }: Params) => {
  useEffect(() => {
    if (!OBR.isAvailable) return;
    const element = containerRef.current;
    if (!element) return;

    let lastHeight = 0;
    const applyHeight = (rawHeight: number) => {
      const nextHeight = Math.max(minHeight, Math.min(maxHeight, Math.ceil(rawHeight + padding)));
      if (Math.abs(nextHeight - lastHeight) < 2) return;
      lastHeight = nextHeight;
      OBR.action.setHeight(nextHeight).catch(() => {
        // noop hors contexte action/popover
      });
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyHeight(entry.contentRect.height);
    });

    resizeObserver.observe(element);
    applyHeight(element.getBoundingClientRect().height);

    return () => resizeObserver.disconnect();
  }, [containerRef, minHeight, maxHeight, padding]);
};
