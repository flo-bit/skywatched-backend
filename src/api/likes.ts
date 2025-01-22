import { getAllUsersWithLikes, getLikesByUser } from "../db/likes";
import { ApiCall } from "./types";

const calls: {
  [key: string]: {
    method: string;
    handler: (call: ApiCall) => Promise<Response>;
  };
} = {
  "/api/likes/user": {
    method: "GET",
    handler: async (call: ApiCall) => {
      const user_did = call.url.searchParams.get("did");
      if (!user_did) {
        return new Response(JSON.stringify({ error: "Missing did" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const likes = await getLikesByUser(user_did);
      return new Response(JSON.stringify(likes), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  },

  "/api/likes/users": {
    method: "GET",
    handler: async (call: ApiCall) => {
      const users = await getAllUsersWithLikes();
      return new Response(JSON.stringify(users), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  },
};

export async function processLikesApiCall(
  call: ApiCall
): Promise<Response | undefined> {
  if (calls[call.path] && calls[call.path].method === call.method) {
    return calls[call.path].handler(call);
  }

  return undefined;
}
