export type ApiError = {
  status: number;
  statusText: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

export type FetchViaExtensionOptions = RequestInit & { parseJson?: boolean };

const EXT_ID = process.env.NEXT_PUBLIC_EXT_ID!;

/**
 * Low-level raw call through the extension.
 * Returns plain text or parsed JSON depending on options.
 */
async function rawFetchViaExtension(
  url: string,
  options: FetchViaExtensionOptions = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!(window as any).chrome?.runtime?.sendMessage) {
      return reject(
        "chrome.runtime API not available in this page — check you're in Chrome with the extension installed."
      );
    }

    chrome.runtime.sendMessage(
      EXT_ID,
      { type: "FETCH", url, options },
      (resp: any) => {
        const lastErr = (window as any).chrome?.runtime?.lastError;
        if (lastErr) return reject(lastErr.message);
        if (!resp?.success) return reject(resp?.error || "Unknown error");

        if (options.parseJson === false) return resolve(resp.data);
        try {
          resolve(JSON.parse(resp.data));
        } catch {
          resolve(resp.data);
        }
      }
    );
  });
}

/**
 * High-level typed wrapper: always returns ApiResponse<T>.
 * Useful for Quercus, Crowdmark, Acorn, etc.
 */
export async function fetchWithExtension<T = unknown>(
  url: string,
  options: FetchViaExtensionOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const data = await rawFetchViaExtension(url, options);
    return { success: true, data: data as T, error: null };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: {
        status: -1,
        statusText: "ExtensionFetchError",
        message: err?.message || String(err),
      },
    };
  }
}

export type DownloadResponse = {
  success: boolean;
  data: string | null;         // base64
  contentType?: string | null;
  status?: number;
  statusText?: string;
  error?: string | null;
};

export async function rawDownloadViaExtension(
  url: string,
  options: RequestInit = {}
): Promise<DownloadResponse> {
  return new Promise((resolve, reject) => {
    if (!(window as any).chrome?.runtime?.sendMessage) {
      return reject(
        new Error("chrome.runtime API not available — is the extension installed?")
      );
    }

    chrome.runtime.sendMessage(
      EXT_ID,
      { type: "DOWNLOAD", url, options },
      (resp: any) => {
        const lastErr = (window as any).chrome?.runtime?.lastError;
        if (lastErr) return reject(lastErr);

        if (!resp || resp.success !== true) {
          resolve({
            success: false,
            data: null,
            status: resp?.status,
            statusText: resp?.statusText,
            error: resp?.error ?? "Unknown download error",
          });
        } else {
          resolve({
            success: true,
            data: resp.data,
            contentType: resp.contentType ?? null,
            status: resp.status,
            statusText: resp.statusText,
            error: null,
          });
        }
      }
    );
  });
}

export function b64ToU8(b64: string): Uint8Array {
  const clean = b64.replace(/^data:.*;base64,/, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}