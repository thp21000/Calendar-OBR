import OBR from "@owlbear-rodeo/sdk";

export type StorageScope = {
  type: "obr-room" | "local";
  id: string;
  storageKey: string;
};

const PREFIX = "calendar-obr.project";

export const getStorageScope = async (): Promise<StorageScope> => {
  if (!OBR.isAvailable) {
    return { type: "local", id: "local-dev", storageKey: `${PREFIX}.local-dev` };
  }

  return new Promise((resolve) => {
    OBR.onReady(() => {
      const roomId = OBR.room?.id;
      if (roomId && roomId.length > 0) {
        resolve({ type: "obr-room", id: roomId, storageKey: `${PREFIX}.${roomId}` });
      } else {
        resolve({ type: "local", id: "local-dev", storageKey: `${PREFIX}.local-dev` });
      }
    });
  });
};
