import OBR from "@owlbear-rodeo/sdk";

export type ViewerRole = "gm" | "player";

const toViewerRole = (role: string | undefined): ViewerRole => (role === "GM" ? "gm" : "player");

export const getViewerRole = async (): Promise<ViewerRole> => {
  if (!OBR.isAvailable) return "gm";

  return new Promise((resolve) => {
    OBR.onReady(async () => {
      try {
        const role = await OBR.player.getRole();
        resolve(toViewerRole(role));
      } catch {
        resolve("player");
      }
    });
  });
};
