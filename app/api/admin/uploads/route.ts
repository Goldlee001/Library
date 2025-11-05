import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session as any).user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = (form.get("title") as string | null) ?? "Untitled";
    const type = (form.get("type") as string | null)?.toLowerCase(); // video|image|pdf
    const scope = ((form.get("scope") as string | null) ?? "library").toLowerCase(); // dashboard|library

    if (!file || !type || !["video", "image", "pdf"].includes(type)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsRoot = path.join(process.cwd(), "public", "uploads", type);
    await fs.mkdir(uploadsRoot, { recursive: true });

    const safeBase = (file as any).name ? String((file as any).name).replace(/[^a-zA-Z0-9_.-]/g, "_") : `${type}`;
    const filename = `${Date.now()}_${safeBase}`;
    const filepath = path.join(uploadsRoot, filename);

    await fs.writeFile(filepath, buffer);

    const publicPath = `/uploads/${type}/${filename}`;

    const client = await clientPromise;
    const db = client.db("library");

    const doc = {
      title,
      type,
      src: publicPath,
      scope: scope === "dashboard" ? "dashboard" : "library",
      createdAt: new Date(),
      uploadedBy: (session as any).user?.id ?? null,
    } as const;

    const result = await db.collection("media").insertOne(doc as any);

    return NextResponse.json({ id: result.insertedId, item: { _id: result.insertedId, ...doc } }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/uploads error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
