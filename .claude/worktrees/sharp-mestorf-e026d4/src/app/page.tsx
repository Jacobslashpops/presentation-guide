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

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      alert("Skill copied! Now paste it into your AI tool.");
    } else {
      alert("Copy failed. Please select all text and copy manually (Ctrl+C / Cmd+C).");
    }
  } catch (err) {
    alert("Copy not supported. Please select all text and copy manually (Ctrl+C / Cmd+C).");
  }
  document.body.removeChild(textarea);
}

const steps = [
  {
    id: "intro",
    title: "Build Presentation Websites with AI",
    content: (
      <div className="space-y-8">
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A 3-step flow for beginners to create stunning presentation websites using vibe coding.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          <div className="p-7 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg shadow-blue-500/25">1</div>
            <div className="font-bold text-lg text-slate-900">Install AI Tool</div>
            <p className="text-slate-500 text-sm mt-2">Claude or Codex</p>
          </div>
          <div className="p-7 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg shadow-emerald-500/25">2</div>
            <div className="font-bold text-lg text-slate-900">Paste the Skill</div>
            <p className="text-slate-500 text-sm mt-2">Copy from this page</p>
          </div>
          <div className="p-7 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg shadow-amber-500/25">3</div>
            <div className="font-bold text-lg text-slate-900">Say &quot;Use It&quot;</div>
            <p className="text-slate-500 text-sm mt-2">AI builds your slides</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          Press <kbd className="px-2.5 py-1 bg-slate-200/80 rounded-md text-xs font-mono text-slate-600 border border-slate-300/50">↓</kbd> or scroll to start
        </p>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40",
  },
  {
    id: "tool",
    title: "Step 1: Install Your AI Tool",
    content: (
      <div className="space-y-6">
        <p className="text-lg text-slate-600">
          Pick one. You only need one AI assistant.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <a
            href="https://claude.ai/download"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-7 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-blue-400/50 hover:-translate-y-1 transition-all duration-300 text-left group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4 shadow-md shadow-orange-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">Claude</div>
            <p className="text-slate-600 leading-relaxed">Desktop app with AI coding assistant</p>
            <div className="mt-4 text-blue-600 font-medium text-sm flex items-center gap-1">
              claude.ai/download
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </a>
          <a
            href="https://github.com/openai/codex"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-7 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-green-400/50 hover:-translate-y-1 transition-all duration-300 text-left group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4 shadow-md shadow-green-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors">Codex</div>
            <p className="text-slate-600 leading-relaxed">OpenAI&apos;s CLI coding tool</p>
            <div className="mt-4 text-green-600 font-medium text-sm flex items-center gap-1">
              github.com/openai/codex
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </a>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-b from-white to-slate-50",
  },
  {
    id: "skill",
    title: "Step 2: Copy the Skill",
    content: (
      <div className="space-y-6 text-left max-w-3xl mx-auto">
        <p className="text-lg text-slate-600 text-center">
          Create a folder and paste this skill into your AI:
        </p>
        <div className="bg-slate-900 rounded-2xl p-6 overflow-auto relative max-h-[50vh] shadow-2xl shadow-slate-900/30 ring-1 ring-white/10">
          <button
            onClick={() => {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(skillContent).then(() => {
                  alert("Skill copied! Now paste it into your AI tool.");
                }).catch(() => {
                  fallbackCopy(skillContent);
                });
              } else {
                fallbackCopy(skillContent);
              }
            }}
            className="absolute top-4 right-4 px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm rounded-lg hover:bg-white/20 transition-all duration-200 font-medium z-10 border border-white/10 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
            </svg>
            Copy Skill
          </button>
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            <code>{skillContent}</code>
          </pre>
        </div>
        <div className="flex items-start gap-3 text-slate-700 bg-blue-50/80 backdrop-blur-sm p-5 rounded-xl border border-blue-200/50">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <p>After AI writes the skill files, you&apos;re ready for Step 3.</p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-b from-slate-50 to-gray-100/50",
  },
  {
    id: "use",
    title: "Step 3: Say &quot;Use It&quot;",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-slate-600 text-center">
          Tell your AI to use the skill. Copy one of these:
        </p>
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Use the presentation skill to build a website about climate change for my class presentation.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm leading-relaxed pr-20">
              Use the presentation skill to build a website about climate change for my class presentation.
            </p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Use the presentation skill to create a portfolio showcase with 5 slides.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm leading-relaxed pr-20">
              Use the presentation skill to create a portfolio showcase with 5 slides.
            </p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-6 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Use the presentation skill to make a pitch deck for my startup idea.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm leading-relaxed pr-20">
              Use the presentation skill to make a pitch deck for my startup idea.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-slate-700">
          <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <p>Replace the topic with whatever you&apos;re presenting. The AI handles the rest.</p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-green-100/40",
  },
  {
    id: "mindset",
    title: "The Vibe Coding Mindset",
    content: (
      <div className="space-y-6 text-left max-w-3xl mx-auto">
        <p className="text-lg text-slate-600 text-center">
          Know your final goal. Never lose sight of it.
        </p>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 space-y-6 shadow-sm">
          <div className="flex items-start gap-5">
            <span className="bg-gradient-to-br from-slate-800 to-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-slate-900/20">1</span>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Define Your Final Goal</h3>
              <p className="text-slate-600 leading-relaxed mt-1">Be crystal clear about what you want. &quot;A 5-slide presentation website about climate change with scroll-snap navigation.&quot;</p>
            </div>
          </div>
          <div className="flex items-start gap-5">
            <span className="bg-gradient-to-br from-slate-800 to-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-slate-900/20">2</span>
            <div>
              <h3 className="font-bold text-lg text-slate-900">State It, Then Restate It</h3>
              <p className="text-slate-600 leading-relaxed mt-1">Tell AI your goal upfront. If the conversation drifts, bring it back: &quot;Remember, my goal is to build a presentation website.&quot;</p>
            </div>
          </div>
          <div className="flex items-start gap-5">
            <span className="bg-gradient-to-br from-slate-800 to-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-slate-900/20">3</span>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Detours Are Okay</h3>
              <p className="text-slate-600 leading-relaxed mt-1">Missing a dependency? Ask AI to install it. Stuck on an error? Ask for help. But always come back to your main thread.</p>
            </div>
          </div>
          <div className="flex items-start gap-5">
            <span className="bg-gradient-to-br from-slate-800 to-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-slate-900/20">4</span>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Everything Serves the Goal</h3>
              <p className="text-slate-600 leading-relaxed mt-1">Every question, every fix, every detour — it all helps you reach the final goal faster. Nothing is wasted.</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50/80 backdrop-blur-sm border-l-4 border-amber-400 p-5 rounded-r-xl">
          <p className="text-slate-700 font-medium leading-relaxed">
            &quot;My goal is to build a presentation website. Help me install Node.js so I can get there.&quot;
          </p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-100/30",
  },
  {
    id: "style",
    title: "Bonus: Make It Pretty",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-slate-600 text-center">
          Visit <a href="https://21st.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors font-medium">21st.dev</a> to find beautiful styles.
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-4 text-slate-700 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40">
            <span className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md shadow-blue-500/20">1</span>
            <p className="leading-relaxed">Browse components and find a style you like</p>
          </div>
          <div className="flex items-start gap-4 text-slate-700 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40">
            <span className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md shadow-blue-500/20">2</span>
            <p className="leading-relaxed">Copy the component description</p>
          </div>
          <div className="flex items-start gap-4 text-slate-700 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/40">
            <span className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md shadow-blue-500/20">3</span>
            <p className="leading-relaxed">Tell your AI: &quot;Apply this style to my presentation, keep the 100vh structure&quot;</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-slate-700 bg-amber-50/80 backdrop-blur-sm p-5 rounded-xl border border-amber-200/50">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p>Avoid complex forms and data tables. Stick to backgrounds, cards, and typography effects.</p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-b from-white to-slate-50",
  },
  {
    id: "deploy",
    title: "Deploy & Share",
    content: (
      <div className="space-y-6 text-left max-w-2xl mx-auto">
        <p className="text-lg text-slate-600 text-center">
          Share your presentation with a free Vercel deployment:
        </p>
        <div className="bg-slate-900 rounded-2xl p-7 overflow-x-auto shadow-2xl shadow-slate-900/30 ring-1 ring-white/10">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">
            <code>{`npm install -g vercel
vercel login
vercel`}</code>
          </pre>
        </div>
        <p className="text-slate-600 text-center">
          You&apos;ll get a link like <code className="bg-slate-100 px-2.5 py-1 rounded-md text-sm font-mono text-slate-700 border border-slate-200">https://my-presentation-xxx.vercel.app</code>
        </p>
        <div className="flex items-start gap-3 text-slate-700">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <p>Sign up at <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors font-medium">vercel.com</a> first (free, uses GitHub login).</p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-rose-100/40",
  },
  {
    id: "cheatsheet",
    title: "Quick Prompts Cheat Sheet",
    content: (
      <div className="space-y-6 text-left max-w-3xl mx-auto">
        <p className="text-lg text-slate-600 text-center">
          Common things you might need. Click to copy:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-2xl p-5 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Help me deploy my presentation website to port 3000.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm pr-16 leading-relaxed">Help me deploy my presentation website to port 3000.</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Change the background color of slide 2 to a dark blue gradient.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm pr-16 leading-relaxed">Change the background color of slide 2 to a dark blue gradient.</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Add a new slide after slide 3 with a chart showing my data.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm pr-16 leading-relaxed">Add a new slide after slide 3 with a chart showing my data.</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Make the title font bigger and use a bold sans-serif font.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm pr-16 leading-relaxed">Make the title font bigger and use a bold sans-serif font.</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Add a background image to the first slide using a URL.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm pr-16 leading-relaxed">Add a background image to the first slide using a URL.</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Fix: the page is scrolling freely instead of snapping to each slide.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm pr-16 leading-relaxed">Fix: the page is scrolling freely instead of snapping to each slide.</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Add keyboard navigation with arrow keys and spacebar.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm pr-16 leading-relaxed">Add keyboard navigation with arrow keys and spacebar.</p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 relative group shadow-lg shadow-slate-900/20 ring-1 ring-white/5 hover:ring-white/10 transition-all">
            <button
              onClick={() => {
                const text = "Export my presentation as a static site for GitHub Pages.";
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text).then(() => alert("Copied!")).catch(() => fallbackCopy(text));
                } else {
                  fallbackCopy(text);
                }
              }}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
              Copy
            </button>
            <p className="text-slate-300 font-mono text-sm pr-16 leading-relaxed">Export my presentation as a static site for GitHub Pages.</p>
          </div>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-b from-white to-slate-50",
  },
  {
    id: "homework",
    title: "Submit Your Work",
    content: (
      <div className="space-y-6 text-left max-w-3xl mx-auto">
        <p className="text-lg text-slate-600 text-center">
          Done? Package your entire project folder and upload it.
        </p>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 space-y-5 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900">How to Package Your Project</h3>
          <p className="text-slate-600 leading-relaxed">
            A Next.js project has many files. You must zip the <strong className="text-slate-800">entire folder</strong>, not just one file.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md shadow-blue-500/20">1</span>
              <div>
                <p className="font-medium text-slate-900">Find your project folder</p>
                <p className="text-slate-500 text-sm">It should be named <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">my-presentation</code> (or whatever you named it)</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md shadow-blue-500/20">2</span>
              <div>
                <p className="font-medium text-slate-900">Compress the entire folder</p>
                <p className="text-slate-500 text-sm">
                  <strong>Mac:</strong> Right-click the folder → &quot;Compress&quot;<br/>
                  <strong>Windows:</strong> Right-click the folder → &quot;Send to&quot; → &quot;Compressed (zipped) folder&quot;
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md shadow-blue-500/20">3</span>
              <div>
                <p className="font-medium text-slate-900">Upload the .zip file</p>
                <p className="text-slate-500 text-sm">Drop it into the link below. No account needed.</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-400 p-5 rounded-r-xl">
            <p className="text-red-700 font-medium text-sm leading-relaxed">
              Do NOT just copy page.tsx or index.html. Your project needs node_modules, package.json, and all config files to run.
            </p>
          </div>
        </div>

        <div className="text-center">
          <a
            href="https://tinyurl.com/ee09876"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-2xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
          >
            Upload to Google Drive
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <p className="text-slate-400 text-sm mt-4">Anyone with the link can upload. No sign-in required.</p>
        </div>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-pink-50/50 via-rose-50/30 to-red-100/30",
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
              <div className="flex items-center gap-4 mb-10 justify-center">
                <span className="bg-gradient-to-br from-slate-800 to-slate-900 text-white w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-900/20">
                  {index + 1}
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
                  {step.title}
                </h1>
              </div>
              <div className="animate-fade-in-up">
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
                ? "bg-slate-900 scale-125 shadow-md shadow-slate-900/30"
                : "bg-slate-400/60 hover:bg-slate-500 hover:scale-110"
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200/60 z-50">
        <div
          className="h-full bg-gradient-to-r from-slate-800 to-slate-900 transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / steps.length) * 100}%` }}
        />
      </div>
    </>
  );
}
