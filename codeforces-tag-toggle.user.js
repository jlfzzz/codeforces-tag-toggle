// ==UserScript==
// @name         Codeforces Tag Toggle (Improved)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Toggle visibility of problem tags on Codeforces (更稳定的版本)
// @match        https://codeforces.com/contest/*/problem/*
// @match        https://codeforces.com/problemset/problem/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let isInitialized = false;
  let button = null;
  let tagElements = [];
  let hidden = true;

  // 更灵活的标签容器查找
  function findTagElements() {
    const elements = [];

    // 方法1: 通过 sidebox 查找
    const sideboxes = document.querySelectorAll(".sidebox");
    for (const box of sideboxes) {
      const caption = box.querySelector(".caption.titled");
      if (caption && caption.textContent.includes("Problem tags")) {
        const tagSpans = box.querySelectorAll(".tag-box");
        tagSpans.forEach((span) => elements.push(span));
        break;
      }
    }

    // 方法2: 直接查找所有 tag-box (备用方案)
    if (elements.length === 0) {
      const allTagBoxes = document.querySelectorAll(".tag-box");
      allTagBoxes.forEach((span) => elements.push(span));
    }

    return elements;
  }

  // 获取标签的容器元素
  function getTagContainer(tagElement) {
    // 寻找合适的父元素来隐藏/显示
    let parent = tagElement.parentElement;

    // 如果父元素是 span 或其他内联元素，继续向上查找
    while (
      parent &&
      (parent.tagName === "SPAN" ||
        getComputedStyle(parent).display === "inline")
    ) {
      parent = parent.parentElement;
    }

    return parent || tagElement;
  }

  // 判断是否为难度标签
  function isDifficultyTag(tagText) {
    return tagText.trim().startsWith("*");
  }

  // 切换标签显示状态
  function toggleTags() {
    hidden = !hidden;

    tagElements.forEach((tagData) => {
      const { element, container, isDifficulty } = tagData;
      if (!isDifficulty) {
        container.style.display = hidden ? "none" : "";
      }
    });

    updateButtonAppearance();
  }

  // 更新按钮外观
  function updateButtonAppearance() {
    if (!button) return;

    if (hidden) {
      button.textContent = "🏷️ Show Tags";
      button.style.backgroundColor = "#28a745"; // 绿色表示可以显示
      button.title = "Click to show all problem tags";
    } else {
      button.textContent = "🚫 Hide Tags";
      button.style.backgroundColor = "#dc3545"; // 红色表示可以隐藏
      button.title = "Click to hide non-difficulty tags";
    }
  }

  // 创建切换按钮
  function createToggleButton() {
    if (button) return; // 避免重复创建

    button = document.createElement("button");

    Object.assign(button.style, {
      position: "fixed",
      top: "10px",
      right: "10px",
      zIndex: "9999",
      padding: "8px 16px",
      fontSize: "14px",
      cursor: "pointer",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: "500",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      transition: "all 0.2s ease",
      minWidth: "120px",
      textAlign: "center",
    });

    // 初始化按钮外观
    updateButtonAppearance();

    // 添加悬停和活跃状态效果
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-1px)";
      button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
      button.style.filter = "brightness(1.1)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
      button.style.filter = "none";
    });

    button.addEventListener("mousedown", () => {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)";
    });

    button.addEventListener("mouseup", () => {
      button.style.transform = "translateY(-1px)";
      button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
    });

    button.addEventListener("click", () => {
      // 添加点击动画效果
      button.style.transform = "scale(0.95)";
      setTimeout(() => {
        button.style.transform = "";
      }, 100);

      toggleTags();
    });

    document.body.appendChild(button);
  }

  // 初始化函数
  function initialize() {
    if (isInitialized) return;

    const tagSpans = findTagElements();
    if (tagSpans.length === 0) return; // 如果找不到标签，不初始化

    // 准备标签数据
    tagElements = tagSpans.map((span) => {
      const tagText = span.textContent || "";
      const isDifficulty = isDifficultyTag(tagText);
      const container = getTagContainer(span);

      return {
        element: span,
        container: container,
        isDifficulty: isDifficulty,
      };
    });

    // 默认隐藏非难度标签
    tagElements.forEach((tagData) => {
      const { container, isDifficulty } = tagData;
      if (!isDifficulty) {
        container.style.display = "none";
      }
    });

    createToggleButton();
    isInitialized = true;
    console.log("Codeforces Tag Toggle initialized successfully");
  }

  // 使用 MutationObserver 监听 DOM 变化（处理动态加载）
  function observeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // 检查是否有新的标签元素被添加
          const hasTagElements = Array.from(mutation.addedNodes).some(
            (node) => {
              return (
                node.nodeType === Node.ELEMENT_NODE &&
                node.querySelector &&
                node.querySelector(".tag-box")
              );
            }
          );

          if (hasTagElements && !isInitialized) {
            setTimeout(initialize, 100); // 稍微延迟以确保 DOM 完全加载
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 5秒后停止观察（避免无限监听）
    setTimeout(() => observer.disconnect(), 5000);
  }

  // 多种初始化时机
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  window.addEventListener("load", initialize);

  // 开始观察 DOM 变化
  observeChanges();

  // 备用初始化（延迟执行）
  setTimeout(initialize, 1000);
})();
