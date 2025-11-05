"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from '../components/HeroSection';
import { Separator } from "@/components/ui/separator";

export default function LandingPage() {
  return (
    <>
      <Header />

      <HeroSection />
      <main className="bg-[#f9f6ef] min-h-screen">
        {/* Hero / Breadcrumb Section */}


        {/* Main Content */}
        <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-10">
          {/* Left: Book Details */}
          <div className="md:col-span-1">
            <img
              src="/images/book-thief.jpg"
              alt="A Rapariga Que Roubana Livros"
              className="rounded-lg shadow-md w-full object-cover"
            />
            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-4">
                A Rapariga Que Roubana Livros
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                A Rapariga Que Roubana Livros is the Portuguese version of the
                international best-selling novel &quot;The Book Thief&quot; written by
                Australian author Markus Zusak. The book was originally
                published in English in 2005 and has since been translated into
                over 40 languages, including Portuguese.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Set in Nazi Germany during World War II, the book tells the
                story of a young orphaned girl named Liesel Meminger who finds
                solace by stealing books and sharing them with others. Taken
                away to live with foster parents Hans and Rosa Hubermann, Liesel
                learns the power of words against the horrors she faces.
              </p>

              <p className="text-gray-700 leading-relaxed">
                As Liesel’s love for books deepens, she becomes more and more
                aware of the events around her. Through her reading and
                friendships, the novel explores themes of love, loss, and the
                resilience of the human spirit.
              </p>
            </div>
          </div>

          {/* Right: Related Books */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold mb-6">Related Books</h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "The Book Thief (Image)",
                  type: "image",
                  src: "/images/book-thief.jpg",
                },
                {
                  title: "A Rapariga Que Roubana Livros (PDF)",
                  type: "pdf",
                  src: "/pdfs/book-thief-pt.pdf",
                },
                {
                  title: "Master Your Mind, Master Your Life (Video)",
                  type: "video",
                  src: "/videos/master-your-mind.mp4",
                },
                {
                  title: "Battle on the Home Front (Image)",
                  type: "image",
                  src: "/images/book-thief.jpg",
                },
                {
                  title: "Homefront: The Revolution (PDF)",
                  type: "pdf",
                  src: "/pdfs/homefront-revolution.pdf",
                },
                {
                  title: "Master Your Life (Video)",
                  type: "video",
                  src: "/videos/master-your-mind.mp4",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  {/* Conditional media rendering */}
                  {item.type === "image" && (
                    <img
                      src={item.src}
                      alt={item.title}
                      className="rounded-md mb-3 w-full h-64 object-cover"
                    />
                  )}

                  {item.type === "video" && (
                    <video
                      controls
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
                      This browser does not support PDFs. Please download the PDF to view it.
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
