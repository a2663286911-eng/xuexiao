/* ============================================================
   contact.js — 联系与资料领取页面逻辑（XSS安全修复）
   ============================================================ */

const ContactPage = (() => {
  'use strict';

  const ALLOWED_SOURCES = ['douyin', 'xiaohongshu', 'wechat', 'qq', 'direct'];

  async function init() {
    const site = await DataLoader.getSite();

    // 复制按钮（不依赖 site 数据，始终绑定）
    bindCopyButton();

    // 加载失败时仅跳过 site 数据相关逻辑
    if (!site || !site.contact) return;

    const contact = site.contact;
    const R = DataLoader.resolve.bind(DataLoader);

    // 微信ID
    const wechatIdEl = document.getElementById('wechat-id');
    if (wechatIdEl) wechatIdEl.value = contact.wechatId;

    // 二维码图片
    const qrImg = document.getElementById('wechat-qr');
    if (qrImg) {
      const qrPath = contact.wechatQrImage || '';
      qrImg.src = qrPath ? R(qrPath) : '';
      qrImg.alt = '微信二维码';

      // 加载失败时的友好占位
      qrImg.addEventListener('error', function() {
        this.style.display = 'none';
        const placeholder = document.getElementById('qr-placeholder');
        if (placeholder) placeholder.style.display = '';
      }, { once: true });

      // 手机端长按保存提示
      if (qrPath && window.innerWidth < 768) {
        const hint = document.getElementById('qr-hint');
        if (hint) hint.textContent = '长按二维码保存到相册，用微信扫一扫添加';
      }
    }

    // 备注示例
    const noteEl = document.getElementById('wechat-note');
    if (noteEl) noteEl.textContent = '备注：' + contact.wechatNote;

    // 隐私提醒
    const privacyEl = document.getElementById('privacy-notice');
    if (privacyEl) privacyEl.textContent = contact.privacyNotice;

    // 群声明
    const groupEl = document.getElementById('group-notice');
    if (groupEl) groupEl.textContent = contact.groupNotice;

    // 声明
    const disclaimerEl = document.getElementById('contact-disclaimer');
    if (disclaimerEl) disclaimerEl.textContent = site.disclaimer;

    // 读取来源并显示对应文案（安全：只用 textContent + 白名单）
    renderSourceMessage();
  }

  function bindCopyButton() {
    const copyBtn = document.getElementById('copy-wechat');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', () => {
      const wechatIdEl = document.getElementById('wechat-id');
      const wechatId = wechatIdEl ? wechatIdEl.value : '';
      if (!wechatId) return;
      copyToClipboard(wechatId);
      copyBtn.textContent = '已复制 ✓';
      setTimeout(() => { copyBtn.textContent = '复制微信号'; }, 2000);
    });
  }

  function renderSourceMessage() {
    const el = document.getElementById('source-message');
    if (!el) return;

    let source = (sessionStorage.getItem('visit_source') || '').toLowerCase();
    // 白名单校验
    if (!ALLOWED_SOURCES.includes(source)) source = '';

    const topicRaw = sessionStorage.getItem('visit_topic') || '';
    const topic = topicRaw.substring(0, 50); // 长度限制
    const contentRaw = sessionStorage.getItem('visit_content') || '';
    const content = contentRaw.substring(0, 100);

    let message = '';

    if (source === 'douyin') {
      message = '视频中的完整报到资料已整理在这里，欢迎领取。';
    } else if (source === 'xiaohongshu') {
      message = content
        ? '你可以领取帖子中提到的' + escapeHtml(content) + '。'
        : '你可以领取帖子中提到的新生开学清单。';
    } else if (topic === 'major') {
      const majorName = getParam('name') || '';
      const safeName = escapeHtml(majorName.substring(0, 30)) || '你的专业';
      message = '获取' + safeName + '专业的新生资料与后续更新。';
    }

    if (message) {
      el.innerHTML = '<div class="notice notice-info">' + message + '</div>';
    }
  }

  return { init };
})();
