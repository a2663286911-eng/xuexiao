/* ============================================================
   search.js — 全站搜索
   搜索范围：文章、FAQ、地点、专业、校区、清单物品
   ============================================================ */

const SearchEngine = (() => {
  'use strict';

  async function search(query) {
    if (!query || query.trim().length < 1) {
      return { articles: [], faq: [], places: [], majors: [], checklist: [], campuses: [] };
    }

    const q = query.trim().toLowerCase();
    const results = { articles: [], faq: [], places: [], majors: [], checklist: [], campuses: [] };

    const [articlesRaw, faqRaw, placesRaw, majorsRaw, checklistRaw, campusesRaw] = await Promise.all([
      DataLoader.getArticles(),
      DataLoader.getFaq(),
      DataLoader.getPlaces(),
      DataLoader.getMajors(),
      DataLoader.getChecklist(),
      DataLoader.getCampuses()
    ]);

    // 搜索文章 (articles.json 是数组)
    const articles = articlesRaw && Array.isArray(articlesRaw) ? articlesRaw : [];
    results.articles = articles.filter(a => {
      const haystack = [a.title, a.summary, a.categoryName, a.content || '', (a.keywords || []).join(' ')].join(' ').toLowerCase();
      return haystack.includes(q);
    }).map(a => ({ ...a, _type: 'article', _label: '攻略文章' }));

    // 搜索 FAQ (faq.json 是数组)
    const faq = faqRaw && Array.isArray(faqRaw) ? faqRaw : [];
    results.faq = faq.filter(f => {
      const haystack = [f.question, f.answer, f.category].join(' ').toLowerCase();
      return haystack.includes(q);
    }).map(f => ({ ...f, _type: 'faq', _label: '常见问题' }));

    // 搜索地点 (places.json 是 { places: [...] })，过滤 published: false
    const placesList = placesRaw && placesRaw.places ? placesRaw.places : (Array.isArray(placesRaw) ? placesRaw : []);
    results.places = placesList.filter(function(p) {
      if (p.published === false) return false;
      const haystack = [p.name, p.category, p.description || '', p.campus || ''].join(' ').toLowerCase();
      return haystack.includes(q);
    }).map(function(p) { return Object.assign({}, p, { _type: 'place', _label: '校园地点' }); });

    // 搜索专业 (majors.json 是 { majors: [...] })
    const majorsList = majorsRaw && majorsRaw.majors ? majorsRaw.majors : (Array.isArray(majorsRaw) ? majorsRaw : []);
    results.majors = majorsList.filter(m => {
      const haystack = [m.name, m.campusDescription || '', m.college || '', m.admissionCategory || '', m.freshmanCampus || '', m.laterCampus || ''].join(' ').toLowerCase();
      return haystack.includes(q);
    }).map(m => ({ ...m, _type: 'major', _label: '专业信息' }));

    // 搜索校区
    const campusesList = campusesRaw && campusesRaw.campuses ? campusesRaw.campuses : [];
    results.campuses = campusesList.filter(c => {
      const haystack = [c.name, c.fullName || '', c.address || '', c.description || ''].join(' ').toLowerCase();
      return haystack.includes(q);
    }).map(c => ({ ...c, _type: 'campus', _label: '校区信息' }));

    // 搜索清单物品
    const checklist = checklistRaw && checklistRaw.categories ? checklistRaw : null;
    if (checklist) {
      const allItems = [];
      checklist.categories.forEach(cat => {
        cat.items.forEach(item => {
          const haystack = [item.name, cat.name, item.note || '', item.tag || ''].join(' ').toLowerCase();
          if (haystack.includes(q)) {
            allItems.push({ ...item, category: cat.name, _type: 'checklist', _label: '开学物品' });
          }
        });
      });
      results.checklist = allItems;
    }

    return results;
  }

  function totalCount(results) {
    return results.articles.length + results.faq.length + results.places.length +
           results.majors.length + results.checklist.length + results.campuses.length;
  }

  function renderResults(results, query, container) {
    if (!container) return;
    const total = totalCount(results);
    const safeQuery = escapeHtml(query);

    if (total === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="icon">🔍</span>
          <h3>没有找到与「${safeQuery}」相关的内容</h3>
          <p class="text-muted">试试换一个关键词，或者：</p>
          <div class="mt-2">
            <a href="${DataLoader.resolve('pages/faq.html')}" class="btn btn-outline btn-sm">查看常见问题</a>
            <a href="${DataLoader.resolve('pages/contact.html')}" class="btn btn-primary btn-sm mt-1">查看答疑方式</a>
          </div>
        </div>
      `;
      return;
    }

    let html = `<p class="text-muted mb-3">找到 ${total} 条与「${safeQuery}」相关的结果</p>`;

    const groups = [
      { key: 'articles', title: '📝 攻略文章', items: results.articles },
      { key: 'faq', title: '❓ 常见问题', items: results.faq },
      { key: 'majors', title: '🎓 专业信息', items: results.majors },
      { key: 'campuses', title: '🏫 校区信息', items: results.campuses },
      { key: 'places', title: '📍 校园地点', items: results.places },
      { key: 'checklist', title: '✅ 开学物品', items: results.checklist }
    ];

    groups.forEach(group => {
      if (!group.items || group.items.length === 0) return;
      html += `<div class="search-result-group"><div class="search-result-group-title">${group.title}（${group.items.length}）</div>`;

      group.items.forEach(item => {
        const titleText = item.title || item.name || item.question || '';
        const highlightedTitle = highlightText(titleText, query);

        if (group.key === 'faq') {
          html += `
            <div class="search-result-item">
              <a href="${DataLoader.resolve('pages/faq.html')}?id=${encodeURIComponent(item.id)}">${highlightedTitle}</a>
              <div class="result-type">${item._label} · ${escapeHtml(item.category || '')}</div>
              <p class="text-small text-muted mt-1">${highlightText((item.answer || '').substring(0, 120) + '...', query)}</p>
            </div>
          `;
        } else if (group.key === 'articles') {
          html += `
            <div class="search-result-item">
              <a href="${DataLoader.resolve('pages/article.html')}?id=${encodeURIComponent(item.id)}">${highlightedTitle}</a>
              <div class="result-type">${item._label} · ${escapeHtml(item.categoryName || '')}</div>
              <p class="text-small text-muted mt-1">${highlightText(escapeHtml(item.summary || ''), query)}</p>
            </div>
          `;
        } else if (group.key === 'places') {
          html += `
            <div class="search-result-item">
              <a href="${DataLoader.resolve('pages/map.html')}?q=${encodeURIComponent(titleText)}">${highlightedTitle}</a>
              <div class="result-type">${item._label} · ${escapeHtml(item.campus || '')} · ${escapeHtml(item.category || '')}</div>
              <p class="text-small text-muted mt-1">${highlightText(escapeHtml(item.description || ''), query)}</p>
            </div>
          `;
        } else if (group.key === 'majors') {
          var campusInfo = item.freshmanCampus === item.laterCampus
            ? escapeHtml(item.freshmanCampus || '正在核实')
            : escapeHtml(item.freshmanCampus || '?') + ' → ' + escapeHtml(item.laterCampus || '?');
          html += `
            <div class="search-result-item">
              <a href="${DataLoader.resolve('pages/campus.html')}?q=${encodeURIComponent(item.name)}">${highlightedTitle}</a>
              <div class="result-type">${item._label} · ${escapeHtml(item.college || '')} · ${campusInfo}</div>
            </div>
          `;
        } else if (group.key === 'campuses') {
          html += `
            <div class="search-result-item">
              <strong>${highlightedTitle}</strong>
              <div class="result-type">${item._label} · ${escapeHtml(item.address || '')}</div>
              <p class="text-small text-muted mt-1">${highlightText(escapeHtml((item.description || '').substring(0, 150)), query)}</p>
              <div class="mt-1">${renderMeta({status: item.addressStatus || item.status, applicableYear: item.addressApplicableYear || item.applicableYear, verifiedAt: item.verifiedAt, sourceTitle: item.addressSourceTitle || item.sourceTitle, sourceUrl: item.addressSourceUrl || item.sourceUrl})}</div>
            </div>
          `;
        } else if (group.key === 'checklist') {
          html += `
            <div class="search-result-item">
              <a href="${DataLoader.resolve('pages/checklist.html')}">${highlightedTitle}</a>
              <div class="result-type">${item._label} · ${escapeHtml(item.category || '')} · ${escapeHtml(item.tag || '')}</div>
              ${item.note ? `<p class="text-small text-muted mt-1">${highlightText(escapeHtml(item.note), query)}</p>` : ''}
            </div>
          `;
        }
      });
      html += '</div>';
    });

    container.innerHTML = html;
  }

  return { search, totalCount, renderResults };
})();
