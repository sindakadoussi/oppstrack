declare global {
  namespace NodeJS {
    interface ProcessEnv {
     DATABASE_URL: string
PAYLOAD_SECRET: string
NEXT_PUBLIC_APP_URL: string
GMAIL_USER: string
GMAIL_APP_PASSWORD: string
PORT: string
WEBHOOK_URL: string

    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}