chrome.runtime.onMessageExternal.addListener(async (msg, sender, sendResponse) => {
  console.log("FETCH request:", msg.url);

  try {
    const res = await fetch(msg.url, {
      method: msg.options?.method || "GET",
      headers: msg.options?.headers || {},
      body: msg.options?.body,
      credentials: "include"
    });
    console.log("Response status:", res.status);

    if(res.status !== 200) {
      sendResponse({ success: false, status: res.status, error: await res.text() });
    }

    const text = await res.text();
    sendResponse({ success: true, status: res.status, data: text });
  } catch (e) {
    console.error("Fetch failed:", e);
    sendResponse({ success: false, error: String(e) });
  }

  return true;
});

chrome.runtime.onMessageExternal.addListener(async (msg, _sender, sendResponse) => {
  if (msg?.type !== "DOWNLOAD" || !msg?.url) {
    return;
  }

  try {
    const res = await fetch(msg.url, {
      method: msg.options?.method ?? "GET",
      headers: msg.options?.headers ?? {},
      body: msg.options?.body,
      credentials: "include",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      sendResponse({
        success: false,
        status: res.status,
        statusText: res.statusText,
        error: errText || `HTTP ${res.status} ${res.statusText}`,
      });
      return true;
    }

    const buf = await res.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    const contentType = res.headers.get("content-type") || "application/octet-stream";

    sendResponse({
      success: true,
      status: res.status,
      data: b64,
      contentType,
    });
  } catch (e: any) {
    sendResponse({ success: false, error: String(e?.message || e) });
  }

  return true;
});

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] ?? 0);
  return btoa(binary);
}