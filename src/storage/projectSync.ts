export const PROJECT_SYNC_CHANNEL = "calendar-obr-project";
export const PROJECT_SYNC_EVENT = "calendar-obr-project-updated";

export type ProjectSyncMessage = {
  type: "calendar-project-updated";
  storageKey: string;
  revision: number;
};

let localRevision = 0;
let channel: BroadcastChannel | undefined;

const getChannel = (): BroadcastChannel | undefined => {
  if (typeof BroadcastChannel === "undefined") return undefined;
  if (!channel) channel = new BroadcastChannel(PROJECT_SYNC_CHANNEL);
  return channel;
};

export const notifyCalendarProjectUpdated = (storageKey: string): ProjectSyncMessage => {
  const message: ProjectSyncMessage = {
    type: "calendar-project-updated",
    storageKey,
    revision: ++localRevision
  };

  getChannel()?.postMessage(message);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<ProjectSyncMessage>(PROJECT_SYNC_EVENT, { detail: message }));
  }

  return message;
};

export const subscribeCalendarProjectUpdates = (callback: (message: ProjectSyncMessage) => void): (() => void) => {
  const activeChannel = getChannel();
  const handleChannelMessage = (event: MessageEvent<ProjectSyncMessage>) => {
    if (event.data?.type === "calendar-project-updated") callback(event.data);
  };
  const handleWindowEvent = (event: Event) => {
    const detail = (event as CustomEvent<ProjectSyncMessage>).detail;
    if (detail?.type === "calendar-project-updated") callback(detail);
  };

  activeChannel?.addEventListener("message", handleChannelMessage);
  if (typeof window !== "undefined") window.addEventListener(PROJECT_SYNC_EVENT, handleWindowEvent);

  return () => {
    activeChannel?.removeEventListener("message", handleChannelMessage);
    if (typeof window !== "undefined") window.removeEventListener(PROJECT_SYNC_EVENT, handleWindowEvent);
  };
};
