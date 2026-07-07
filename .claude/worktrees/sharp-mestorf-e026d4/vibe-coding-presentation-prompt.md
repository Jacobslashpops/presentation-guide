# Vibe Coding Presentation 教学 Prompt
# Vibe Coding Presentation Teaching Prompt

---

## 中文 Prompt

```
请帮我创建一个用于课堂/项目展示的 presentation 网页，使用 Next.js + React + TypeScript + Tailwind CSS 构建。

核心要求：
1. **单屏展示**：每一页内容必须恰好占满一屏（100vh），禁止出现需要滚动才能看完一页的情况。内容太多就精简或拆分页面。

2. **翻页阻尼效果**：使用 CSS scroll-snap + 自定义滚动逻辑实现类似 PPT 的翻页体验：
   - 用户滚动时，页面不是自由滚动，而是有明确的"翻页"感
   - 设置 scroll-snap-type: y mandatory 和 scroll-snap-align: start
   - 添加阻尼阈值：滚动距离不足 25% 时自动弹回原页，超过 25% 才翻到下一页
   - 使用 scroll-behavior: smooth 确保翻页动画平滑
   - 可选：添加键盘方向键（↑↓）和空格键翻页支持

3. **页面结构**：
   - 每个 section 是一个全屏页面（h-screen）
   - 页面之间用不同的背景色或视觉元素区分
   - 每页包含：标题、正文内容、配图/图表区域
   - 底部添加页码指示器（圆点或进度条）

4. **视觉设计**：
   - 配色专业简洁，适合学术/项目展示
   - 字体大小层级清晰，远处也能看清
   - 添加适当的入场动画（fade-in, slide-up），但不要过度花哨
   - 如果需要特定视觉风格，可以上传参考截图给 AI 作为设计参考

5. **响应式**：在投影仪/大屏幕比例（16:9）下表现最佳，同时兼容笔记本屏幕。

请生成完整的可运行代码，包括所有组件和样式文件。
```

---

## English Prompt

```
Please create a presentation webpage for classroom/project demos, built with Next.js + React + TypeScript + Tailwind CSS.

Core Requirements:
1. **One Screen Per Slide**: Each page must fit exactly within one viewport (100vh). No scrolling within a single slide. If content is too long, simplify or split into multiple slides.

2. **Snap Scrolling with Damping**: Implement a PowerPoint-like page-turning experience using CSS scroll-snap + custom scroll logic:
   - When the user scrolls, the page should not scroll freely but have a distinct "page flip" feel
   - Use scroll-snap-type: y mandatory and scroll-snap-align: start
   - Add a damping threshold: if scroll distance is less than 25%, snap back to the current slide; only flip to the next slide if scrolled past 25%
   - Use scroll-behavior: smooth for smooth page transition animations
   - Optional: Add keyboard navigation with arrow keys (↑↓) and spacebar

3. **Page Structure**:
   - Each section is a full-screen page (h-screen)
   - Use different background colors or visual elements to distinguish slides
   - Each slide contains: title, body content, image/chart area
   - Add a page indicator at the bottom (dots or progress bar)

4. **Visual Design**:
   - Professional and clean color scheme suitable for academic/project presentations
   - Clear font size hierarchy, readable from a distance
   - Add subtle entrance animations (fade-in, slide-up), but don't overdo it
   - For specific visual styles, upload reference screenshots to the AI as design guidance

5. **Responsive**: Optimized for projector/large screen ratios (16:9), while also compatible with laptop screens.

Please generate complete, runnable code including all components and style files.
```

---

## 进阶/可选要求 | Advanced/Optional Requirements

### 中文

```
可选增强功能（根据时间选择实现）：

1. **视差滚动效果**：在特定页面添加轻微的视差滚动，让背景和前景以不同速度移动，增加层次感。注意：只在故意设计的页面使用，不要影响主要的翻页阻尼体验。

2. **演讲者备注**：添加一个仅演讲者可见的备注区域（通过 URL 参数如 ?speaker 开启），显示当前页的演讲要点。

3. **自动播放**：添加自动翻页模式，每页停留 10 秒，循环播放。

4. **触摸支持**：在移动端/平板上支持滑动手势翻页。

5. **目录导航**：添加一个可展开的侧边栏目录，点击直接跳转到对应页面。
```

### English

```
Optional enhancements (implement based on time availability):

1. **Parallax Scrolling**: Add subtle parallax effects on specific slides, where background and foreground move at different speeds to create depth. Note: Only use on intentionally designed slides; don't interfere with the main snap-scrolling experience.

2. **Speaker Notes**: Add a speaker-only notes area (enabled via URL parameter like ?speaker) that displays talking points for the current slide.

3. **Auto-play**: Add an auto-advance mode that stays on each slide for 10 seconds and loops.

4. **Touch Support**: Support swipe gestures for page turning on mobile/tablet devices.

5. **Table of Contents**: Add an expandable sidebar navigation that allows jumping directly to any slide.
```

---

## 教学提示 | Teaching Tips

### 中文

```
教学建议：

1. **先演示后解释**：先让学生看到最终效果，再解释代码结构。

2. **关键概念解释**：
   - `100vh` = viewport height，浏览器可视区域的高度
   - `scroll-snap` = CSS 的滚动吸附，让滚动停止在特定位置
   - Tailwind CSS = 实用优先的 CSS 框架，通过类名快速构建样式

3. **常见错误预防**：
   - 提醒学生不要把内容写得太多，否则一屏放不下
   - 注意 scroll-snap 容器的高度设置必须正确
   - 图片要用 object-cover 或限制最大高度，避免撑破页面

4. **迭代开发顺序**：
   - 第1步：先做出静态的单页结构（标题+内容）
   - 第2步：复制成多页，加上 scroll-snap
   - 第3步：添加样式和动画
   - 第4步：添加交互（键盘、触摸）
```

### English

```
Teaching Tips:

1. **Demo First, Explain Later**: Let students see the final result before explaining the code structure.

2. **Key Concepts to Explain**:
   - `100vh` = viewport height, the visible area of the browser
   - `scroll-snap` = CSS scroll snapping, makes scrolling stop at specific positions
   - Tailwind CSS = utility-first CSS framework for rapid styling via class names

3. **Common Mistakes to Prevent**:
   - Remind students not to write too much content, or it won't fit on one screen
   - Ensure the scroll-snap container height is set correctly
   - Use object-cover or limit max-height for images to prevent overflow

4. **Iterative Development Order**:
   - Step 1: Create a static single-page structure (title + content)
   - Step 2: Duplicate into multiple pages, add scroll-snap
   - Step 3: Add styling and animations
   - Step 4: Add interactions (keyboard, touch)
```

---

## 参考实现代码结构 | Reference Implementation Structure

```
app/
├── page.tsx              # 主页面，包含所有 slide 的容器
├── layout.tsx            # 根布局
├── globals.css           # 全局样式（scroll-snap 配置）
└── components/
    ├── Slide.tsx           # 单页幻灯片组件（100vh 容器）
    ├── SlideContainer.tsx  # 所有 slide 的滚动容器
    ├── PageIndicator.tsx   # 底部页码指示器
    ├── TitleSlide.tsx      # 标题页模板
    ├── ContentSlide.tsx    # 内容页模板
    └── SpeakerNotes.tsx    # 演讲者备注（可选）
```

---

## 核心 CSS 片段 | Core CSS Snippet

```css
/* globals.css */
.snap-container {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.slide {
  height: 100vh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
```

---

## 核心组件代码 | Core Component Code

```tsx
// components/SlideContainer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Slide } from "./Slide";
import { PageIndicator } from "./PageIndicator";

interface SlideData {
  id: number;
  title: string;
  content: React.ReactNode;
  bgColor?: string;
}

interface SlideContainerProps {
  slides: SlideData[];
}

export function SlideContainer({ slides }: SlideContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const slideHeight = window.innerHeight;
      const newSlide = Math.round(scrollTop / slideHeight);
      setCurrentSlide(newSlide);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // 键盘导航 | Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const slideHeight = window.innerHeight;

      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        container.scrollBy({ top: slideHeight, behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
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
        {slides.map((slide, index) => (
          <Slide
            key={slide.id}
            title={slide.title}
            bgColor={slide.bgColor}
            isActive={currentSlide === index}
          >
            {slide.content}
          </Slide>
        ))}
      </div>
      <PageIndicator
        total={slides.length}
        current={currentSlide}
        onSelect={goToSlide}
      />
    </>
  );
}
```

```tsx
// components/Slide.tsx
"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SlideProps {
  title: string;
  children: React.ReactNode;
  bgColor?: string;
  isActive?: boolean;
}

export function Slide({ title, children, bgColor = "bg-white", isActive }: SlideProps) {
  return (
    <section
      className={cn(
        "h-screen w-full flex flex-col items-center justify-center px-8 md:px-16 lg:px-24",
        "snap-start snap-always",
        bgColor
      )}
    >
      <div className={cn(
        "max-w-4xl w-full transition-all duration-700",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-center">
          {title}
        </h1>
        <div className="text-lg md:text-xl leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}
```

```tsx
// components/PageIndicator.tsx
"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PageIndicatorProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

export function PageIndicator({ total, current, onSelect }: PageIndicatorProps) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={cn(
            "w-3 h-3 rounded-full transition-all duration-300",
            index === current
              ? "bg-blue-600 scale-125"
              : "bg-gray-300 hover:bg-gray-400"
          )}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
```

```tsx
// app/page.tsx
import { SlideContainer } from "@/app/components/SlideContainer";

const slides = [
  {
    id: 1,
    title: "项目标题",
    content: (
      <div className="text-center">
        <p className="text-2xl text-gray-600 mb-4">副标题描述</p>
        <p className="text-gray-500">演讲者姓名 | 日期</p>
      </div>
    ),
    bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
  },
  {
    id: 2,
    title: "研究背景",
    content: (
      <ul className="space-y-4 list-disc list-inside">
        <li>背景要点一</li>
        <li>背景要点二</li>
        <li>背景要点三</li>
      </ul>
    ),
    bgColor: "bg-white",
  },
  {
    id: 3,
    title: "核心发现",
    content: (
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-gray-50 rounded-lg">发现一</div>
        <div className="p-6 bg-gray-50 rounded-lg">发现二</div>
      </div>
    ),
    bgColor: "bg-gray-50",
  },
  {
    id: 4,
    title: "总结与展望",
    content: <p>总结内容...</p>,
    bgColor: "bg-gradient-to-br from-indigo-100 to-blue-50",
  },
];

export default function Home() {
  return <SlideContainer slides={slides} />;
}
```

---

## 使用说明 | Usage Instructions

### 中文

1. 确保已安装 Claude Code 或 Codex CLI
2. 创建新的 Next.js 项目：`npx create-next-app@latest my-presentation`
3. 将上述 prompt 粘贴给 AI
4. 将生成的代码复制到对应文件中
5. 运行 `npm run dev` 预览效果

### English

1. Ensure Claude Code or Codex CLI is installed
2. Create a new Next.js project: `npx create-next-app@latest my-presentation`
3. Paste the prompt above to your AI
4. Copy the generated code into the corresponding files
5. Run `npm run dev` to preview
