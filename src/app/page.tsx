"use client";

import { useState, useRef, useEffect } from "react";

const skillContent = `---
name: presentation
description: |
  Presentation Website Builder — Helps complete beginners create presentation
  websites using vibe coding with Next.js + React + TypeScript + Tailwind CSS.
  Guides users through choosing an AI tool, creating a project, copying prompts,
  finding styles on 21st.dev, and deploying to Vercel. Use when asked to
  "build a presentation", "create slides", "presentation website",
  "vibe coding presentation", or "how to make a slide website".
triggers:
  - build a presentation
  - create presentation website
  - presentation slides
  - vibe coding presentation
  - how to make slides
---

# Presentation Website Builder

Helps complete beginners create presentation websites using vibe coding.

## When to Use This Skill

When the user wants to build a presentation webpage (class demo, project showcase,
portfolio, etc.) where each slide fills the entire screen and flips like PowerPoint.

## Prerequisites

1. Node.js installed (https://nodejs.org)
2. An AI coding tool (Claude Code, Codex CLI, or Google CLI)
3. Basic ability to type commands in a terminal

---

## Step 1: Choose Your AI Tool

Pick one of these AI coding assistants. You only need one.

| Tool | What it is | Download |
|------|-----------|----------|
| **Claude** | Desktop app with AI coding assistant | https://claude.ai/download |
| **Codex** | OpenAI's CLI coding tool | https://github.com/openai/codex |

---

## Step 2: Create Your Project

### Open Your Terminal

**Mac**: Press \`Command + Space\`, type \`terminal\`, press Enter
**Windows**: Press \`Win + R\`, type \`cmd\`, press Enter

### Run the Project Creation Command

Copy and paste this line into your terminal, then press Enter:

\`\`\`bash
npx create-next-app@latest my-presentation --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
\`\`\`

It will ask you a few questions. Just press Enter to accept the defaults for all of them.

### Enter the Project Folder

\`\`\`bash
cd my-presentation
\`\`\`

### Install Extra Dependencies

\`\`\`bash
npm install clsx tailwind-merge
\`\`\`

---

## Step 3: Ask AI to Generate the Base Structure

Open your AI tool and copy-paste this prompt:

---

**PROMPT START (copy from here)**

\`\`\`
Please create a presentation webpage for me using Next.js + React + TypeScript + Tailwind CSS.

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

Please generate complete, runnable code.
\`\`\`

**PROMPT END (copy to here)**

---

### Put Code in the Right Files

The AI will generate multiple files. Place them according to this structure:

\`\`\`
my-presentation/
├── app/
│   ├── page.tsx          ← Main page code goes here
│   ├── layout.tsx        ← Already exists, usually no change needed
│   └── globals.css       ← Add CSS here if AI tells you to
└── components/
    ├── Slide.tsx           ← AI-generated components go here
    ├── SlideContainer.tsx
    └── PageIndicator.tsx
\`\`\`

If the \`components\` folder doesn't exist, create it:

\`\`\`bash
mkdir components
\`\`\`

---

## Step 4: Run and Preview

In your terminal, run:

\`\`\`bash
npm run dev
\`\`\`

When you see something like \`Ready on http://localhost:3000\`, open your browser and visit:

\`\`\`
http://localhost:3000
\`\`\`

Press \`↓\` or \`Space\` on your keyboard to flip through slides.

---

## Step 5: Find Styles on 21st.dev

### Open the Website

Visit: https://21st.dev

### Pick Components

Good component types for presentations:
- **Background effects**: Gradients, particles, waves, starfields
- **Card styles**: Glassmorphism, frosted glass, rounded shadows
- **Typography effects**: Large headings, gradient text
- **Decorative elements**: Dividers, icons, badges

**Avoid these**: Complex forms, data tables, multi-level navigation menus (not suitable for presentations)

### Copy the Component Description

Find a component you like, click it, and copy the description text. For example:

\`\`\`
A hero section with gradient background, floating particles, and glassmorphism cards
\`\`\`

### Ask AI to Apply the Style

Go back to your AI conversation and copy-paste this prompt:

---

**PROMPT START (copy from here)**

\`\`\`
I found a style I like. The description is:
[Paste the description you copied from 21st.dev]

Please apply this style to my presentation webpage with these requirements:
1. Keep the original 100vh single-screen slide structure
2. Keep the scroll-snap page-flipping behavior
3. Keep the keyboard navigation (arrow keys, spacebar)
4. Only modify visual styles (colors, backgrounds, fonts, spacing, animations, etc.)

Please generate the updated complete code.
\`\`\`

**PROMPT END (copy to here)**

---

### Replace the Code

After AI generates the new code, overwrite the original files. Refresh your browser to see the changes.

---

## Step 6: Edit Your Content

### Change Text

Open \`app/page.tsx\` and edit the text directly. For example:

\`\`\`tsx
// Original
title: "Project Title",

// Change to yours
title: "AI in Medical Diagnosis",
\`\`\`

### Add a Slide

Copy a slide entry in the \`slides\` array in \`page.tsx\` and modify it:

\`\`\`tsx
const slides = [
  // ... existing slides
  {
    id: 5,  // Make sure id increments
    title: "New Slide Title",
    content: <p>New slide content</p>,
    bgColor: "bg-blue-50",
  },
];
\`\`\`

### Remove a Slide

Simply delete the corresponding entry from the \`slides\` array.

---

## Step 7: Deploy Online (Optional)

If you want to share your presentation with others, deploy it to Vercel (free):

### 1. Sign Up for Vercel

Visit https://vercel.com and log in with your GitHub account.

### 2. Install Vercel CLI

\`\`\`bash
npm install -g vercel
\`\`\`

### 3. Log In

\`\`\`bash
vercel login
\`\`\`

Follow the prompts to complete login.

### 4. Deploy

In your project folder, run:

\`\`\`bash
vercel
\`\`\`

Follow the prompts, accepting all defaults. After deployment, you'll get a URL like:

\`\`\`
https://my-presentation-xxx.vercel.app
\`\`\`

Share this link with your teacher/classmates.

---

## Quick Reference: Common Requests

| I want to... | Say this to AI |
|-------------|----------------|
| Add a slide | "Please add another slide titled XXX with content XXX" |
| Change colors | "Change the color scheme to dark theme" or "Use a blue-purple gradient" |
| Add an image | "Add a background image to the first slide, use object-cover" |
| Add animation | "Add fade-in slide-up entrance animation to each slide" |
| Add a chart | "Add a bar chart showing data, use pure CSS or simple SVG" |
| Change fonts | "Make headings larger and bolder, body text more readable" |
| Add a video | "Embed a YouTube video on slide 2, max width 800px" |
| Add a QR code | "Add a QR code area on the last slide, linking to xxx" |

---

## Core Concepts (Don't Worry, AI Writes the Code)

- **100vh** = The height of the browser window, makes content fill exactly one screen
- **scroll-snap** = CSS feature that snaps scrolling to page boundaries, creating a "flip" feeling
- **Tailwind CSS** = A tool for quickly writing styles using class names (like \`bg-blue-500\`, \`text-center\`)
- **Component** = A reusable piece of UI code, like a button or a card

---

## Tips

1. **Don't put too much content**: Keep text to 3-5 bullet points per slide, or it gets crowded
2. **Limit image height**: If adding images, tell AI "image max height 60% of screen"
3. **Get it running first, then pretty**: Use the base prompt to get the structure working, then find styles on 21st.dev
4. **Save your prompts**: Keep the final code AI generates, reuse it for future presentations
5. **Stop with Ctrl+C**: To stop \`npm run dev\`, press \`Ctrl + C\`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Terminal says \`command not found\` | Check if Node.js is installed, reinstall from https://nodejs.org |
| Page scrolls freely, no flip feeling | Check if scroll-snap-type is set to y mandatory |
| Content overflows screen | Tell AI "content is too much, simplify to fit one screen" |
| Styles not working | Check if Tailwind CSS is properly installed |
| Don't know which file to put code in | Ask AI "Which file should this code go in?" |
| Port already in use | Run \`npm run dev -- --port 3001\` to use a different port |
| Layout breaks after applying 21st.dev style | Tell AI "Keep the original 100vh structure, only change colors and decorations" |`;

const steps = [
  {
    id: "intro",
    title: "Build Presentation Websites with AI",
    content: (
      <div className="space-y-8">
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A 3-step flow for beginners to create stunning presentation websites using vibe coding.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="p-6 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-3xl mb-3">1</div>
            <div className="font-bold text-lg">Install AI Tool</div>
            <p className="text-gray-500 text-sm mt-2">Claude or Codex</p>
          </div>
          <div className="p-6 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-3xl mb-3">2</div>
            <div className="font-bold text-lg">Paste the Skill</div>
            <p className="text-gray-500 text-sm mt-2">Copy from this page</p>
          </div>
          <div className="p-6 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-3xl mb-3">3</div>
            <div className="font-bold text-lg">Say &quot;Use It&quot;</div>
            <p className="text-gray-500 text-sm mt-2">AI builds your slides</p>
          </div>
        </div>
        <p className="text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-200 rounded text-sm">↓</kbd> or scroll to start
        </p>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
  },
  {
    id: "tool",
    title: "Step 1: Install Your AI Tool",
    content: (
      <div className="space-y-6">
        <p className="text-lg text-gray-600">
          Pick one. You only need one AI assistant.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <a
            href="https://claude.ai/download"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <div className="text-2xl font-bold text-gray-900 mb-2">Claude</div>
            <p className="text-gray-600">Desktop app with AI coding assistant</p>
            <div className="mt-4 text-blue-600 font-medium">claude.ai/download →</div>
          </a>
          <a
            href="https://github.com/openai/codex"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all text-left"
          >
            <div className="text-2xl font-bold text-gray-900 mb-2">Codex</div>
            <p className="text-gray-600">OpenAI&apos;s CLI coding tool</p>
            <div className="mt-4 text-green-600 font-medium">github.com/openai/codex →</div>
          </a>
        </div>
      </div>
    ),
    bgColor: "bg-white",
  },
  {
    id: "skill",
    title: "Step 2: Copy the Skill",
    content: (
      <div className="space-y-6 text-left max-w-3xl mx-auto">
        <p className="text-lg text-gray-600 text-center">
          Create a folder and paste this skill into your AI:
        </p>
        <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto relative">
          <button
            onClick={() => {
              navigator.clipboard.writeText(skillContent);
              alert("Skill copied! Now paste it into your AI tool.");
            }}
            className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors font-medium"
          >
            Copy Skill
          </button>
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
            <code>{skillContent}</code>
          </pre>
        </div>
        <div className="flex items-start gap-3 text-gray-600 bg-blue-50 p-4 rounded-lg">
          <span className="text-blue-500 mt-1">💡</span>
          <p>After AI writes the skill files, you&apos;re ready for Step 3.</p>
        </div>
      </div>
    ),
    bgColor: "bg-gray-50",
  },
  {
    id: "use",
    title: "Step 3: Say &quot;Use It&quot;",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-gray-600 text-center">
          Tell your AI to use the skill. Copy one of these:
        </p>
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-6 relative group">
            <button
              onClick={() => {
                navigator.clipboard.writeText("Use the presentation skill to build a website about climate change for my class presentation.");
                alert("Copied!");
              }}
              className="absolute top-4 right-4 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              Copy
            </button>
            <p className="text-gray-300 font-mono text-sm">
              Use the presentation skill to build a website about climate change for my class presentation.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 relative group">
            <button
              onClick={() => {
                navigator.clipboard.writeText("Use the presentation skill to create a portfolio showcase with 5 slides.");
                alert("Copied!");
              }}
              className="absolute top-4 right-4 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              Copy
            </button>
            <p className="text-gray-300 font-mono text-sm">
              Use the presentation skill to create a portfolio showcase with 5 slides.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 relative group">
            <button
              onClick={() => {
                navigator.clipboard.writeText("Use the presentation skill to make a pitch deck for my startup idea.");
                alert("Copied!");
              }}
              className="absolute top-4 right-4 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              Copy
            </button>
            <p className="text-gray-300 font-mono text-sm">
              Use the presentation skill to make a pitch deck for my startup idea.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-gray-600">
          <span className="text-blue-500 mt-1">🎯</span>
          <p>Replace the topic with whatever you&apos;re presenting. The AI handles the rest.</p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-green-50 to-emerald-100",
  },
  {
    id: "style",
    title: "Bonus: Make It Pretty",
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
    title: "Deploy & Share",
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
