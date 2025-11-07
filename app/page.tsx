"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import { useEffect, useState } from "react";

type MediaItem = { _id?: string; title: string; type: "image" | "video" | "pdf"; src: string };

export default function LandingPage() {
  const [resources, setResources] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/media?scope=dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load media");
        const data = await res.json();
        const items: MediaItem[] = (data?.items || []).map((m: any) => ({
          _id: m._id,
          title: m.title || "Untitled",
          type: m.type,
          src: m.src,
        }));
        setResources(items);
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Header />
      <HeroSection />

      <main className="bg-[#f9f6ef] min-h-screen">
        <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-10">
          {/* Left: Main Book Overview */}
          <div className="md:col-span-1">
            <img
              src="/images/Beyond.jpeg"
              alt="Beyond Words: A Journey Through Learning"
              loading="lazy"
              className="rounded-lg shadow-md w-full object-cover"
            />

            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-4">
                Beyond Words: A Journey Through Learning
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to our digital library — a hub of knowledge and
                discovery. This platform provides students with access to
                a diverse collection of resources, including books, academic
                PDFs, instructional videos, and educational images. Inspired
                by the enduring message of “The Book Thief,” our library
                celebrates the transformative power of learning and the written word.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Set during a time of conflict and transformation, this story
                reflects the resilience of a young learner who discovers hope
                and strength through the power of words. Just as Liesel
                Meminger found comfort in books amid hardship, our library
                encourages students to seek knowledge, share ideas, and find
                inspiration through reading, viewing, and learning.
              </p>

              <p className="text-gray-700 leading-relaxed">
                As the pursuit of knowledge deepens, awareness and
                understanding grow. Just as Liesel’s love for books opened her
                eyes to the world around her, our library aims to foster
                curiosity, empathy, and intellectual resilience.
              </p>
            </div>
          </div>

          {/* Right: Related Learning Materials */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold mb-6">Learning Materials</h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && (
                <div className="col-span-full text-center text-gray-600">Loading...</div>
              )}
              {error && (
                <div className="col-span-full text-center text-red-600">{error}</div>
              )}
              {!loading && !error && resources.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  {/* Render media by type */}
                  {item.type === "image" && (
                    <img
                      src={item.src}
                      alt={item.title}
                      loading="lazy"
                      className="rounded-md mb-3 w-full h-64 object-cover"
                    />
                  )}

                  {item.type === "video" && (
                    <video
                      key={item.src}
                      controls
                      preload="metadata"
                      className="rounded-md mb-3 w-full h-64 object-cover"
                    >
                      <source src={item.src} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}

                  {item.type === "pdf" && (
                    <iframe
                      src={item.src}
                      title={item.title}
                      className="rounded-md mb-3 w-full h-64 border"
                    >
                      This browser does not support PDFs. Please download the PDF
                      to view it.
                    </iframe>
                  )}

                  <h4 className="text-sm font-medium text-center text-gray-800">
                    {item.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
