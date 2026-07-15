/* ============================================================
   data-loader.js — JSON 数据加载器 + 统一路径解析
   通过脚本自身 URL 计算项目根目录，兼容：
   1. 本地静态服务器
   2. GitHub Pages 项目子目录
   3. 自定义域名
   4. index.html 和 pages/*.html
   ============================================================ */

const DataLoader = (() => {
  'use strict';

  /* === 计算项目根路径 === */
  let _root = null;
  let _dataBase = null;

  function computeRoot() {
    if (_root !== null) return _root;

    // 优先通过 data-loader.js 自己的 <script> 标签获取
    let scriptUrl = null;
    if (document.currentScript && document.currentScript.src) {
      scriptUrl = document.currentScript.src;
    } else {
      // 回退：查找最后一个 data-loader.js 的 script 标签
      const scripts = document.getElementsByTagName('script');
      for (let i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf('data-loader.js') !== -1) {
          scriptUrl = scripts[i].src;
          break;
        }
      }
    }

    if (scriptUrl) {
      // scriptUrl = "http://localhost:8080/js/data-loader.js" 或 "/repo/js/data-loader.js"
      const scriptPath = new URL(scriptUrl, window.location.href);
      // 项目根 = 往上两级（js/data-loader.js → js/ → 根/）
      _root = new URL('..', new URL('.', scriptPath)).href;
      // 确保以 / 结尾
      if (!_root.endsWith('/')) _root += '/';
    } else {
      // 最终回退：从 location.pathname 推断
      _root = window.location.pathname.replace(/\/[^/]*$/, '/');
    }

    _dataBase = _root + 'data/';
    return _root;
  }

  /* === URL 解析 === */
  function resolve(relativePath) {
    computeRoot();
    // 去掉开头的 ./ 或 /
    const clean = relativePath.replace(/^\.?\//, '');
    return _root + clean;
  }

  /* === 数据加载 === */
  const cache = new Map();

  async function load(name) {
    computeRoot();
    if (cache.has(name)) return cache.get(name);

    const url = _dataBase + name + '.json';
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();
      cache.set(name, data);
      return data;
    } catch (err) {
      console.error(`[DataLoader] 加载 ${name}.json 失败 (${url}):`, err);
      return null;
    }
  }

  function clear(name) {
    if (name) cache.delete(name);
    else cache.clear();
  }

  function has(name) { return cache.has(name); }

  // 便捷方法
  async function getSite() { return load('site'); }
  async function getCampuses() { return load('campuses'); }
  async function getMajors() { return load('majors'); }
  async function getArticles() { return load('articles'); }
  async function getCategories() { return load('categories'); }
  async function getFaq() { return load('faq'); }
  async function getTimeline() { return load('timeline'); }
  async function getChecklist() { return load('checklist'); }
  async function getPlaces() { return load('places'); }
  async function getUpdates() { return load('updates'); }

  computeRoot();

  return {
    resolve,
    get root() { computeRoot(); return _root; },
    load, clear, has,
    getSite, getCampuses, getMajors, getArticles, getCategories,
    getFaq, getTimeline, getChecklist, getPlaces, getUpdates
  };
})();
