import { getLatestTimestamp } from "../db/timestamps";
import { ApiCall } from "./types";

export async function processApiCall({
  path,
  method,
}: ApiCall): Promise<Response | undefined> {
  if (method === "GET") {
    if (path === "/api/latest-timestamp") {
      const timestamp = getLatestTimestamp();
      return new Response(JSON.stringify({ latest_timestamp: timestamp }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}
