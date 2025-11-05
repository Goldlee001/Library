import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user?.role !== "admin") {
    return null;
  }
  return session;
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("library");

    const res = await db.collection("media").deleteOne({ _id: new ObjectId(id) });
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/media/[id] error", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    const update: any = {};
    if (typeof body.title === "string") update.title = body.title;
    if (body.scope && (body.scope === "dashboard" || body.scope === "library")) update.scope = body.scope;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("library");

    const res = await db.collection("media").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!res.value) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = {
      _id: res.value._id.toString(),
      title: res.value.title,
      type: res.value.type,
      src: res.value.src,
      scope: res.value.scope,
      createdAt: res.value.createdAt,
    };
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PATCH /api/admin/media/[id] error", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
