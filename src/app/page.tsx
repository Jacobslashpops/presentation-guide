"use client";

import { useState, useRef, useEffect } from "react";

const steps = [
  {
    id: "tool",
    title: "Choose Your AI Tool",
    content: (
      <div className="space-y-6">
        <p className="text-lg text-gray-600">
          Pick one of these AI coding assistants. You only need one.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <a
            href="https://claude.ai/download"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="text-2xl font-bold text-gray-900 mb-2">Claude</div>
            <p className="text-gray-600">Download Claude desktop app</p>
            <div className="mt-4 text-blue-600 font-medium">claude.ai/download →</div>
          </a>
          <a
            href="https://github.com/openai/codex"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all"
          >
            <div className="text-2xl font-bold text-gray-900 mb-2">Codex</div>
            <p className="text-gray-600">OpenAI&apos;s CLI coding tool</p>
            <div className="mt-4 text-green-600 font-medium">github.com/openai/codex →</div>
          </a>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
  },
  {
    id: "project",
    title: "Create Your Project",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-gray-600 text-center">
          Open your terminal and run these commands:
        </p>
        <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
          <pre className="text-sm text-green-400 font-mono">
            <code>{`npx create-next-app@latest my-presentation --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd my-presentation
npm install clsx tailwind-merge`}</code>
          </pre>
        </div>
        <div className="flex items-start gap-3 text-gray-600">
          <span className="text-blue-500 mt-1">💡</span>
          <p>Press Enter when it asks questions. All defaults are fine.</p>
        </div>
      </div>
    ),
    bgColor: "bg-white",
  },
  {
    id: "prompt",
    title: "Copy This Prompt to AI",
    content: (
      <div className="space-y-6 text-left max-w-3xl mx-auto">
        <p className="text-lg text-gray-600 text-center">
          Open your AI tool and paste this prompt:
        </p>
        <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto relative">
          <button
            onClick={() => {
              const prompt = `Please create a presentation webpage for me using Next.js + React + TypeScript + Tailwind CSS.

Core requirements (must follow strictly):
1. Each slide must fill exactly one screen (100vh). No scrolling within a single slide. If content is too long, simplify or split into multiple slides.

2. Snap scrolling with damping: Use CSS scroll-snap to create a PowerPoint-like page-flipping experience:
   - Set scroll-snap-type: y mandatory and scroll-snap-align: start
   - Use scroll-behavior: smooth for smooth transitions
   - Add keyboard navigation with arrow keys (↑↓) and spacebar

3. Page structure:
   - Each section is a full-screen page (h-screen)
   - Each slide contains: title, body content
   - Add a dot page indicator on the right side, clickable to jump to any slide

4. Visual design:
   - Professional and clean color scheme suitable for academic/project presentations
   - Clear font size hierarchy, readable from a distance
   - Add subtle entrance animations (fade-in, slide-up), but don't overdo it

5. Responsive: Optimized for projector/large screen ratios (16:9).

Please generate complete, runnable code.`;
              navigator.clipboard.writeText(prompt);
              alert("Prompt copied!");
            }}
            className="absolute top-4 right-4 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Copy
          </button>
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
            <code>{`Please create a presentation webpage for me using Next.js + React + TypeScript + Tailwind CSS.

Core requirements (must follow strictly):
1. Each slide must fill exactly one screen (100vh). No scrolling within a single slide.

2. Snap scrolling with damping: Use CSS scroll-snap for PowerPoint-like flipping:
   - scroll-snap-type: y mandatory
   - scroll-snap-align: start
   - Keyboard navigation (↑↓ and spacebar)

3. Page structure:
   - Each section is h-screen
   - Title + body content per slide
   - Dot page indicator on the right

4. Visual design: Professional, clean, readable from distance.

5. Responsive: Optimized for 16:9 projectors.

Please generate complete, runnable code.`}</code>
          </pre>
        </div>
      </div>
    ),
    bgColor: "bg-gray-50",
  },
  {
    id: "files",
    title: "Put Code in the Right Place",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-gray-600 text-center">
          AI will generate multiple files. Place them here:
        </p>
        <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
          <pre className="text-sm text-blue-400 font-mono">
            <code>{`my-presentation/
├── app/
│   ├── page.tsx          ← Main page code
│   ├── layout.tsx        ← Already exists
│   └── globals.css       ← Add CSS here
└── components/
    ├── Slide.tsx           ← Components here
    ├── SlideContainer.tsx
    └── PageIndicator.tsx`}</code>
          </pre>
        </div>
        <div className="flex items-start gap-3 text-gray-600">
          <span className="text-blue-500 mt-1">💡</span>
          <p>Create the components folder: <code className="bg-gray-200 px-2 py-1 rounded">mkdir components</code></p>
        </div>
      </div>
    ),
    bgColor: "bg-white",
  },
  {
    id: "run",
    title: "Run It",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-gray-600 text-center">
          In your terminal, run:
        </p>
        <div className="bg-gray-900 rounded-xl p-6">
          <pre className="text-sm text-green-400 font-mono">
            <code>npm run dev</code>
          </pre>
        </div>
        <p className="text-gray-600 text-center">
          Then open <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:3000</code> in your browser.
        </p>
        <div className="flex items-start gap-3 text-gray-600">
          <span className="text-blue-500 mt-1">⌨️</span>
          <p>Press <code className="bg-gray-200 px-2 py-1 rounded">↓</code> or <code className="bg-gray-200 px-2 py-1 rounded">Space</code> to flip through slides.</p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-green-50 to-emerald-100",
  },
  {
    id: "style",
    title: "Make It Pretty with 21st.dev",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-gray-600 text-center">
          Visit <a href="https://21st.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">21st.dev</a> to find beautiful styles.
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-gray-700">
            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
            <p>Browse components and find a style you like</p>
          </div>
          <div className="flex items-start gap-3 text-gray-700">
            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
            <p>Copy the component description</p>
          </div>
          <div className="flex items-start gap-3 text-gray-700">
            <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
            <p>Tell your AI: &quot;Apply this style to my presentation, keep the 100vh structure&quot;</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-gray-600 bg-yellow-50 p-4 rounded-lg">
          <span className="text-yellow-600 mt-1">⚠️</span>
          <p>Avoid complex forms and data tables. Stick to backgrounds, cards, and typography effects.</p>
        </div>
      </div>
    ),
    bgColor: "bg-white",
  },
  {
    id: "deploy",
    title: "Deploy Online (Optional)",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-gray-600 text-center">
          Share your presentation with a free Vercel deployment:
        </p>
        <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
          <pre className="text-sm text-green-400 font-mono">
            <code>{`npm install -g vercel
vercel login
vercel`}</code>
          </pre>
        </div>
        <p className="text-gray-600 text-center">
          You&apos;ll get a link like <code className="bg-gray-200 px-2 py-1 rounded">https://my-presentation-xxx.vercel.app</code>
        </p>
        <div className="flex items-start gap-3 text-gray-600">
          <span className="text-blue-500 mt-1">💡</span>
          <p>Sign up at <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">vercel.com</a> first (free, uses GitHub login).</p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-purple-50 to-pink-100",
  },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const slideHeight = window.innerHeight;
      const newSlide = Math.round(scrollTop / slideHeight);
      setCurrentSlide(Math.min(newSlide, steps.length - 1));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const slideHeight = window.innerHeight;

      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        container.scrollBy({ top: slideHeight, behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        container.scrollBy({ top: -slideHeight, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const goToSlide = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: index * window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll scroll-smooth"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {steps.map((step, index) => (
          <section
            key={step.id}
            className={`h-screen w-full flex flex-col items-center justify-center px-6 md:px-16 lg:px-24 snap-start snap-always ${step.bgColor}`}
          >
            <div className="max-w-4xl w-full">
              <div className="flex items-center gap-4 mb-8 justify-center">
                <span className="bg-gray-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                  {step.title}
                </h1>
              </div>
              <div className="animate-fade-in">
                {step.content}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Page Indicator */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-gray-900 scale-125"
                : "bg-gray-400 hover:bg-gray-600"
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gray-900 transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / steps.length) * 100}%` }}
        />
      </div>
    </>
  );
}
