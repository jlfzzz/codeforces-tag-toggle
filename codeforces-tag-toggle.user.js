// ==UserScript==
// @name         Codeforces Tag Toggle (Improved)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Toggle visibility of problem tags on Codeforces 
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

  function findTagElements() {
    const elements = [];

    const sideboxes = document.querySelectorAll(".sidebox");
    for (const box of sideboxes) {
      const caption = box.querySelector(".caption.titled");
      if (caption && caption.textContent.includes("Problem tags")) {
        const tagSpans = box.querySelectorAll(".tag-box");
        tagSpans.forEach((span) => elements.push(span));
        break;
      }
    }

    if (elements.length === 0) {
      const allTagBoxes = document.querySelectorAll(".tag-box");
      allTagBoxes.forEach((span) => elements.push(span));
    }

    return elements;
  }
  
  function getTagContainer(tagElement) {
    let parent = tagElement.parentElement;

    while (
      parent &&
      (parent.tagName === "SPAN" ||
        getComputedStyle(parent).display === "inline")
    ) {
      parent = parent.parentElement;
    }

    return parent || tagElement;
  }

  function isDifficultyTag(tagText) {
    return tagText.trim().startsWith("*");
  }

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

  function createToggleButton() {
    if (button) return;

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

    updateButtonAppearance();

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
      button.style.transform = "scale(0.95)";
      setTimeout(() => {
        button.style.transform = "";
      }, 100);

      toggleTags();
    });

    document.body.appendChild(button);
  }

  function initialize() {
    if (isInitialized) return;

    const tagSpans = findTagElements();
    if (tagSpans.length === 0) return;

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

  function observeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
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

    setTimeout(() => observer.disconnect(), 5000);
  }

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
