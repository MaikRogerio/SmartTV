/* Minimal typings for the Google Cast Web Sender SDK (loaded from gstatic in index.html). */
declare namespace chrome.cast {
  const AutoJoinPolicy: { ORIGIN_SCOPED: string; TAB_AND_ORIGIN_SCOPED: string; PAGE_SCOPED: string };
  class Image {
    constructor(url: string);
  }
  namespace media {
    const DEFAULT_MEDIA_RECEIVER_APP_ID: string;
    const StreamType: { BUFFERED: string; LIVE: string; OTHER: string };
    class MediaInfo {
      constructor(contentId: string, contentType: string);
      contentUrl?: string;
      streamType: string;
      metadata: GenericMediaMetadata | null;
    }
    class GenericMediaMetadata {
      title?: string;
      subtitle?: string;
      images?: Image[];
    }
    class LoadRequest {
      constructor(mediaInfo: MediaInfo);
      autoplay: boolean;
    }
  }
}

declare namespace cast.framework {
  const CastContextEventType: { CAST_STATE_CHANGED: string; SESSION_STATE_CHANGED: string };
  const CastState: { NO_DEVICES_AVAILABLE: string; NOT_CONNECTED: string; CONNECTING: string; CONNECTED: string };
  const RemotePlayerEventType: { IS_PAUSED_CHANGED: string; ANY_CHANGE: string };
  interface CastStateEventData {
    castState: string;
  }
  interface CastSession {
    loadMedia(request: chrome.cast.media.LoadRequest): Promise<string | undefined>;
    getCastDevice(): { friendlyName: string };
  }
  class CastContext {
    static getInstance(): CastContext;
    setOptions(options: { receiverApplicationId: string; autoJoinPolicy?: string }): void;
    requestSession(): Promise<string | undefined>;
    getCurrentSession(): CastSession | null;
    getCastState(): string;
    endCurrentSession(stopCasting: boolean): void;
    addEventListener(type: string, handler: (e: CastStateEventData) => void): void;
    removeEventListener(type: string, handler: (e: CastStateEventData) => void): void;
  }
  class RemotePlayer {
    isPaused: boolean;
    isMuted: boolean;
  }
  class RemotePlayerController {
    constructor(player: RemotePlayer);
    playOrPause(): void;
    muteOrUnmute(): void;
    addEventListener(type: string, handler: () => void): void;
    removeEventListener(type: string, handler: () => void): void;
  }
}

interface Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
  __castAvailable?: boolean;
  cast?: typeof cast;
  chrome?: { cast?: typeof chrome.cast };
}
