# 行程绘

一款运行在 macOS 上的明亮、自由风格 AI 旅行规划工具。输入目的地、日期与偏好后，应用会通过 DeepSeek 生成结构化行程，并直接展示交互地图、每日时间轴和出发提醒。

## 主要能力

- 启动时填写 DeepSeek API Key，仅在当前运行期间保存在内存中
- AI 生成逐日行程，可选择 `deepseek-chat` 或 `deepseek-reasoner`
- 地图、当天路线、停留时间与交通信息联动展示
- 自动核对景点名称与 OpenStreetMap 坐标，并修正旧行程定位
- 自动显示目的地当前天气
- 支持通过右侧 AI 助手用自然语言调整行程
- 订票与出发前提醒集中管理
- 行程保存在本机，不需要导出 HTML

## 本地开发

需要 Node.js 20+、Rust stable 与 macOS。

```bash
npm install
npm run tauri dev
```

前端检查：

```bash
npm run lint
npm run build
```

生成 macOS 应用与 DMG：

```bash
npm run tauri build
```

构建结果位于 `src-tauri/target/release/bundle/macos/` 和 `src-tauri/target/release/bundle/dmg/`。

## API Key 安全

应用不会把 API Key 写入网页存储、系统钥匙串或项目文件。密钥仅保存在当前运行的内存中，并在应用退出后清除。请使用你自己新建并可随时撤销的 Key。
