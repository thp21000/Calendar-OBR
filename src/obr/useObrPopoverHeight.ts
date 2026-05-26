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
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let rafId: number | null = null;
    let lastHeight = 0;
    let disposed = false;

    const clampHeight = (value: number) => Math.max(minHeight, Math.min(maxHeight, Math.ceil(value)));
    const measureHeight = (element: HTMLElement) => {
      const bodyHeight = document.body?.scrollHeight ?? 0;
      const docHeight = document.documentElement?.scrollHeight ?? 0;
      const containerHeight = element.scrollHeight;
      return Math.max(containerHeight, docHeight, bodyHeight);
    };

    const applyHeight = (measuredHeight: number) => {
      const nextHeight = clampHeight(measuredHeight + padding);
      if (Math.abs(nextHeight - lastHeight) < 2) return;
      lastHeight = nextHeight;
      OBR.action.setHeight(nextHeight).catch(() => {
        // noop hors contexte action/popover
      });
    };

    const scheduleMeasure = (element: HTMLElement) => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        applyHeight(measureHeight(element));
      });
    };

    OBR.onReady(() => {
      if (disposed) return;
      const element = containerRef.current;
      if (!element) return;

      resizeObserver = new ResizeObserver(() => {
        scheduleMeasure(element);
      });

      mutationObserver = new MutationObserver(() => {
        scheduleMeasure(element);
      });

      resizeObserver.observe(element);
      mutationObserver.observe(element, { childList: true, subtree: true, attributes: true, characterData: true });
      scheduleMeasure(element);
    });

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [containerRef, minHeight, maxHeight, padding]);
};