#!/usr/bin/env node
// termii-plugin-sdk —— esbuild 打包脚手架（等价于 templates/plugin-hello/build.sh 的封装）。
//
// 默认把 react / react/jsx-runtime / react-dom / lucide-react alias 到
// sdk/shims/（运行时从 window.__termii.shared 取宿主共享实例），并把
// @termii/plugin-sdk alias 到 sdk/src/index.ts（definePlugin / validateManifest /
// 类型无需再建本地链接）；对某个包传入 --external 则改为 external（不打包、不 alias）。
// esbuild 定位：优先仓库根 node_modules，回退 require.resolve。
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 共享包的 alias → shims 文件名。 */
const SHIM_ALIASES = {
  react: "react.js",
  "react/jsx-runtime": "react-jsx-runtime.js",
  "react-dom": "react-dom.js",
  "lucide-react": "lucide-react.js",
};

/** SDK 包名 → 源码入口（独立可编译，不 import 仓库 src/）。 */
const SDK_PACKAGE = "@termii/plugin-sdk";
const SDK_ENTRY = path.join(__dirname, "..", "src", "index.ts");

function die(message) {
  console.error(`termii-plugin-sdk: ${message}`);
  process.exit(1);
}

function loadEsbuild() {
  try {
    return require(path.join(__dirname, "../../node_modules/esbuild"));
  } catch {
    try {
      return require("esbuild");
    } catch {
      die("找不到 esbuild：请在仓库根目录（或安装本 SDK 的项目根）npm install。");
    }
  }
}

function printHelp() {
  console.log(`termii-plugin-sdk —— Termii 插件打包脚手架

用法:
  node sdk/bin/termii-plugin-sdk.mjs build <entry> --outfile <out> [选项]

选项:
  --outfile <path>   产物文件路径（单文件 ES module）
  --minify           压缩产物
  --external <name>  将包 external 化（不打包、不 alias 到 shim；可重复）
  --help             显示本帮助

默认行为（等价于 templates/plugin-hello/build.sh）:
  - bundle + format=esm；.js 文件按 JSX 解析（--loader:.js=jsx）
  - react / react/jsx-runtime / react-dom / lucide-react 会 alias 到 SDK 的 shims/
    （运行时从 window.__termii.shared 取宿主共享实例）
  - @termii/plugin-sdk 会 alias 到 sdk/src/index.ts
    （definePlugin / validateManifest / 宿主 API 类型，无需插件自建本地链接）
  - 对某个包传入对应的 --external（如 --external react）则改为 external

示例:
  node sdk/bin/termii-plugin-sdk.mjs build src/main.jsx \\
    --outfile main.js --minify --external react --external lucide-react
`);
}

function parseArgs(argv) {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") {
    printHelp();
    process.exit(0);
  }
  if (argv[0] !== "build") {
    die(`未知命令 "${argv[0]}"，用法见 --help`);
  }

  const options = { minify: false, externals: [], outfile: null, entry: null };
  const rest = argv.slice(1);
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--minify") {
      options.minify = true;
    } else if (arg === "--outfile" || arg === "--external") {
      const value = rest[++i];
      if (value === undefined) die(`${arg} 需要一个参数`);
      if (arg === "--outfile") options.outfile = value;
      else options.externals.push(value);
    } else if (arg.startsWith("--outfile=")) {
      options.outfile = arg.slice("--outfile=".length);
    } else if (arg.startsWith("--external=")) {
      options.externals.push(arg.slice("--external=".length));
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("-") && arg !== "-") {
      die(`未知选项 "${arg}"，用法见 --help`);
    } else {
      if (options.entry !== null) die(`多余的入口参数 "${arg}"，一次只打一个入口`);
      options.entry = arg;
    }
  }

  if (!options.entry) die("缺少入口文件，用法见 --help");
  if (!options.outfile) die("缺少 --outfile，用法见 --help");
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const esbuild = loadEsbuild();
  const shimDir = path.join(__dirname, "..", "shims");

  // 共享包：默认 alias 到 shim；用户显式 --external 时改为 external。
  const alias = {};
  const externals = [];
  for (const [name, shimFile] of Object.entries(SHIM_ALIASES)) {
    if (options.externals.includes(name)) {
      externals.push(name);
    } else {
      alias[name] = path.join(shimDir, shimFile);
    }
  }
  // @termii/plugin-sdk：默认 alias 到 SDK 源码（definePlugin / validateManifest /
  // 类型都是运行时/编译期产物，bundle 一并打进插件）；--external @termii/plugin-sdk
  // 可改回 external（与共享包同理，向后兼容）。
  if (options.externals.includes(SDK_PACKAGE)) {
    externals.push(SDK_PACKAGE);
  } else {
    alias[SDK_PACKAGE] = SDK_ENTRY;
  }
  // 其余 --external 一律照传（插件可能想 external 其他依赖）。
  for (const name of options.externals) {
    if (!externals.includes(name)) externals.push(name);
  }

  await esbuild.build({
    entryPoints: [options.entry],
    bundle: true,
    format: "esm",
    outfile: options.outfile,
    loader: { ".js": "jsx" }, // 与 build.sh 一致：.js 按 JSX 解析
    jsx: "automatic", // 显式指定，避免依赖 esbuild 版本默认值；jsx-runtime import 走 shim
    alias,
    external: externals.length > 0 ? externals : undefined,
    minify: options.minify,
    logLevel: "info",
  });
  console.log(`已生成 ${options.outfile}。安装：设置 → 插件 → 从磁盘安装，选择插件目录。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
