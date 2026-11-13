export interface FetchLaterInit {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  signal?: AbortSignal;
  activateAfter?: number;
}

export interface FetchLaterResult {
  readonly activated: boolean;
}

type FetchLaterFn = (input: string | URL, init?: FetchLaterInit) => FetchLaterResult;

type GlobalWithFetchLater = typeof globalThis & {
  fetchLater?: FetchLaterFn;
};

function polyfill(url: string | URL, init: FetchLaterInit = {}): FetchLaterResult {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let activated = false;

  function sendNow() {
    if (!(init.signal && init.signal.aborted)) {
      const headers = init.headers;
      const useFetch = "keepalive" in Request.prototype
        || init.method !== "POST"
        || headers !== undefined;
      if (useFetch) {
        const requestInit: RequestInit = {
          method: init.method,
          headers,
          body: init.body,
          keepalive: true,
        };
        fetch(url, requestInit).catch(() => {});
        activated = true;
      } else {
        activated = navigator.sendBeacon(url, init.body ?? null);
      }
    }
    destroy();
  }

  function destroy() {
    document.removeEventListener("visibilitychange", sendNow);
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }

  if (document.visibilityState === "hidden") {
    queueMicrotask(sendNow);
  } else {
    document.addEventListener("visibilitychange", sendNow);
    if (typeof init.activateAfter === "number" && init.activateAfter >= 0) {
      timeoutHandle = setTimeout(sendNow, init.activateAfter);
    }
  }

  if (init.signal) init.signal.addEventListener("abort", destroy);

  return {
    get activated() {
      return activated;
    },
  };
}

/** Use the browser fetchLater when present. Firefox and Safari get the visibility/timeout fallback. */
export function getFetchLater(): FetchLaterFn {
  const root = globalThis as GlobalWithFetchLater;
  if (typeof root.fetchLater !== "function") root.fetchLater = polyfill;
  return root.fetchLater;
}
