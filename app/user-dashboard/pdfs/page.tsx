"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Heart } from "lucide-react";
import UserHeader from "@/components/user-header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ---------- TYPES ----------
interface PDF { _id?: string; title: string; src: string }

// ---------- MAIN COMPONENT ----------
export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [visiblePDFs, setVisiblePDFs] = useState(4);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/media?type=pdf&scope=library", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load PDFs");
        const data = await res.json();
        const items: PDF[] = (data?.items || []).map((m: any, i: number) => ({ _id: m._id || String(i), title: m.title || "Untitled", src: m.src }));
        setPdfs(items);

        const ids = items.map((it) => it._id).filter(Boolean) as string[];
        if (ids.length) {
          const likeRes = await fetch("/api/likes/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaIds: ids }),
          });
          if (likeRes.ok) {
            const likeData = await likeRes.json();
            setLikes(likeData.counts || {});
            setUserLiked(likeData.liked || {});
          }
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---------- LIKE TOGGLE ----------
  const toggleLike = async (id: string) => {
    const isLiked = !!userLiked[id];
    setLikes((prev) => ({ ...prev, [id]: isLiked ? Math.max((prev[id] || 1) - 1, 0) : (prev[id] || 0) + 1 }));
    setUserLiked((prev) => ({ ...prev, [id]: !isLiked }));
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: id, action: "toggle" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLikes((prev) => ({ ...prev, [id]: data.count as number }));
      setUserLiked((prev) => ({ ...prev, [id]: !!data.liked }));
    } catch (e) {
      setLikes((prev) => ({ ...prev, [id]: isLiked ? (prev[id] || 0) + 1 : Math.max((prev[id] || 1) - 1, 0) }));
      setUserLiked((prev) => ({ ...prev, [id]: isLiked }));
    }
  };

  // ---------- SORTED / FILTERED LIST ----------
  const sortedPDFs = useMemo(() => {
    if (!searchTerm.trim()) return pdfs;
    const lower = searchTerm.toLowerCase();
    const matches = pdfs.filter((v) => v.title.toLowerCase().includes(lower));
    const nonMatches = pdfs.filter(
      (v) => !v.title.toLowerCase().includes(lower)
    );
    return [...matches, ...nonMatches];
  }, [searchTerm, pdfs]);

  const hasMatches = useMemo(() => {
    if (!searchTerm.trim()) return true;
    return pdfs.some((v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, pdfs]);

  // ---------- HANDLE DOWNLOAD ----------
  const handleDownload = (item: { title: string; src: string }) => {
    toast.info(
      <div className="text-center">
        <p className="mb-2 text-sm font-medium">
          Download <strong>{item.title}</strong>?
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              fetch(item.src)
                .then((res) => res.blob())
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = item.title + ".pdf";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                  toast.success("✅ Download started!");
                  toast.dismiss();
                })
                .catch(() => toast.error("❌ Failed to download"));
            }}
            className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 transition"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 transition"
          >
            No
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  };

  // ---------- RENDER ----------
  return (
    <div className="pt-20 pb-10 min-h-screen bg-[#f3edd7]">
      <ToastContainer />
      <UserHeader />

      {/* Search */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search PDFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-300 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ===================== PDF SECTION ===================== */}
      <SectionHeader title="PDF Documents" />

      {!hasMatches ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-red-600 font-semibold text-lg mt-10"
        >
          404 — No results found for{" "}
          <span className="font-semibold">&quot;{searchTerm}&quot;</span>
        </motion.div>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 px-6"
          >
            <AnimatePresence>
              {sortedPDFs.slice(0, visiblePDFs).map((pdf, idx) => {
                const key = pdf._id || String(idx);
                const liked = userLiked[key] || false;
                const likeCount = likes[key] || 0;

                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white shadow rounded-xl overflow-hidden"
                  >
                    <div className="relative flex items-center justify-center h-40 bg-gray-100">
                      <FileText className="text-blue-600 w-12 h-12 opacity-70" />
                    </div>
                    <p className="p-2 text-sm font-medium text-center">
                      {pdf.title}
                    </p>

                    <div className="flex justify-center items-center pb-2">
                      <button
                        onClick={() => toggleLike(key)}
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            liked
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span className="text-gray-700">{likeCount}</span>
                      </button>
                    </div>

                    <div className="flex justify-center gap-3 pb-3">
                      <button
                        onClick={() => window.open(pdf.src, "_blank")}
                        className="px-3 py-1 text-sm border rounded-md hover:shadow-md"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(pdf)}
                        className="px-3 py-1 text-sm border rounded-md hover:shadow-md"
                      >
                        Download
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <ViewMoreButton
            visibleCount={visiblePDFs}
            totalCount={sortedPDFs.length}
            setVisible={setVisiblePDFs}
          />
        </>
      )}
    </div>
  );
}

// ---------- REUSABLE COMPONENTS ----------
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center mt-12">
      {title}
    </h2>
  );
}

function ViewMoreButton({
  visibleCount,
  totalCount,
  setVisible,
}: {
  visibleCount: number;
  totalCount: number;
  setVisible: React.Dispatch<React.SetStateAction<number>>;
}) {
  const handleToggle = () => {
    if (visibleCount < totalCount) setVisible((v) => v + 4);
    else setVisible(4);
  };
  return (
    <div className="flex justify-center mt-6">
      <button
        onClick={handleToggle}
        className="px-5 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
      >
        {visibleCount < totalCount ? "View More" : "Hide"}
      </button>
    </div>
  );
}
