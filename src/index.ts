import Elysia, { t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { TelegramClient } from "telegram";
import {
  initTelegramClient,
  reloadTelegramClient,
  findGroupId,
  sendMessage,
  sendImage,
} from "./telegram";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2));

// Environment Variables
const PORT = argv.port || Number(process.env.PORT) || 3000;
const API_KEY = process.env.TELE_API_KEY;

if (!API_KEY) {
  console.error("Missing required environment variable: TELE_API_KEY");
  process.exit(1);
}

// API Response Type
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

// Inisialisasi Elysia App
function setupElysia(client: TelegramClient) {
  const app = new Elysia({ prefix: "/api" })
    .use(swagger())
    .use(cors({ origin: "*" }))
    .onBeforeHandle(({ request, response }) => {
      const apiKey = request.headers.get("x-api-key");
      const url = new URL(request.url).pathname;

      if (url.includes("/api/swagger")) {
        return response;
      }
      if (apiKey !== API_KEY) {
        return { success: false, error: "Unauthorized" } as ApiResponse<never>;
      }
    });

  // Root Endpoint
  app.get("/", () => "Welcome to Telegram Bot API");

  // Start Telegram Bot
  app.get("/start", async (): Promise<ApiResponse<string>> => {
    try {
      if (await client.checkAuthorization()) {
        return { success: true, data: "Telegram bot already running" };
      }
      await client.connect();
      return { success: true, data: "Telegram bot started" };
    } catch (error) {
      console.error("Error starting Telegram bot:", error);
      return { success: false, error: `Failed to start bot: ${(error as Error).message}` };
    }
  });

  // Reload Telegram Client
  app.get("/reload", async (): Promise<ApiResponse<string>> => {
    try {
      await reloadTelegramClient(client);
      return { success: true, data: "Telegram client reloaded successfully" };
    } catch (error) {
      console.error("Error reloading Telegram client:", error);
      return { success: false, error: `Failed to reload client: ${(error as Error).message}` };
    }
  });

  // Get Groups Endpoint
  app.get("/groups", async (): Promise<ApiResponse<{ title: string; id: string }[]>> => {
    try {
      const groups = await findGroupId(client);
      return { success: true, data: groups };
    } catch (error) {
      console.error("Error fetching groups:", error);
      return { success: false, error: `Failed to fetch groups: ${(error as Error).message}` };
    }
  });

  // Send Message via GET
  app.get("/send/:id/:message", async ({ params }): Promise<ApiResponse<string>> => {
    try {
      await sendMessage(client, params.id, params.message);
      return { success: true, data: "Message sent" };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, error: `Failed to send message: ${(error as Error).message}` };
    }
  });

  // Send Message via POST
  app.post("/send-text", async ({ body }): Promise<ApiResponse<string>> => {
    if (!body.id || !body.message) {
      return { success: false, error: "Invalid request: id and message are required" };
    }
    try {
      await sendMessage(client, body.id, body.message);
      return { success: true, data: "Message sent" };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, error: `Failed to send message: ${(error as Error).message}` };
    }
  }, {
    body: t.Object({
      id: t.String({ description: "Chat or group ID", pattern: "^-?\\d+$" }),
      message: t.String({ description: "Message content", maxLength: 4096 }),
    }),
  });


  // Send Image via POST
  app.post("/send-image", async ({ body }): Promise<ApiResponse<string>> => {
    if (!body.id || !body.image) {
      return { success: false, error: "Invalid request: id and image are required" };
    }
    try {
      const imageBuffer = Buffer.from(await body.image.arrayBuffer());
      await sendImage(client, body.id, imageBuffer, body.caption);
      return { success: true, data: "Image sent successfully" };
    } catch (error) {
      console.error("Error sending image:", error);
      return { success: false, error: `Failed to send image: ${(error as Error).message}` };
    }
  }, {
    body: t.Object({
      id: t.String({ description: "Chat or group ID", pattern: "^-?\\d+$" }),
      image: t.File({
        description: "Image file to upload",
        maxSize: 10 * 1024 * 1024,
        type: ["image/jpeg", "image/png", "image/gif"],
      }),
      caption: t.Optional(t.String({ description: "Caption for the image", maxLength: 1024 })),
    }),
  });

  return app;
}

// Main Application
(async () => {
  console.log("Starting application...");

  let client: TelegramClient;
  try {
    client = await initTelegramClient();
    console.log("Telegram client initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Telegram client:", error);
    process.exit(1);
  }

  const app = setupElysia(client);

  // Start Server
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  // Graceful Shutdown
  process.on("SIGTERM", async () => {
    console.log("Shutting down...");
    await client.disconnect();
    process.exit(0);
  });
})();