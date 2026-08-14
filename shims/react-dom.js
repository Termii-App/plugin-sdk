// ReactDOM（react-dom 入口）由宿主共享（window.__termii.shared.ReactDOM），
// 插件打包时通过 --alias:react-dom=./shims/react-dom.js 指向本文件。
//
// 目前只转发 createPortal —— SDK 的 ModalFooter（runtime/ModalFooter.tsx）
// 与 docker 插件的 ContextMenu 副本需要把内容 portal 进
// .dlg-footer / document.body；React 18 的 createPortal 是纯元素构造
// （$$typeof = Symbol.for("react.portal")，Symbol.for 全局唯一），
// 宿主 renderer 能直接消化插件侧构造的 portal 元素，无需重复打包 react-dom。
//
// 只转发，不新造：下面是宿主实例已有的 API 子集，插件只应消费宿主实例
// 已有的能力。宿主外的环境（如构建产物加载验证的 Node）没有
// window.__termii —— 回退到真实 react-dom 包：经 process.getBuiltinModule
// （Node ≥ 22.3）拿 createRequire 同步解析 node_modules 里的 react-dom。
// 浏览器里 window.__termii 恒存在，回退分支不会执行；esbuild 无法
// 静态解析 process.getBuiltinModule，因此不会把 react-dom 打进 bundle。
const shared =
  typeof window !== "undefined" && window.__termii
    ? window.__termii.shared
    : undefined;

function nodeReactDomFallback() {
  // Node 环境：createRequire 以 bundle 自身位置为基准解析 node_modules。
  const getBuiltin =
    typeof process !== "undefined" && process.getBuiltinModule;
  if (typeof getBuiltin !== "function") return undefined;
  try {
    const { createRequire } = getBuiltin("module");
    return createRequire(import.meta.url)("react-dom");
  } catch {
    return undefined;
  }
}

const ReactDOM = shared?.ReactDOM ?? nodeReactDomFallback() ?? {};

export default ReactDOM;
export const createPortal = ReactDOM.createPortal;
