#!/usr/bin/env bash
# 构建 SDK 包：src/index.ts → dist/index.js（esbuild bundle）+ dist/index.d.ts（tsc 声明）。
# 独立仓库：devDependencies（esbuild / typescript）在仓库内 npm install。
# 用法：bash build.sh（或 npm run build）
set -euo pipefail
cd "$(dirname "$0")"

ESBUILD="$(pwd)/node_modules/.bin/esbuild"
TSC="$(pwd)/node_modules/.bin/tsc"

if [[ ! -x "$ESBUILD" ]]; then
  echo "找不到 ${ESBUILD}，请先 npm install" >&2
  exit 1
fi
if [[ ! -x "$TSC" ]]; then
  echo "找不到 ${TSC}，请先 npm install" >&2
  exit 1
fi

mkdir -p dist

# 运行时代码：definePlugin / validateManifest 零依赖；共享运行时段
# （runtime/）按需 import react / react-dom / i18next / react-i18next ——
# 消费方（插件 bundle 经 CLI alias 到 shims / 安装根 node_modules，宿主
# app 自带这些包）都已提供，dist 产物一律 external，不打进包。
"$ESBUILD" src/index.ts \
  --bundle \
  --format=esm \
  --outfile=dist/index.js \
  --external:react \
  --external:react-dom \
  --external:lucide-react \
  --external:i18next \
  --external:react-i18next

# 声明文件：所有导出类型 + 函数签名。
# （tsconfig.json 是 noEmit 的 typecheck 配置，此处用 CLI 参数覆盖以产出 d.ts。）
"$TSC" src/index.ts \
  --outDir dist \
  --declaration \
  --emitDeclarationOnly \
  --module esnext \
  --moduleResolution bundler \
  --target es2022 \
  --jsx react-jsx \
  --strict \
  --skipLibCheck \
  --isolatedModules

echo "已生成 dist/index.js + dist/index.d.ts"
