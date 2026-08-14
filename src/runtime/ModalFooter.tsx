// 模态框底部按钮槽（footer portal）——插件侧可用的 ModalFooter。
//
// 把按钮行渲染进宿主 ModalHost 弹窗骨架的 .dlg-footer 容器（body 滚动
// 时按钮固定贴底，与宿主弹窗视觉一致）。取容器优先级：
//  1. window.__termii.shared.ModalFooterContext —— 宿主把 footer 槽的
//     context 对象挂到 shared（React context 按对象身份匹配，插件
//     bundle 自建 context 永远取不到宿主 Provider，必须由宿主提供同一
//     对象）。新宿主走此路径，语义与宿主组件完全一致（弹窗外用 → null）。
//  2. DOM 探测回退（老宿主未暴露 context 对象）：ctx.ui.modal.openForm
//     是顶层入口清空弹窗栈，本弹窗恒为栈顶，取最后一个 .dlg-mask 内的
//     .dlg-footer；dlg-* 类名是宿主全局样式契约。
//
// 使用前提：调用方 openForm({ footer: null, body: ... })，ModalHost 会
// 渲染一个空的 .dlg-footer 容器等待 portal 填充。
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Context,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/** 老宿主 / 非浏览器环境下的占位 context：useContext 需要合法对象，恒得 null。 */
const noopContext = createContext<HTMLElement | null>(null);

type SharedGlobals = {
  __termii?: { shared?: { ModalFooterContext?: Context<HTMLElement | null> } };
};

// 模块加载时解析一次：宿主在插件 import 之前就把 shared 就位（先设
// window.__termii 再加载插件 bundle），此后不变。
const sharedContext: Context<HTMLElement | null> | null =
  typeof window === "undefined"
    ? null
    : ((window as unknown as SharedGlobals).__termii?.shared
        ?.ModalFooterContext ?? null);

export function ModalFooter({ children }: { children: ReactNode }) {
  // 新宿主（有 shared context）：严格 context 语义。
  // 老宿主（无）：useContext 走占位 context（恒 null），DOM 探测兜底。
  const fromContext = useContext(sharedContext ?? noopContext);
  const [probed, setProbed] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (sharedContext) return;
    // 弹窗骨架随 ModalHost 同一次提交渲染，effect 阶段 .dlg-footer 已就位；
    // openForm 清空弹窗栈，栈顶即最后一个 .dlg-mask。
    const masks = document.querySelectorAll(".dlg-mask");
    const mask = masks.length > 0 ? masks[masks.length - 1] : null;
    setProbed((mask?.querySelector(".dlg-footer") as HTMLElement | null) ?? null);
  }, []);

  const host = sharedContext ? fromContext : probed;
  if (!host) return null;
  return createPortal(children, host);
}
