import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import fs from "fs/promises";
import { nanoid } from "nanoid";

// Environment Variables
const SESSION_TEXT = process.env.TELE_SESSION_TEXT;
const TELE_APP_ID = Number(process.env.TELE_APP_ID);
const TELE_APP_HASH = process.env.TELE_APP_HASH;

// Inisialisasi Telegram Client
export async function initTelegramClient(): Promise<TelegramClient> {
  if (!SESSION_TEXT || !TELE_APP_ID || !TELE_APP_HASH) {
    console.error(
      "Missing required environment variables: TELE_SESSION_TEXT, TELE_APP_ID, or TELE_APP_HASH"
    );
    process.exit(1);
  }

  const stringSession = new StringSession(SESSION_TEXT);
  const client = new TelegramClient(stringSession, TELE_APP_ID, TELE_APP_HASH, {
    connectionRetries: 5,
  });
  await client.connect();
  if (!(await client.checkAuthorization())) {
    throw new Error("Invalid session. Please generate a new session.");
  }
  return client;
  
}

// Reload Telegram Client (Disconnect dan Reconnect)
export async function reloadTelegramClient(
  client: TelegramClient
): Promise<void> {
  await client.disconnect();
  await client.connect();
  if (!(await client.checkAuthorization())) {
    throw new Error("Failed to reload: Invalid session.");
  }
}

// Mengambil Daftar Grup
export async function findGroupId(
  client: TelegramClient
): Promise<{ title: string; id: string }[]> {
  const list: { title: string; id: string }[] = [];
  const dialogs = await client.getDialogs({ limit: 100 });
  for (const dialog of dialogs) {
    if (dialog.isGroup) {
      list.push({
        title: dialog.title || "Unnamed Group",
        id: dialog.id?.toString() || "",
      });
    }
  }
  return list;
}

// Mengirim Pesan
export async function sendMessage(
  client: TelegramClient,
  id: string,
  message: string
): Promise<void> {
//   if (!/^-?\d+$/.test(id)) throw new Error("Invalid group ID");
  if (message.length > 4096) throw new Error("Message exceeds 4096 characters");
  await client.sendMessage(id, { message });
}

// Mengirim Gambar
export async function sendImage(
  client: TelegramClient,
  id: string,
  imageBuffer: Buffer,
  caption?: string
): Promise<void> {
//   if (!/^-?\d+$/.test(id)) throw new Error("Invalid group ID");
  const imageName = nanoid() + ".jpg";
  await fs.writeFile(imageName, imageBuffer);
  await client.sendFile(id, {
    file: imageName,
    caption: caption || "Image from bot",
    forceDocument: false
  });
  await fs.unlink(imageName);
}

// Mengirim file pdf, csv , txt dll
export async function sendFile(
  client: TelegramClient,
  id: string,
  fileBuffer: Buffer,
  caption?: string
): Promise<void> {
  const fileName = nanoid() + "." + fileBuffer.toString("utf-8").split(".").pop() || "file";
  await fs.writeFile(fileName, fileBuffer);
  await client.sendFile(id, {
    file: fileName,
    caption: caption || "File from bot",
    forceDocument: true
  });
  await fs.unlink(fileName);
}

