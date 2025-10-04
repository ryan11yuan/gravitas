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