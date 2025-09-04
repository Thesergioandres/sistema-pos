import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

const vapidKeys = {
  publicKey:
    "BKhRytEsWAZAhgPLVVgZq_S-ibwnNatIS1HkuPR7RwEicWjmkED9CGMMXKBa80UZNZJfAdss02j29qvVy27Usfk",
  privateKey: "WMSVgPmKJCZRMm_ceVVccuqGFhFT-fJHhWeB6gG4LV4",
};
webpush.setVapidDetails(
  "mailto:admin@posbebidas.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// POST: Enviar notificación push a todos los suscritos
export async function POST(req: Request) {
  const { title, body } = await req.json();
  const subs = await prisma.pushSubscription.findMany();
  let success = 0,
    fail = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, JSON.stringify({ title, body }));
      success++;
    } catch {
      fail++;
    }
  }
  return NextResponse.json({ success, fail });
}
