import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        accessToken?: string | null
        refreshToken?: string | null
        user: {
            id: string
        } & DefaultSession["user"]
    }
}