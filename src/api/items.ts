import { getItemDetails } from "../tmdb-new";
import { ApiCall } from "./types";

const calls: {
  [key: string]: {
    method: string;
    handler: (call: ApiCall) => Promise<Response>;
  };
} = {
  "/api/items/details": {
    method: "GET",
    handler: async (call: ApiCall) => {
      const ref = call.url.searchParams.get("ref");

      if (!ref) {
        return new Response(JSON.stringify({ error: "Ref is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const details = await getItemDetails(ref);

        return new Response(JSON.stringify(details), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    },
  },
};

export async function processItemsApiCall(
  call: ApiCall
): Promise<Response | undefined> {
  if (calls[call.path] && calls[call.path].method === call.method) {
    return calls[call.path].handler(call);
  }

  return undefined;
}
