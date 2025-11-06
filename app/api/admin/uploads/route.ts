import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";

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
    const type = (form.get("type") as string | null)?.toLowerCase();
    const scope = ((form.get("scope") as string | null) ?? "library").toLowerCase();

    if (!file || !type || !["video", "image", "pdf"].includes(type)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: type === "video" ? "video" : "auto", folder: `uploads/${type}` },
        (error, res) => {
          if (error) return reject(error);
          resolve(res);
        }
      );
      stream.end(buffer);
    });

    const client = await clientPromise;
    const db = client.db("library");

    const doc = {
      title,
      type,
      src: result?.secure_url,
      scope,
      createdAt: new Date(),
      uploadedBy: (session as any).user?.id ?? null,
    };

    const insert = await db.collection("media").insertOne(doc);
    return NextResponse.json({ id: insert.insertedId, item: { _id: insert.insertedId, ...doc } }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/uploads error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
