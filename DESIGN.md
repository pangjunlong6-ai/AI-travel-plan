---
name: 行程绘
description: 明亮、自由、可持续编辑的 AI 旅行工作台
colors:
  daylight: "oklch(1 0 0)"
  sky-surface: "oklch(0.978 0.012 235)"
  sky-wash: "oklch(0.94 0.035 235)"
  ocean-blue: "oklch(0.61 0.22 255)"
  route-cyan: "oklch(0.74 0.15 190)"
  sunset-coral: "oklch(0.69 0.20 30)"
  sun-yellow: "oklch(0.83 0.16 85)"
  ink-navy: "oklch(0.25 0.06 255)"
  muted-blue: "oklch(0.53 0.045 245)"
  border-blue: "oklch(0.89 0.025 240)"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ocean-blue}"
    textColor: "{colors.daylight}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.daylight}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: 行程绘

## Overview

**Creative North Star: “晴空航线”**

界面像一张在晴朗自然光下展开的现代航图：白色留出呼吸，天空蓝负责结构，海水青绘制行动路径，珊瑚色只在目的地和提醒出现。它吸收 React Bits 与 Aceternity UI 的运动质量，但保持桌面工具所需的稳定与熟悉。

布局采用 Mac 工作台密度：固定侧栏、宽阔主区域和上下文面板。状态变化有清楚反馈，内容在动画不存在时仍完整可用。

**Key Characteristics:**

- 明亮的冷白表面与高可读深蓝文字
- 地图等高线、虚线路径和航点作为视觉母题
- 中等强度、解释状态的微动效
- 克制的悬浮工具与一像素边界

## Colors

以日光白为主体，蓝与青承担操作和路线，珊瑚与黄色只用于高价值提醒。

**The Route Rule.** 海水青只表示路线、进行中和焦点；它不是装饰色。

**The Destination Rule.** 珊瑚色只出现于目的地、截止提醒和需要用户确认的变化。

## Typography

**Display Font:** macOS system sans with PingFang SC fallback
**Body Font:** macOS system sans with PingFang SC fallback

**Character:** 中文界面采用一套精调的人文无衬线字体，日期和时间启用等宽数字。标题通过字重和留白建立层级，不依赖夸张字号。

**The Quiet Type Rule.** 产品标签不使用展示字体，不用全大写字距制造“高级感”。

## Elevation

系统默认扁平，通过相邻表面的明度差和完整一像素边框建立层级。阴影只属于悬浮工具、弹层与拖拽中的项目；普通内容区不使用阴影。

**The Lift-on-Action Rule.** 静止内容保持平面，仅在悬浮、拖拽或弹出时获得高度。

## Components

### Buttons

- 主按钮使用海洋蓝实色、白字和 14px 圆角。
- Hover 提升亮度，Focus 使用海水青外环，Active 轻微下压。
- 图标按钮拥有至少 40×40px 点击区域。

### Inputs / Fields

- 白色表面、完整浅蓝边界，聚焦时边界切换为海水青。
- 错误文案同时使用图标、文字和珊瑚色，不能只靠颜色。

### Cards / Containers

- 只有独立、可操作的对象才使用容器。
- 时间轴内部使用节奏、分隔线和路径连接，不嵌套卡片。

### Navigation

- 当前行程以淡天蓝底和深蓝文字表示。
- 侧栏保持稳定，不用 hover 自动扩张影响主区域。

### Route Timeline

- 时间块由细线和航点连接，选中项出现海水青焦点环。
- 需要预订的节点用珊瑚图标和明确截止文字标记。

## Do's and Don'ts

### Do:

- **Do** 让地图和时间轴拥有最大的视觉面积。
- **Do** 用动效解释生成、应用修改、路线推进和拖拽位置。
- **Do** 在 1100px 以下折叠 AI 面板，保留核心编辑功能。
- **Do** 为所有动画提供减少动态效果版本。

### Don't:

- **Don't** 做“暗黑赛博、霓虹控制台或紫色渐变 AI 工具”。
- **Don't** 做“米色手账、牛皮纸和复古旅行日记”。
- **Don't** 把 React Bits、Aceternity UI、Uiverse 的效果拼成组件陈列柜。
- **Don't** 使用玻璃拟态作为默认材质、渐变文字或侧边彩色粗边框。
- **Don't** 用同尺寸卡片网格代替清晰的信息结构。
