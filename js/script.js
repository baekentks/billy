document.addEventListener('DOMContentLoaded', () => {

    // ── 요소 참조 ──────────────────────────────────────────
    const filterBtns      = document.querySelectorAll('.filter-btn');
    const sections        = document.querySelectorAll('.depth-section');
    const cards           = document.querySelectorAll('.card');
    const subFilterGroup  = document.getElementById('subFilterGroup');
    const filterCount     = document.getElementById('filterCount');
    const sidebarItems    = document.querySelectorAll('.sidebar-item');
    const sidebarSections = document.querySelectorAll('.sidebar-section');
    const sidebarFolders  = document.querySelectorAll('.sidebar-folder');

    // ── 모달 생성 ──────────────────────────────────────────
    const modalHTML = `
        <div id="modalOverlay" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="viewport-toggle">
                        <button class="viewport-btn active" data-viewport="desktop">Desktop</button>
                        <button class="viewport-btn" data-viewport="mobile">Mobile</button>
                    </div>
                    <button class="close-modal" aria-label="닫기">&times;</button>
                </div>
                <div id="modalBody"></div>
                <div class="wireframe-toggle-wrap">
                    <span class="modal-desc" id="modalDesc"></span>
                    <div class="wireframe-toggle-right">
                        <span class="wireframe-toggle-label">Wireframe</span>
                        <button class="wireframe-toggle" id="wireframeToggle" data-state="off">
                            <span class="toggle-track"><span class="toggle-thumb"></span></span>
                            <span class="toggle-text">Off</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay         = document.getElementById('modalOverlay');
    const modalBody       = document.getElementById('modalBody');
    const closeBtn        = overlay.querySelector('.close-modal');
    const wireframeToggle = document.getElementById('wireframeToggle');
    const viewportBtns    = overlay.querySelectorAll('.viewport-btn');

    let isWireframe = true;
    let isMobile    = false;

    // ── 카운트 업데이트 ────────────────────────────────────
    // [FIX] style 문자열 매칭 불안정 → 직접 비교로 변경
    function updateCount() {
        let count = 0;
        document.querySelectorAll('.depth-section:not(.hidden) .card').forEach(card => {
            if (card.style.display !== 'none') count++;
        });
        filterCount.textContent = `${count} components`;
    }

    // ── 전체 카드 보이기 ───────────────────────────────────
    function showAllCards() {
        sections.forEach(s => s.classList.remove('hidden'));
        cards.forEach(c => c.style.display = '');
    }

    // ── 카테고리(AEM/PIM)만 필터 ──────────────────────────
    function filterByCategory(category) {
        sections.forEach(s => {
            s.classList.toggle('hidden', s.dataset.category !== category);
        });
        cards.forEach(c => c.style.display = '');
    }

    // ── 그룹(FT/FTD)만 필터 ──────────────────────────────
    function filterByGroup(category, group) {
        sections.forEach(s => {
            const match = s.dataset.category === category && s.dataset.group === group;
            s.classList.toggle('hidden', !match);
        });
        cards.forEach(c => c.style.display = '');
    }

    // ── 특정 카드만 필터 ──────────────────────────────────
    function filterByCard(category, group, sub) {
        sections.forEach(s => {
            const match = s.dataset.category === category && s.dataset.group === group;
            s.classList.toggle('hidden', !match);
        });
        cards.forEach(c => {
            if (c.dataset.category === category && c.dataset.group === group) {
                c.style.display = (c.dataset.sub === sub) ? '' : 'none';
            } else {
                c.style.display = 'none';
            }
        });
    }

    // ── 사이드바 active 동기화 ────────────────────────────
    function syncSidebar(filter, group, sub) {
        sidebarItems.forEach(item => {
            let match = false;
            if (filter === 'all') {
                match = item.classList.contains('sidebar-item-all');
            } else if (sub !== undefined && sub !== null) {
                match = item.dataset.filter === filter &&
                        item.dataset.group  === group  &&
                        item.dataset.sub    === sub;
            }
            item.classList.toggle('active', match);
        });
    }

    // ── 서브 필터(그룹 버튼) 렌더 ────────────────────────
    function renderSubFilters(category) {
        subFilterGroup.innerHTML = '';
        if (category === 'all') return;

        const groups = new Set();
        sections.forEach(s => {
            if (s.dataset.category === category) groups.add(s.dataset.group);
        });

        if (groups.size === 0) return;

        let html = `<button class="sub-filter-btn active" data-group="all">전체</button>`;
        groups.forEach(g => {
            html += `<button class="sub-filter-btn" data-group="${g}">${g.toUpperCase()}</button>`;
        });
        subFilterGroup.innerHTML = html;

        subFilterGroup.querySelectorAll('.sub-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;
                subFilterGroup.querySelectorAll('.sub-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const g = btn.dataset.group;
                if (g === 'all') {
                    filterByCategory(category);
                    syncFolderActive(null, null);
                } else {
                    filterByGroup(category, g);
                    syncFolderActive(category, g);
                    const targetFolder = document.querySelector(`.sidebar-folder[data-category="${category}"][data-group="${g}"]`);
                    if (targetFolder && !targetFolder.classList.contains('open')) {
                        targetFolder.classList.add('open');
                        slideDown(targetFolder.querySelector('.sidebar-folder-items'));
                    }
                }
                updateCount();
            });
        });
    }

    // ── 필터 버튼 클릭 ────────────────────────────────────
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            if (f === 'all') {
                showAllCards();
                subFilterGroup.innerHTML = '';
                syncFolderActive('all', null);
                syncSidebar('all', null, null);
            } else {
                filterByCategory(f);
                renderSubFilters(f);
                syncFolderActive(f, null);
            }
            updateCount();
        });
    });

    // ── 폴더 active 동기화 ────────────────────────────────
    function syncFolderActive(category, group) {
        sidebarFolders.forEach(f => f.querySelector('.sidebar-folder-title').classList.remove('active'));
        document.querySelector('.sidebar-item-all').classList.remove('active');

        if (!category || !group) return;

        const activeFolder = document.querySelector(`.sidebar-folder[data-category="${category}"][data-group="${group}"]`);
        if (activeFolder) activeFolder.querySelector('.sidebar-folder-title').classList.add('active');
    }

    // ── 슬라이드 애니메이션 ───────────────────────────────
    function slideDown(el) {
        el.style.display = 'block';
        el.style.height = '0';
        const h = el.scrollHeight;
        el.style.height = h + 'px';
        el.addEventListener('transitionend', () => {
            el.style.height = 'auto';
        }, { once: true });
    }

    // [FIX] transitionend 후 display:none 처리 추가
    function slideUp(el) {
        el.style.height = el.scrollHeight + 'px';
        requestAnimationFrame(() => {
            el.style.height = '0';
        });
        el.addEventListener('transitionend', () => {
            el.style.display = 'none';
        }, { once: true });
    }

    // ── 사이드바 섹션 타이틀 클릭 ─────────────────────────
    sidebarSections.forEach(sec => {
        sec.querySelector('.sidebar-section-title').addEventListener('click', () => {
            const category = sec.dataset.category;
            filterByCategory(category);
            filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === category));
            renderSubFilters(category);
            syncFolderActive(null, null);
            updateCount();
        });
    });

    // ── 사이드바 폴더 클릭 → 토글 + 필터링 ──────────────
    sidebarFolders.forEach(folder => {
        const folderItems = folder.querySelector('.sidebar-folder-items');
        folder.querySelector('.sidebar-folder-title').addEventListener('click', () => {
            folder.classList.toggle('open');
            const category = folder.dataset.category;
            const group    = folder.dataset.group;

            if (folder.classList.contains('open')) {
                slideDown(folderItems);
                document.querySelector('.sidebar-item-all').classList.remove('active');
                filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === category));
                filterByGroup(category, group);
                renderSubFilters(category);
                const groupBtn = subFilterGroup.querySelector(`[data-group="${group}"]`);
                if (groupBtn) {
                    subFilterGroup.querySelectorAll('.sub-filter-btn').forEach(b => b.classList.remove('active'));
                    groupBtn.classList.add('active');
                }
                syncFolderActive(category, group);
                updateCount();
            } else {
                slideUp(folderItems);
            }
        });
    });


    // ── 최상위 전체 클릭 ──────────────────────────────────
    document.querySelector('.sidebar-item-all').addEventListener('click', () => {
        showAllCards();
        filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
        subFilterGroup.innerHTML = '';
        sidebarFolders.forEach(f => f.querySelector('.sidebar-folder-title').classList.remove('active'));
        syncSidebar('all', null, null);
        updateCount();
    });

    // ── Wireframe 이미지 경로 변환 ───────────────────────
    function applyWireframeState(container, wireframe) {
        container.querySelectorAll('.view-item img').forEach(img => {
            if (!img.dataset.srcOriginal) img.dataset.srcOriginal = img.src;
            if (wireframe) {
                img.src = img.dataset.srcOriginal;
            } else {
                const orig = img.dataset.srcOriginal;
                const dot  = orig.lastIndexOf('.');
                img.src = orig.slice(0, dot) + '_wireframe' + orig.slice(dot);
            }
        });
    }

    // ── Viewport 토글 ─────────────────────────────────────
    viewportBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) return;
            viewportBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            isMobile = btn.dataset.viewport === 'mobile';

            const desktopRow = modalBody.querySelector('[data-viewport-type="desktop"]');
            const mobileRow  = modalBody.querySelector('[data-viewport-type="mobile"]');
            if (desktopRow) desktopRow.classList.toggle('hidden', isMobile);
            if (mobileRow)  mobileRow.classList.toggle('hidden', !isMobile);

            const displayArea = modalBody.querySelector('.detail-display-area');
            if (displayArea) displayArea.classList.toggle('is-mobile-mode', isMobile);

            // 첫번째 라디오 초기화
            const activeRow = isMobile ? mobileRow : desktopRow;
            if (activeRow) {
                const firstRadio = activeRow.querySelector('.tab-radio');
                if (firstRadio) firstRadio.checked = true;
            }

            initComboMode(modalBody);
            applyWireframeState(modalBody, isWireframe);
        });
    });

    // ── Wireframe 토글 ───────────────────────────────────
    wireframeToggle.addEventListener('click', () => {
        isWireframe = !isWireframe;
        wireframeToggle.dataset.state = isWireframe ? 'off' : 'on';
        wireframeToggle.querySelector('.toggle-text').textContent = isWireframe ? 'Off' : 'On';
        applyWireframeState(modalBody, isWireframe);
    });

    // ── 모달 오픈 ────────────────────────────────────────
    function openModal(card) {
        const dataNode = card.querySelector('.modal-data');
        if (!dataNode) return;

        modalBody.innerHTML = dataNode.innerHTML;
        overlay.classList.add('active');
        document.body.classList.add('stop-scrolling');

        // modal-desc 내용을 하단 고정 영역으로 이동
        const descEl     = modalBody.querySelector('.modal-desc');
        const descTarget = document.getElementById('modalDesc');
        if (descTarget) descTarget.textContent = descEl ? descEl.textContent : '';
        if (descEl) descEl.remove();

        isWireframe = true;
        isMobile    = false;
        wireframeToggle.dataset.state = 'off';
        wireframeToggle.querySelector('.toggle-text').textContent = 'Off';
        viewportBtns.forEach(b => b.classList.toggle('active', b.dataset.viewport === 'desktop'));

        // desktop selector-row 보이기, mobile 숨기기 초기화
        const desktopRow = modalBody.querySelector('[data-viewport-type="desktop"]');
        const mobileRow  = modalBody.querySelector('[data-viewport-type="mobile"]');
        if (desktopRow) desktopRow.classList.remove('hidden');
        if (mobileRow)  mobileRow.classList.add('hidden');

        // [FIX] radio id 중복 방지 — timestamp 조합
        const uid = Date.now();
        modalBody.querySelectorAll('.tab-radio').forEach((radio, idx) => {
            const newId = `modal-radio-${uid}-${idx}`;
            const label = modalBody.querySelector(`label[for="${radio.id}"]`);
            radio.id = newId;
            if (label) label.setAttribute('for', newId);
        });

        const isComboMode = modalBody.querySelector('[data-selector="depth1"]') !== null;
        isComboMode ? initComboMode(modalBody) : initSingleMode(modalBody);
    }

    // ── 단일 depth 모드 ──────────────────────────────────
    function initSingleMode(container) {
        const radios    = container.querySelectorAll('.tab-radio');
        const viewItems = container.querySelectorAll('.view-item');

        const showView = (idx) => {
            viewItems.forEach((item, i) => {
                item.style.display = (i === idx) ? 'flex' : 'none';
            });
            applyWireframeState(container, isWireframe);
        };

        if (radios.length > 0) {
            radios[0].checked = true;
            showView(0);
            radios.forEach((radio, idx) => {
                radio.addEventListener('change', () => showView(idx));
            });
        } else {
            viewItems.forEach((item, i) => {
                if (i === 0) item.style.display = 'flex';
            });
        }
    }

    // ── 병렬 조합 모드 ───────────────────────────────────
    function initComboMode(container) {
        const selectorKey = isMobile ? 'depth1-mo' : 'depth1';
        const depth1Group = container.querySelector(`[data-selector="${selectorKey}"]`);
        const depth2Group = container.querySelector('[data-selector="depth2"]');
        const depth2Row   = depth2Group ? depth2Group.closest('.selector-row') : null;
        const viewItems   = container.querySelectorAll('.view-item[data-combo]');

        if (!depth1Group) return;

        let selected = {
            depth1: depth1Group.querySelector('.tab-radio').getAttribute('data-depth'),
        };

        const showCombo = () => {
            const isAll = selected.depth1 === 'all' || selected.depth1 === 'all-mo';
            const displayArea = container.querySelector('.detail-display-area');
            if (depth2Row) depth2Row.style.display = isAll ? 'none' : 'flex';

            if (isMobile) {
                // 모바일 — is-active 클래스로 전환 (레이아웃 시프트 방지)
                if (isAll) {
                    displayArea.classList.add('is-all-mode');
                    viewItems.forEach(item => {
                        const match = item.getAttribute('data-combo') === 'all-mo';
                        item.classList.toggle('is-active', match);
                    });
                } else {
                    displayArea.classList.remove('is-all-mode');
                    viewItems.forEach(item => {
                        const match = item.getAttribute('data-combo') === selected.depth1;
                        item.classList.toggle('is-active', match);
                    });
                }
            } else {
                // 데스크탑 — 기존 display 방식 유지
                if (isAll) {
                    displayArea.classList.add('is-all-mode');
                    viewItems.forEach(item => {
                        item.style.display = (item.getAttribute('data-combo') === 'all') ? 'flex' : 'none';
                    });
                    displayArea.scrollTop = 0;
                } else {
                    displayArea.classList.remove('is-all-mode');
                    viewItems.forEach(item => {
                        item.style.display = (item.getAttribute('data-combo') === selected.depth1) ? 'flex' : 'none';
                    });
                }
            }
            applyWireframeState(container, isWireframe);
        };

        showCombo();

        depth1Group.querySelectorAll('.tab-radio').forEach(radio => {
            radio.addEventListener('change', () => {
                selected.depth1 = radio.getAttribute('data-depth');
                showCombo();
            });
        });

        if (depth2Group) {
            depth2Group.querySelectorAll('.tab-radio').forEach(radio => {
                radio.addEventListener('change', () => {
                    showCombo();
                });
            });
        }
    }

    // ── 모달 닫기 ────────────────────────────────────────
    function closeModal() {
        overlay.classList.remove('active');
        document.body.classList.remove('stop-scrolling');
        setTimeout(() => { modalBody.innerHTML = ''; }, 380);
    }

    // ── 이벤트 ───────────────────────────────────────────
    document.addEventListener('click', e => {
        if (e.target?.classList.contains('view-detail')) {
            openModal(e.target.closest('.card'));
        }
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    // ── 초기 카운트 + 높이 초기화 ────────────────────────
    updateCount();

    sidebarSections.forEach(sec => {
        const items = sec.querySelector('.sidebar-items');
        if (sec.classList.contains('open')) {
            items.style.height = 'auto';
            items.style.display = 'block';
        }
    });

    // [FIX] sidebar-folder-items 초기화 누락 보완
    sidebarFolders.forEach(folder => {
        const folderItems = folder.querySelector('.sidebar-folder-items');
        if (folder.classList.contains('open')) {
            folderItems.style.height = 'auto';
            folderItems.style.display = 'block';
        } else {
            folderItems.style.display = 'none';
        }
    });
});
