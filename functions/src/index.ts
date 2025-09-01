import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

function getScriptUrl(): string {
  const env = process.env as Record<string, string | undefined>;
  return env.APPS_SCRIPT_URL || env.apps_script_url || "";
}

export const publicClientRequest = onRequest({ region: "us-central1", cors: true }, async (req, res) => {
  try {
    const url = getScriptUrl();
    if (!url) {
      res.status(500).send("Missing Apps Script URL");
      return;
    }
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req.body ?? {}),
    });
    const text = await r.text();
    res.status(r.ok ? 200 : 400).send(text);
  } catch (e) {
    logger.error("publicClientRequest error", e);
    res.status(500).send("Proxy error");
  }
});
