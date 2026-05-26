import { useEffect } from "react";
import OBR from "@owlbear-rodeo/sdk";
import type { Theme } from "@owlbear-rodeo/sdk/lib/types/Theme";

const applyObrThemeVariables = (theme: Theme) => {
  const root = document.documentElement;
  root.style.setProperty("--obr-bg-default", theme.background.default);
  root.style.setProperty("--obr-bg-paper", theme.background.paper);
  root.style.setProperty("--obr-surface-elevated", theme.background.paper);
  root.style.setProperty("--obr-surface-soft", theme.background.paper);
  root.style.setProperty("--obr-text-primary", theme.text.primary);
  root.style.setProperty("--obr-text-secondary", theme.text.secondary);
  root.style.setProperty("--obr-text-muted", theme.text.disabled);
  root.style.setProperty("--obr-primary-main", theme.primary.main);
  root.style.setProperty("--obr-primary-contrast", theme.primary.contrastText);
  root.style.setProperty("--obr-border", "rgba(255,255,255,0.14)");
  root.style.setProperty("--obr-border-soft", "rgba(255,255,255,0.09)");
};

export const useObrTheme = () => {
  useEffect(() => {
    if (!OBR.isAvailable) return;
    let offChange: (() => void) | undefined;

    OBR.onReady(async () => {
      try {
        const theme = await OBR.theme.getTheme();
        applyObrThemeVariables(theme);
      } catch {
        // noop
      }
      offChange = OBR.theme.onChange((theme) => applyObrThemeVariables(theme));
    });

    return () => {
      offChange?.();
    };
  }, []);
};

