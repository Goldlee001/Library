"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import UserHeader from "@/components/user-header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ---------- TYPES ----------
interface ImageItem { _id?: string; title: string; src: string }

// ---------- MAIN COMPONENT ----------
export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [visibleImages, setVisibleImages] = useState(4);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/media?type=image&scope=library", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load images");
        const data = await res.json();
        const items: ImageItem[] = (data?.items || []).map((m: any, i: number) => ({ _id: m._id || String(i), title: m.title || "Untitled", src: m.src }));
        setImages(items);
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---------- LIKE TOGGLE ----------
  const toggleLike = (id: string) => {
    const isLiked = userLiked[id] || false;
    setLikes((prev) => ({
      ...prev,
      [id]: isLiked ? Math.max((prev[id] || 1) - 1, 0) : (prev[id] || 0) + 1,
    }));
    setUserLiked((prev) => ({ ...prev, [id]: !isLiked }));
  };

  // ---------- FILTERING ----------
  const sortedImages = useMemo(() => {
    if (!searchTerm.trim()) return images;
    const lower = searchTerm.toLowerCase();
    const matches = images.filter((v) => v.title.toLowerCase().includes(lower));
    const nonMatches = images.filter(
      (v) => !v.title.toLowerCase().includes(lower)
    );
    return [...matches, ...nonMatches];
  }, [searchTerm, images]);

  const hasMatches = useMemo(() => {
    if (!searchTerm.trim()) return true;
    return images.some((v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, images]);

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
                  a.download = item.title;
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
          placeholder="Search images..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-300 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ===================== IMAGES SECTION ===================== */}
      <SectionHeader title="Images" />

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-600 font-semibold text-lg mt-10"
        >
          Loading...
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-red-600 font-semibold text-lg mt-10"
        >
          {error}
        </motion.div>
      ) : !hasMatches ? (
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
              {sortedImages.slice(0, visibleImages).map((image, idx) => {
                const key = image._id || String(idx);
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
                    <div className="relative">
                      <img
                        src={image.src}
                        alt={image.title}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                    <p className="p-2 text-sm font-medium text-center">
                      {image.title}
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
                        onClick={() => setSelectedImage(image.src)}
                        className="px-3 py-1 text-sm border rounded-md hover:shadow-md"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(image)}
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
            visibleCount={visibleImages}
            totalCount={sortedImages.length}
            setVisible={setVisibleImages}
          />
        </>
      )}

      {/* ---------- Image Modal ---------- */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative w-full max-w-2xl"
            >
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full max-h-[80vh] rounded-lg object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-white/80 rounded-full p-2"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
