/* ============================================================
   main.js — 主脚本：导航、公共组件、来源追踪
   ============================================================ */

(function () {
  'use strict';

  /* === DOM Ready === */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* === Mobile Navigation === */
  function initMobileNav() {
    const toggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const overlay = document.querySelector('.nav-overlay');

    if (!toggle || !mobileNav) return;

    // 确保初始 aria-expanded
    toggle.setAttribute('aria-expanded', 'false');

    function open() {
      toggle.classList.add('active');
      mobileNav.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    }

    function close() {
      toggle.classList.remove('active');
      mobileNav.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
      mobileNav.classList.contains('active') ? close() : open();
    });

    if (overlay) overlay.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
        close();
        toggle.focus();
      }
    });
  }

  /* === Active Nav Highlight === */
  function highlightActiveNav() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-list a, .mobile-nav-list a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === page || (page === 'index.html' && (href === './' || href === 'index.html' || href === '../index.html'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* === Footer Injection (使用统一路径解析) === */
  async function injectFooter() {
    const footerEl = document.querySelector('[data-footer]');
    if (!footerEl) return;

    let siteName = '移通新生指南';
    let disclaimer = '本站及相关交流渠道均为学生自发整理，非重庆移通学院官方平台，具体安排请以重庆移通学院官方通知为准。';

    try {
      const site = await DataLoader.getSite();
      if (site) {
        siteName = site.siteName;
        disclaimer = site.disclaimer;
      }
    } catch (e) { /* use defaults */ }

    const R = DataLoader.resolve.bind(DataLoader);

    footerEl.innerHTML = `
      <footer class="site-footer" role="contentinfo">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div class="footer-brand-name">${escapeHtml(siteName)}</div>
              <p class="footer-disclaimer">${escapeHtml(disclaimer)}</p>
            </div>
            <div>
              <div class="footer-links-title">快速导航</div>
              <ul class="footer-links">
                <li><a href="${R('index.html')}">首页</a></li>
                <li><a href="${R('pages/registration.html')}">开学报到</a></li>
                <li><a href="${R('pages/life.html')}">宿舍生活</a></li>
                <li><a href="${R('pages/study.html')}">学习指南</a></li>
                <li><a href="${R('pages/military.html')}">军训指南</a></li>
                <li><a href="${R('pages/faq.html')}">新生问答</a></li>
              </ul>
            </div>
            <div>
              <div class="footer-links-title">更多</div>
              <ul class="footer-links">
                <li><a href="${R('pages/checklist.html')}">开学物品清单</a></li>
                <li><a href="${R('pages/campus.html')}">专业与校区</a></li>
                <li><a href="${R('pages/search.html')}">全站搜索</a></li>
                <li><a href="${R('pages/contact.html')}">联系与答疑</a></li>
                <li><a href="${R('pages/about.html')}">关于本站</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>&copy; ${new Date().getFullYear()} ${escapeHtml(siteName)} · 学生自发整理</span>
            <span><a href="${R('pages/about.html')}#correction" style="color:inherit">信息纠错</a></span>
          </div>
        </div>
      </footer>
    `;
  }

  /* === Source Tracking (with validation) === */
  const ALLOWED_SOURCES = ['douyin', 'xiaohongshu', 'wechat', 'qq', 'direct'];

  function trackSource() {
    const params = new URLSearchParams(window.location.search);
    let source = (params.get('from') || params.get('source') || '').toLowerCase();
    const campaign = (params.get('campaign') || '').substring(0, 50);
    const content = (params.get('content') || '').substring(0, 100);
    const topic = (params.get('topic') || '').substring(0, 50);

    // 只允许预定义的 source 值
    if (source && !ALLOWED_SOURCES.includes(source)) {
      source = '';
    }

    if (source) sessionStorage.setItem('visit_source', source);
    if (campaign) sessionStorage.setItem('visit_campaign', campaign);
    if (content) sessionStorage.setItem('visit_content', content);
    if (topic) sessionStorage.setItem('visit_topic', topic);

    return {
      source: source || sessionStorage.getItem('visit_source') || '',
      campaign: campaign || sessionStorage.getItem('visit_campaign') || '',
      content: content || sessionStorage.getItem('visit_content') || '',
      topic: topic || sessionStorage.getItem('visit_topic') || ''
    };
  }

  /* === Mobile Bottom Bar === */
  async function initBottomBar() {
    const bar = document.querySelector('.mobile-bottom-bar');
    if (!bar) return;

    if (sessionStorage.getItem('bottom_bar_closed') === 'true') {
      bar.style.display = 'none';
      document.body.classList.remove('has-bottom-bar');
      return;
    }

    document.body.classList.add('has-bottom-bar');

    const closeBtn = bar.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        bar.style.display = 'none';
        document.body.classList.remove('has-bottom-bar');
        sessionStorage.setItem('bottom_bar_closed', 'true');
      });
    }
  }

  /* === Desktop Side Button === */
  function initDesktopSideBtn() {
    const btn = document.querySelector('.desktop-side-btn');
    if (!btn) return;

    if (window.innerWidth >= 768) btn.style.display = 'flex';

    window.addEventListener('resize', () => {
      btn.style.display = window.innerWidth >= 768 ? 'flex' : 'none';
    });
  }

  /* === Toast Notification === */
  window.showToast = function (message, duration = 2000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  };

  /* === Copy to Clipboard === */
  window.copyToClipboard = async function (text) {
    try {
      await navigator.clipboard.writeText(text);
      window.showToast('已复制到剪贴板！请在微信中搜索或扫码添加。');
      return true;
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      window.showToast('已复制到剪贴板！请在微信中搜索或扫码添加。');
      return true;
    }
  };

  /* === Get URL Parameter === */
  window.getParam = function (name) {
    return new URLSearchParams(window.location.search).get(name);
  };

  /* === Escape HTML (XSS防护) === */
  window.escapeHtml = function (str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /* === Highlight Search Terms === */
  window.highlightText = function (text, query) {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  /* === Format Date === */
  window.formatDate = function (dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  /* === Status Badge HTML (统一信息状态体系) === */
  window.statusBadge = function (status) {
    const map = {
      '2026官方信息': 'badge-official-2026',
      '往年官方参考': 'badge-past-official',
      '实地核实': 'badge-field-verified',
      '学生经验': 'badge-student',
      '通用建议': 'badge-general-advice',
      '待官方发布': 'badge-pending-official',
      '待实地核实': 'badge-pending-field',
      '已失效': 'badge-expired',
      // Legacy compat
      '官方通知': 'badge-official-2026',
      '已核实': 'badge-official-2026',
      '等待更新': 'badge-pending-official',
      '仅供参考': 'badge-past-official'
    };
    var cls = map[status] || 'badge-pending-field';
    return '<span class="badge ' + cls + '">' + escapeHtml(status) + '</span>';
  };

  /* === Source link helper === */
  window.sourceLink = function (sourceTitle, sourceUrl, label) {
    if (!sourceTitle) return '';
    if (sourceUrl) {
      var displayLabel = label || '查看官方来源';
      return '<a href="' + escapeHtml(sourceUrl) + '" target="_blank" rel="noopener noreferrer" class="source-link-btn">📎 ' + escapeHtml(displayLabel) + '</a>';
    }
    return '<span class="text-small text-muted">📎 ' + escapeHtml(sourceTitle) + '</span>';
  };

  /* === Unified meta display === */
  window.renderMeta = function (item) {
    var parts = [];
    if (item.status) parts.push(statusBadge(item.status));
    if (item.applicableYear) parts.push('<span class="text-xs text-muted">📅 ' + escapeHtml(item.applicableYear) + '</span>');
    if (item.verifiedAt) parts.push('<span class="text-xs text-muted">核查于 ' + escapeHtml(item.verifiedAt) + '</span>');

    // Support multiple sources via `sources` array
    if (item.sources && Array.isArray(item.sources) && item.sources.length > 0) {
      item.sources.forEach(function (src) {
        if (src.url) {
          var label = '查看' + src.title;
          parts.push(sourceLink(src.title, src.url, label));
        } else if (src.title) {
          parts.push('<span class="text-small text-muted">📎 ' + escapeHtml(src.title) + '</span>');
        }
      });
    } else if (item.sourceTitle) {
      // Legacy single source
      parts.push(sourceLink(item.sourceTitle, item.sourceUrl, '查看官方来源'));
    }
    return parts.join(' ');
  };

  /* === Image Lightbox === */
  window.openImage = function (src) {
    var existing = document.querySelector('.img-lightbox');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.className = 'img-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '查看大图');
    overlay.innerHTML = '<div class="img-lightbox-bg"></div><img src="' + src + '" alt="放大查看"><button class="img-lightbox-close" aria-label="关闭">&times;</button>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    function close() { overlay.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    overlay.querySelector('.img-lightbox-bg').addEventListener('click', close);
    overlay.querySelector('.img-lightbox-close').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    overlay.querySelector('.img-lightbox-close').focus();
  };

  /* === Init === */
  ready(() => {
    initMobileNav();
    highlightActiveNav();
    injectFooter();
    trackSource();
    initBottomBar();
    initDesktopSideBtn();
  });

})();
