# Presentation Website Builder

Helps complete beginners create presentation websites using vibe coding.

## When to Use This Skill

Use this skill when you need to build a presentation webpage (class demo, project showcase, portfolio, etc.) where each slide fills the entire screen and flips like PowerPoint.

## Prerequisites

1. Node.js installed (https://nodejs.org)
2. An AI coding tool (Claude Code, Codex CLI, or Google CLI)
3. Basic ability to type commands in a terminal

---

## Step 1: Create the Project

### Open Your Terminal

**Mac**: Press `Command + Space`, type `terminal`, press Enter
**Windows**: Press `Win + R`, type `cmd`, press Enter

### Run the Project Creation Command

Copy and paste this line into your terminal, then press Enter:

```bash
npx create-next-app@latest my-presentation --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

It will ask you a few questions. Just press Enter to accept the defaults for all of them.

### Enter the Project Folder

```bash
cd my-presentation
```

### Install Extra Dependencies

```bash
npm install clsx tailwind-merge
```

---

## Step 2: Ask AI to Generate the Base Structure

Open your AI tool and copy-paste this prompt:

---

**PROMPT START (copy from here)**

```
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
```

**PROMPT END (copy to here)**

---

### Put Code in the Right Files

The AI will generate multiple files. Place them according to this structure:

```
my-presentation/
├── app/
│   ├── page.tsx          ← Main page code goes here
│   ├── layout.tsx        ← Already exists, usually no change needed
│   └── globals.css       ← Add CSS here if AI tells you to
└── components/
    ├── Slide.tsx           ← AI-generated components go here
    ├── SlideContainer.tsx
    └── PageIndicator.tsx
```

If the `components` folder doesn't exist, create it:

```bash
mkdir components
```

---

## Step 3: Run and Preview

In your terminal, run:

```bash
npm run dev
```

When you see something like `Ready on http://localhost:3000`, open your browser and visit:

```
http://localhost:3000
```

Press `↓` or `Space` on your keyboard to flip through slides.

---

## Step 4: Find Styles on 21st.dev

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

```
A hero section with gradient background, floating particles, and glassmorphism cards
```

### Ask AI to Apply the Style

Go back to your AI conversation and copy-paste this prompt:

---

**PROMPT START (copy from here)**

```
I found a style I like. The description is:
[Paste the description you copied from 21st.dev]

Please apply this style to my presentation webpage with these requirements:
1. Keep the original 100vh single-screen slide structure
2. Keep the scroll-snap page-flipping behavior
3. Keep the keyboard navigation (arrow keys, spacebar)
4. Only modify visual styles (colors, backgrounds, fonts, spacing, animations, etc.)

Please generate the updated complete code.
```

**PROMPT END (copy to here)**

---

### Replace the Code

After AI generates the new code, overwrite the original files. Refresh your browser to see the changes.

---

## Step 5: Edit Your Content

### Change Text

Open `app/page.tsx` and edit the text directly. For example:

```tsx
// Original
title: "Project Title",

// Change to yours
title: "AI in Medical Diagnosis",
```

### Add a Slide

Copy a slide entry in the `slides` array in `page.tsx` and modify it:

```tsx
const slides = [
  // ... existing slides
  {
    id: 5,  // Make sure id increments
    title: "New Slide Title",
    content: <p>New slide content</p>,
    bgColor: "bg-blue-50",
  },
];
```

### Remove a Slide

Simply delete the corresponding entry from the `slides` array.

---

## Step 6: Deploy Online (Optional)

If you want to share your presentation with others, deploy it to Vercel (free):

### 1. Sign Up for Vercel

Visit https://vercel.com and log in with your GitHub account.

### 2. Install Vercel CLI

```bash
npm install -g vercel
```

### 3. Log In

```bash
vercel login
```

Follow the prompts to complete login.

### 4. Deploy

In your project folder, run:

```bash
vercel
```

Follow the prompts, accepting all defaults. After deployment, you'll get a URL like:

```
https://my-presentation-xxx.vercel.app
```

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
- **Tailwind CSS** = A tool for quickly writing styles using class names (like `bg-blue-500`, `text-center`)
- **Component** = A reusable piece of UI code, like a button or a card

---

## Tips

1. **Don't put too much content**: Keep text to 3-5 bullet points per slide, or it gets crowded
2. **Limit image height**: If adding images, tell AI "image max height 60% of screen"
3. **Get it running first, then pretty**: Use the base prompt to get the structure working, then find styles on 21st.dev
4. **Save your prompts**: Keep the final code AI generates, reuse it for future presentations
5. **Stop with Ctrl+C**: To stop `npm run dev`, press `Ctrl + C`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Terminal says `command not found` | Check if Node.js is installed, reinstall from https://nodejs.org |
| Page scrolls freely, no flip feeling | Check if scroll-snap-type is set to y mandatory |
| Content overflows screen | Tell AI "content is too much, simplify to fit one screen" |
| Styles not working | Check if Tailwind CSS is properly installed |
| Don't know which file to put code in | Ask AI "Which file should this code go in?" |
| Port already in use | Run `npm run dev -- --port 3001` to use a different port |
| Layout breaks after applying 21st.dev style | Tell AI "Keep the original 100vh structure, only change colors and decorations" |
