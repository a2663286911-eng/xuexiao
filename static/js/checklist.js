/* ============================================================
   checklist.js — 开学物品清单 交互逻辑
   ============================================================ */

const ChecklistApp = (() => {
  'use strict';

  const STORAGE_KEY = 'cqytu_checklist_state';
  let state = {};  // { "item-id": true/false }
  let allItems = [];

  /* === 加载清单 === */
  async function load() {
    // 恢复保存状态
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = JSON.parse(saved);
      }
    } catch (e) {
      state = {};
    }

    const data = await DataLoader.getChecklist();
    if (!data || !data.categories) {
      showError('清单数据加载失败，请刷新页面重试。');
      return;
    }

    // 收集所有物品
    allItems = [];
    data.categories.forEach(cat => {
      cat.items.forEach(item => {
        allItems.push({ ...item, category: cat.name, categoryId: cat.id });
      });
    });

    renderChecklist(data.categories);
    updateProgress();
    initFilter();
    initSearch();
    initClearBtn();
  }

  /* === 渲染清单 === */
  function renderChecklist(categories) {
    const container = document.getElementById('checklist-container');
    if (!container) return;

    let html = '';

    categories.forEach(cat => {
      html += `<div class="checklist-category" data-category="${cat.id}">
        <div class="checklist-category-title">${cat.icon || ''} ${cat.name}（${cat.items.length}项）</div>`;

      cat.items.forEach(item => {
        const checked = state[item.id] === true ? 'checked' : '';
        const tagClass = item.tag === 'must' ? 'item-tag-must' : item.tag === 'suggest' ? 'item-tag-suggest' : 'item-tag-buy';
        const tagLabel = item.tag === 'must' ? '必须' : item.tag === 'suggest' ? '建议' : '到校买';

        html += `
          <div class="checklist-item" data-item-id="${item.id}">
            <input type="checkbox" id="chk-${item.id}" ${checked} data-id="${item.id}">
            <label for="chk-${item.id}">${item.name}${item.note ? `<br><small class="text-muted">${item.note}</small>` : ''}</label>
            <span class="item-tag ${tagClass}">${tagLabel}</span>
          </div>
        `;
      });

      html += '</div>';
    });

    container.innerHTML = html;

    // 绑定勾选事件
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        state[id] = e.target.checked;
        save();
        updateProgress();
      });
    });
  }

  /* === 更新进度 === */
  function updateProgress() {
    const total = allItems.length;
    const done = allItems.filter(item => state[item.id] === true).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const doneEl = document.getElementById('checklist-done');
    const totalEl = document.getElementById('checklist-total');
    const pctEl = document.getElementById('checklist-pct');
    const barEl = document.getElementById('checklist-bar');

    if (doneEl) doneEl.textContent = done;
    if (totalEl) totalEl.textContent = total;
    if (pctEl) pctEl.textContent = pct + '%';
    if (barEl) barEl.style.width = pct + '%';
  }

  /* === 保存状态 === */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage 满了
    }
  }

  /* === 分类筛选 === */
  function initFilter() {
    const filterBar = document.getElementById('checklist-filter');
    if (!filterBar) return;

    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;

      // 更新 active 状态
      filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const category = chip.dataset.filter;

      document.querySelectorAll('.checklist-category').forEach(cat => {
        if (category === 'all' || cat.dataset.category === category) {
          cat.style.display = '';
        } else {
          cat.style.display = 'none';
        }
      });
    });
  }

  /* === 搜索物品 === */
  function initSearch() {
    const input = document.getElementById('checklist-search');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();

      document.querySelectorAll('.checklist-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });

      // 隐藏空分类
      document.querySelectorAll('.checklist-category').forEach(cat => {
        const visible = cat.querySelectorAll('.checklist-item[style*="display:"]').length;
        const total = cat.querySelectorAll('.checklist-item').length;
        if (q && visible === total) {
          cat.style.display = 'none';
        } else {
          cat.style.display = '';
        }
      });
    });
  }

  /* === 清空全部勾选 === */
  function initClearBtn() {
    const btn = document.getElementById('checklist-clear');
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (confirm('确定要清空所有勾选状态吗？此操作不可恢复。')) {
        state = {};
        save();
        document.querySelectorAll('#checklist-container input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
        updateProgress();
      }
    });
  }

  /* === 错误提示 === */
  function showError(msg) {
    const container = document.getElementById('checklist-container');
    if (container) {
      container.innerHTML = `<div class="error-state"><span class="icon">⚠️</span><p>${msg}</p></div>`;
    }
  }

  return { load };
})();
