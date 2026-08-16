# @termii/plugin-sdk

Termii 插件系统 SDK（独立仓库，**不发 npm**，经 git 依赖安装）。给插件作者提供：

- 宿主 API 类型面（`PluginContext` / `PluginManifest` / 各 Contribution / 隧道与片段类型）
- `definePlugin()` —— 原样返回插件对象，提供类型收窄与文档锚点
- `validateManifest()` —— 清单校验（手写，**零依赖**，不引入 zod 等）
- 共享运行时（v2.2，官方插件原各自拷贝的公共层收编于此）：
  - `setHostApi()` / `getHostCtx()` —— 宿主句柄单例（activate 时注入，插件各层共享；随每个 bundle 各带一份，作用域即本插件）
  - `initPluginI18n()` / `followHostLanguage()` —— 插件自身 i18next 实例的初始化与宿主语言跟随（实例打进插件 bundle，与宿主 i18next 互不可见）
  - `uid()` / `fuzzyMatch()` / `extractSnippetVariables()` / `interpolateSnippet()` —— 与宿主同源的公共纯函数
  - `<ModalFooter>` —— 弹窗 footer 槽组件：优先消费宿主 `window.__termii.shared.ModalFooterContext`（新宿主，语义与宿主组件一致），老宿主未暴露时回退 DOM 探测（`dlg-*` 骨架契约）
- `termii-plugin-sdk` —— esbuild 打包脚手架（单文件 ESM 产物，共享宿主 React / lucide）

## 安装

插件项目内安装（git 依赖；`prepare` 会自动构建 `dist/`，`dist` 也已提交进仓库双保险）：

```bash
npm i -D github:Termii-App/plugin-sdk
```

本仓库内开发 / 验证：

```bash
npm install        # devDependencies：typescript / esbuild / react / lucide-react
npm run typecheck  # tsc --noEmit（src/）
npm run build      # 生成 dist/index.js + dist/index.d.ts
```

插件代码里引用：

```ts
import { definePlugin, validateManifest, type PluginContext } from "@termii/plugin-sdk";
```

## 类型同步（宿主私有，维护者须知）

`src/host-types.ts` **自动生成，勿手改**：Termii 主仓库 push main 时
sync-sdk-types CD 运行 `scripts/gen-sdk-types.mjs`，从宿主
`src/lib/plugins/types.ts` + `src/lib/types.ts` 生成并推送到本仓库。
宿主类型变更无需在本仓库手工跟进。

## 在插件里用

```ts
import { definePlugin, type PluginContext } from "@termii/plugin-sdk";

export default definePlugin({
  manifest: {
    id: "my-plugin",
    name: "My Plugin",
    version: "0.1.0",
    apiVersion: 3, // 缺省按 1 处理；> 宿主支持版本会被 loader 拒绝
  },
  activate(ctx: PluginContext) {
    // …注册贡献点、订阅事件……
  },
});
```

校验 manifest（例如加载前 / 安装时）：

```ts
import { validateManifest } from "@termii/plugin-sdk";

const result = validateManifest(raw);
if (result.ok) {
  // result.manifest：规范化后的清单，apiVersion 缺省已按 1 填入
} else {
  console.error(result.errors.join("\n")); // 中文错误，逐条收集
}
```

打包（单文件 ES module，共享宿主 React / lucide）：

```bash
npx termii-plugin-sdk build src/main.jsx --outfile main.js --minify
```

共享运行时的典型用法（i18n 初始化 + activate 注入 + 语言跟随）：

```ts
import {
  definePlugin,
  setHostApi,
  initPluginI18n,
  followHostLanguage,
  ModalFooter,
} from "@termii/plugin-sdk";
import enUS from "./i18n/en-US.json";
import zhCN from "./i18n/zh-CN.json";

const i18n = initPluginI18n({
  resources: { "en-US": enUS, "zh-CN": zhCN },
  ns: ["views", "common"],
});

export default definePlugin({
  manifest: { /* … */ },
  activate(ctx) {
    setHostApi(ctx);
    const unsubscribeLng = followHostLanguage(ctx, i18n);
    // ……
  },
});
```

（SDK 主入口当前会一并引用共享 i18n 运行时，因此插件项目构建前需要
安装 `i18next` + `react-i18next` 供 CLI 解析——即使插件不使用
`initPluginI18n` 等帮手也要装上，依赖会被打进 bundle。模板项目已在
`package.json` 内置。）

- 默认把 `react` / `react/jsx-runtime` / `lucide-react` alias 到本包 `shims/`
  （运行时从 `window.__termii.shared` 取宿主共享实例）；
- 默认还把 `@termii/plugin-sdk` alias 到本包 `src/index.ts`（definePlugin /
  validateManifest / 宿主 API 类型直接随插件 bundle，无需插件自建本地链接）；
  传入 `--external @termii/plugin-sdk` 可改回 external；
- 传入 `--external react --external lucide-react` 则共享包改回 external；
- 更多选项见 `--help`。

## validateManifest 校验规则摘要

| 字段 | 规则 |
| --- | --- |
| `id` | 必填，匹配 `/^[a-z0-9-]+$/`，1..64 字符 |
| `name` / `version` | 必填非空字符串 |
| `apiVersion` | 可选 number；缺省按 1 处理并写入返回的 manifest |
| `sidecar` | 可选；`binaries` 非空对象、键形如 `<os>-<arch>`（如 `darwin-aarch64`）、值为非空字符串；`args` 可选，须为 `string[]` |
| `contributes` | 可选，浅校验：`views` / `commands` / `settingsSections` / `themes` / `trayItems` 为对象数组（元素字段由宿主 loader 校验） |

错误信息为中文，逐条收集；`ok: false` 时返回 `errors: string[]`。

## 目录结构

```
plugin-sdk/
├── package.json          # 包描述；scripts.typecheck / build / prepare；bin.termii-plugin-sdk
├── tsconfig.json         # 独立 typecheck（noEmit，include src）
├── build.sh              # 生成 dist/index.js（esbuild）+ dist/index.d.ts（tsc）
├── README.md
├── bin/termii-plugin-sdk.mjs   # 打包脚手架 CLI（esbuild JS API）
├── shims/                # react / react-jsx-runtime / lucide-react 宿主共享 shim
├── dist/                 # 构建产物（提交进仓库，git 安装即用）
├── src/
│   ├── index.ts          # 装配：类型 re-export + definePlugin / validateManifest
│   ├── host-types.ts     # 宿主 API 类型面（自动生成，勿手改）
│   └── runtime/          # 共享运行时（host-ctx / i18n / utils / snippet-vars / ModalFooter）
```

## 宿主 API 契约

插件完整可用的 Host API（`ctx.*`）与分发 / 信任模型见
[Termii 插件开发指南](https://termii.meowdream.cn/docs)。
