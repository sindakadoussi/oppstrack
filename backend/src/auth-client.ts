import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    // L'URL de votre application (généralement localhost:3000 en dev)
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        magicLinkClient() // Indispensable pour débloquer la fonction signIn.magicLink
    ]
});