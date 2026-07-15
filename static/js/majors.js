/* ============================================================
   majors.js — 专业与校区查询（2026年招生章程数据）
   ============================================================ */

const MajorSearch = (() => {
  'use strict';

  async function init() {
    const input = document.getElementById('major-search-input');
    const btn = document.getElementById('major-search-btn');
    const results = document.getElementById('major-results');
    const notice = document.getElementById('major-notice');

    if (!input || !results) return;

    const data = await DataLoader.getMajors();
    if (!data) {
      results.innerHTML = '<div class="error-state"><span class="icon">⚠️</span><p>专业数据加载失败</p></div>';
      return;
    }

    const majorsList = data.majors || (Array.isArray(data) ? data : []);

    if (notice && data.notice) {
      notice.textContent = data.notice;
      notice.style.display = '';
    }

    function doSearch() {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        results.innerHTML = '<p class="text-muted text-center">输入专业名称或学院名称开始查询</p>';
        return;
      }

      const matched = majorsList.filter(function(m) {
        const haystack = [m.name, m.admissionCategory || '', m.college || '', m.campusDescription || ''].join(' ').toLowerCase();
        return haystack.includes(q);
      });

      if (matched.length === 0) {
        var safeQ = escapeHtml(input.value.trim().substring(0, 30));
        results.innerHTML = '<div class="empty-state"><span class="icon">🔍</span><h3>未找到「' + safeQ + '」</h3><p class="text-muted">该专业不在2026年招生专业中，或名称与输入不一致。试试简写或所属学院名称？</p><div class="mt-2"><a href="contact.html?topic=major&name=' + encodeURIComponent(input.value.trim().substring(0, 30)) + '" class="btn btn-outline btn-sm">提交反馈</a></div></div>';
        return;
      }

      var html = '';
      matched.forEach(function(m) {
        var campusHtml = '';
        if (m.freshmanCampus === m.laterCampus) {
          campusHtml = '<span style="color:var(--color-primary);font-weight:600;">📍 ' + escapeHtml(m.freshmanCampus) + '</span> · ' + escapeHtml(m.campusDescription || '');
        } else {
          campusHtml = '<span style="color:var(--color-warning);font-weight:600;">📍 大一：' + escapeHtml(m.freshmanCampus) + '</span> → <span style="color:var(--color-primary);font-weight:600;">大二至大四：' + escapeHtml(m.laterCampus) + '</span>';
        }

        html += '<div class="major-result"><div><div class="major-result-name">' + escapeHtml(m.name) + '</div><div style="font-size:0.85rem;color:var(--color-text-secondary);">📂 ' + escapeHtml(m.admissionCategory || m.name) + ' · 🏛️ ' + escapeHtml(m.college || '') + '</div><div style="font-size:0.85rem;margin-top:4px;">' + campusHtml + '</div><div style="font-size:0.85rem;margin-top:4px;">💰 学费：' + (typeof m.tuition === 'number' ? m.tuition.toLocaleString() + ' 元/学年' : (m.tuition || '待公布')) + '</div><div style="font-size:0.8rem;margin-top:4px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' + renderMeta(m) + '</div></div></div>';
      });

      html += '<div class="mt-3 text-center"><p class="text-muted text-small">专业名称、所属学院和校区安排的具体依据，请查看上方官方来源链接。 · 更新于 ' + escapeHtml(data.lastUpdated || '') + '</p><p class="text-muted text-small">获取该专业的新生资料与后续更新？</p><a href="contact.html?topic=major&name=' + encodeURIComponent(input.value.trim().substring(0, 30)) + '" class="btn btn-primary btn-sm">查看领取方式</a></div>';

      results.innerHTML = html;
    }

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doSearch();
    });

    var urlQ = getParam('q') || getParam('major');
    if (urlQ) {
      input.value = urlQ;
      doSearch();
    }
  }

  return { init };
})();
