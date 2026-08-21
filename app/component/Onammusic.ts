

export type MusicState = { playing: boolean; muted: boolean; error: string | null };
type Listener = (state: MusicState) => void;

let audio: HTMLAudioElement | null = null;
let armed = false;
let lastError: string | null = null;
const listeners = new Set<Listener>();
const GESTURES: (keyof WindowEventMap)[] = ["pointerdown", "click", "touchstart", "keydown"];

const state = (): MusicState => ({
  playing: !!audio && !audio.paused && !audio.ended,
  muted: !!audio && audio.muted,
  error: lastError,
});

const notify = () => {
  const s = state();
  listeners.forEach((l) => l(s));
};

const MEDIA_ERRORS: Record<number, string> = {
  1: "aborted",
  2: "network error (is the file in /public and the path correct?)",
  3: "decode error (unsupported/corrupt file — convert to MP3)",
  4: "source not supported (wrong format/MIME — convert to MP3)",
};

function ensure(src: string, volume: number) {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "");
    audio.addEventListener("play", notify);
    audio.addEventListener("playing", notify);
    audio.addEventListener("pause", notify);
    audio.addEventListener("volumechange", notify);
    audio.addEventListener("error", () => {
      const code = audio?.error?.code ?? 0;
      lastError = MEDIA_ERRORS[code] ?? "unknown media error";
      console.warn(`[onamMusic] cannot load "${src}": ${lastError}`);
      notify();
    });
  }
  const encoded = encodeURI(src);
  if (audio.dataset.src !== encoded) {
    audio.dataset.src = encoded;
    audio.src = encoded;
    lastError = null;
    audio.load();
  }
  audio.volume = Math.min(1, Math.max(0, volume));
  return audio;
}

function tryPlay(): Promise<boolean> {
  if (!audio) return Promise.resolve(false);
  let p: Promise<void> | void;
  try {
    p = audio.play();
  } catch {
    return Promise.resolve(false);
  }
  if (!p || typeof p.then !== "function") return Promise.resolve(!audio.paused);
  return p
    .then(() => {
      notify();
      return true;
    })
    .catch((err: unknown) => {
      const name = (err as { name?: string })?.name ?? "";
      if (name === "NotAllowedError") {
        console.info("[onamMusic] autoplay blocked — will start on first tap/click.");
      } else {
        lastError = `play() failed: ${name || String(err)}`;
        console.warn(`[onamMusic] ${lastError}`);
        notify();
      }
      return false;
    });
}

function disarm(unlock: EventListener) {
  GESTURES.forEach((ev) => window.removeEventListener(ev, unlock));
  armed = false;
}

function armUnlock() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const unlock: EventListener = () => {
    tryPlay().then((ok) => {
      if (ok) disarm(unlock);
    });
  };
  GESTURES.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
}

export const onamMusic = {
  /** Load (once) and start playing; falls back to first-gesture start. */
  start(src: string, volume = 0.55) {
    const a = ensure(src, volume);
    if (!a) return;
    tryPlay().then((ok) => {
      if (!ok) armUnlock();
    });
  },
  pause() {
    audio?.pause();
  },
  setMuted(muted: boolean) {
    if (!audio) return;
    audio.muted = muted;
    if (!muted && audio.paused) tryPlay();
    notify();
  },
  toggleMuted() {
    if (!audio) return;
    onamMusic.setMuted(!audio.muted);
  },
  get state(): MusicState {
    return state();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l(state());
    return () => {
      listeners.delete(l);
    };
  },
};