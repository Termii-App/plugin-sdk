// React 运行时由宿主共享（window.__termii.shared.React），
// 插件打包时通过 --alias:react=./shims/react.js 指向本文件，
// 不各自打包一份 React。构建见 termii-plugin-sdk CLI（--help）。
//
// 只转发，不新造：下面是 React 18 的完整常用转发面，插件只应消费
// 宿主实例已有的 API。宿主外的环境（如构建产物加载验证的 Node）没有
// window.__termii —— 回退到真实 react 包：经 process.getBuiltinModule
// （Node ≥ 22.3）拿 createRequire 同步解析 node_modules 里的 react。
// 浏览器里 window.__termii 恒存在，回退分支不会执行；esbuild 无法
// 静态解析 process.getBuiltinModule，因此不会把 React 打进 bundle。
const shared =
  typeof window !== "undefined" && window.__termii
    ? window.__termii.shared
    : undefined;

function nodeReactFallback() {
  // Node 环境：createRequire 以 bundle 自身位置为基准解析 node_modules。
  const getBuiltin =
    typeof process !== "undefined" && process.getBuiltinModule;
  if (typeof getBuiltin !== "function") return undefined;
  try {
    const { createRequire } = getBuiltin("module");
    return createRequire(import.meta.url)("react");
  } catch {
    return undefined;
  }
}

const React = shared?.React ?? nodeReactFallback() ?? {};

export default React;
export const Children = React.Children;
export const Fragment = React.Fragment;
export const StrictMode = React.StrictMode;
export const Suspense = React.Suspense;
export const createElement = React.createElement;
export const createRef = React.createRef;
export const cloneElement = React.cloneElement;
export const isValidElement = React.isValidElement;
export const forwardRef = React.forwardRef;
export const memo = React.memo;
export const lazy = React.lazy;
export const useCallback = React.useCallback;
export const useContext = React.useContext;
export const useDeferredValue = React.useDeferredValue;
export const useEffect = React.useEffect;
export const useId = React.useId;
export const useImperativeHandle = React.useImperativeHandle;
export const useLayoutEffect = React.useLayoutEffect;
export const useMemo = React.useMemo;
export const useReducer = React.useReducer;
export const useRef = React.useRef;
export const useState = React.useState;
export const useSyncExternalStore = React.useSyncExternalStore;
export const useTransition = React.useTransition;
export const createContext = React.createContext;
