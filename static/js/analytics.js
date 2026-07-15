/* ============================================================
   analytics.js — 来源追踪与简单统计
   不收集敏感个人信息，仅记录访问来源和页面路径
   ============================================================ */

const Analytics = (() => {
  'use strict';

  const STORAGE_KEY = 'cqytu_visit_log';

  /**
   * 记录页面访问
   */
  function trackPageView() {
    const source = sessionStorage.getItem('visit_source') || 'direct';
    const campaign = sessionStorage.getItem('visit_campaign') || '';
    const path = window.location.pathname;

    const entry = {
      path,
      source,
      campaign,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || ''
    };

    // 存入sessionStorage供调试
    try {
      const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
      existing.push(entry);
      // 只保留最近20条
      if (existing.length > 20) existing.shift();
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) { /* ignore */ }

    // 控制台输出（后期可替换为实际统计工具）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[Analytics] Page view:', entry);
    }
  }

  /**
   * 获取访问来源信息
   */
  function getSourceInfo() {
    return {
      source: sessionStorage.getItem('visit_source') || 'direct',
      campaign: sessionStorage.getItem('visit_campaign') || '',
      content: sessionStorage.getItem('visit_content') || '',
      topic: sessionStorage.getItem('visit_topic') || ''
    };
  }

  /**
   * 生成带来源参数的分享链接
   */
  function buildShareUrl(path, source) {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
    const url = new URL(path, base);
    if (source) url.searchParams.set('from', source);
    return url.toString();
  }

  /**
   * 生成抖音分享链接
   */
  function douyinLink(page) {
    return buildShareUrl(page, 'douyin');
  }

  /**
   * 生成小红书分享链接
   */
  function xiaohongshuLink(page, content) {
    const url = buildShareUrl(page, 'xiaohongshu');
    if (content) url.searchParams.set('content', content);
    return url;
  }

  return { trackPageView, getSourceInfo, buildShareUrl, douyinLink, xiaohongshuLink };
})();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  Analytics.trackPageView();
});
