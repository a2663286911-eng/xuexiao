/* ============================================================
   faq.js — 新生问答 展开/收起/搜索/筛选
   ============================================================ */

const FaqApp = (() => {
  'use strict';

  async function init() {
    const container = document.getElementById('faq-container');
    if (!container) return;

    const data = await DataLoader.getFaq();
    if (!data || !Array.isArray(data)) {
      container.innerHTML = '<div class="error-state"><span class="icon">⚠️</span><p>FAQ数据加载失败</p></div>';
      return;
    }

    // 提取分类
    const categories = [...new Set(data.map(f => f.category))];

    // 渲染分类筛选
    renderFilter(categories, data);

    // 渲染FAQ列表
    renderList(data, container);

    // 绑定搜索
    initSearch(data, container);

    // URL定位
    const hashId = getParam('id');
    if (hashId) {
      setTimeout(() => {
        const item = document.querySelector('.faq-item[data-id="' + CSS.escape(hashId) + '"]');
        if (item) {
          item.classList.add('open');
          const btn = item.querySelector('.faq-question');
          if (btn) btn.setAttribute('aria-expanded', 'true');
          item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }

  function renderFilter(categories, data) {
    const filterBar = document.getElementById('faq-filter');
    if (!filterBar) return;

    let html = `<button class="filter-chip active" data-filter="all">全部（${data.length}）</button>`;
    categories.forEach(cat => {
      const count = data.filter(f => f.category === cat).length;
      html += `<button class="filter-chip" data-filter="${cat}">${cat}（${count}）</button>`;
    });
    filterBar.innerHTML = html;

    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;

      filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;

      document.querySelectorAll('.faq-item').forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  function renderList(data, container) {
    let html = '<div class="faq-list">';

    data.forEach(faq => {
      html += `
        <div class="faq-item" data-id="${faq.id}" data-category="${faq.category}">
          <button class="faq-question" aria-expanded="false">
            <span>${faq.question}</span>
            <span class="faq-icon" aria-hidden="true">+</span>
          </button>
          <div class="faq-answer">
            <div>${faq.answer.replace(/\n/g, '<br>')}</div>
            <div class="faq-meta">
              ${renderMeta(faq)}
            </div>
            ${faq.related ? `
              <div class="mt-2">
                <span class="text-xs text-muted">相关攻略：</span>
                ${faq.related.map(r => `<a href="article.html?id=${encodeURIComponent(r)}" class="text-small">查看</a>`).join(' · ')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // 绑定展开/收起
    container.querySelectorAll('.faq-question').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        item.classList.toggle('open');
        btn.setAttribute('aria-expanded', !isOpen);
      });
    });
  }

  function initSearch(data, container) {
    const input = document.getElementById('faq-search');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();

      document.querySelectorAll('.faq-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        const btn = item.querySelector('.faq-question');
        if (!q || text.includes(q)) {
          item.style.display = '';
          if (q) {
            item.classList.add('open');
            if (btn) btn.setAttribute('aria-expanded', 'true');
          }
        } else {
          item.style.display = 'none';
          item.classList.remove('open');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  return { init };
})();
