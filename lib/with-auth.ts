import { NextRequest } from "next/server";
import { adminAuth } from "./firebaseAdmin";
import { DecodedIdToken } from "firebase-admin/auth";

declare module "next/server" {
  interface NextRequest {
    user?: DecodedIdToken;
  }
}

type Handler = (req: NextRequest, context?: any) => Promise<Response>;

export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    const token = req.headers.get("authrization")?.split("Bearer ")[1];
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Verify the token using the Firebase Admin SDK
      const decodedToken = await adminAuth.verifyIdToken(token);

      // Attach the decoded token (which includes user info) to the request object
      req.user = decodedToken;

      // If authenticated, call the original handler
      return handler(req, context);
    } catch (error) {
      console.error("Error verifying Firebase ID token:", error);
      return new Response(
        JSON.stringify({ error: "Forbidden. Invalid token." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}
