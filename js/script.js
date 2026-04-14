document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sections = document.querySelectorAll('.depth-section');

    // 1. 서브 필터 컨테이너 생성
    const subFilterContainer = document.createElement('div');
    subFilterContainer.className = 'sub-filter-group hidden';
    document.querySelector('.filter-group').after(subFilterContainer);

    // 2. 모달 구조 동적 생성 (토글 버튼 포함)
    const modalHTML = `
        <div id="modalOverlay" class="modal-overlay">
            <div class="modal-content">
                <button class="close-modal" style="position:absolute; top:30px; right:30px; font-size:30px; border:none; background:none; cursor:pointer;">&times;</button>
                <div id="modalBody"></div>
                <div class="wireframe-toggle-wrap">
                    <span class="wireframe-toggle-label">Wireframe</span>
                    <button class="wireframe-toggle" id="wireframeToggle" data-state="off">
                        <span class="toggle-track">
                            <span class="toggle-thumb"></span>
                        </span>
                        <span class="toggle-text">Off</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = overlay.querySelector('.close-modal');
    const wireframeToggle = document.getElementById('wireframeToggle');

    // 토글 상태 (모달 열릴 때마다 On으로 초기화)
    let isWireframe = true;

    // --- 메인 필터 ---
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            sections.forEach(section => {
                if (filter === 'all' || section.getAttribute('data-category') === filter) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });

            renderSubFilters(filter);
        });
    });

    // --- 서브 필터 ---
    function renderSubFilters(mainFilter) {
        if (mainFilter === 'all') {
            subFilterContainer.classList.add('hidden');
            return;
        }

        subFilterContainer.classList.remove('hidden');
        const targetSection = document.querySelector(`.depth-section[data-category="${mainFilter}"]`);
        if (!targetSection) return;

        const cards = targetSection.querySelectorAll('.card');

        let subHTML = `<button class="sub-filter-btn active" data-sub="all">전체</button>`;
        cards.forEach((card, index) => {
            const title = card.querySelector('h3').innerText;
            subHTML += `<button class="sub-filter-btn" data-sub="${index}">${title}</button>`;
            card.setAttribute('data-index', index);
        });

        subFilterContainer.innerHTML = subHTML;

        const subBtns = subFilterContainer.querySelectorAll('.sub-filter-btn');
        subBtns.forEach(sBtn => {
            sBtn.addEventListener('click', () => {
                subBtns.forEach(b => b.classList.remove('active'));
                sBtn.classList.add('active');

                const subTarget = sBtn.getAttribute('data-sub');
                cards.forEach(card => {
                    const cardIdx = card.getAttribute('data-index');
                    if (subTarget === 'all' || subTarget === cardIdx) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- 이미지 src 변환 함수 ---
    // On  → 원본 경로 (data-src-original)
    // Off → 확장자 앞에 _wireframe 삽입
    function applyWireframeState(container, wireframe) {
        const imgs = container.querySelectorAll('.view-item img');
        imgs.forEach(img => {
            // 최초 1회: 원본 src를 data-src-original에 저장
            if (!img.dataset.srcOriginal) {
                img.dataset.srcOriginal = img.src;
            }

            if (wireframe) {
                // 원본으로 복구
                img.src = img.dataset.srcOriginal;
            } else {
                // 원본 경로에서 확장자 앞에 _wireframe 삽입
                const original = img.dataset.srcOriginal;
                const dotIndex = original.lastIndexOf('.');
                img.src = original.slice(0, dotIndex) + '_wireframe' + original.slice(dotIndex);
            }
        });
    }

    // --- 토글 버튼 동작 ---
    wireframeToggle.addEventListener('click', () => {
        isWireframe = !isWireframe;

        // 버튼 상태 업데이트
        wireframeToggle.dataset.state = isWireframe ? 'off' : 'on';
        wireframeToggle.querySelector('.toggle-text').textContent = isWireframe ? 'Off' : 'On';

        // 현재 보이는 이미지에 즉시 적용
        applyWireframeState(modalBody, isWireframe);
    });

    // --- 모달 오픈 ---
    const openModal = (card) => {
        const dataNode = card.querySelector('.modal-data');
        if (!dataNode) return;

        modalBody.innerHTML = dataNode.innerHTML;
        overlay.classList.add('active');
        document.body.classList.add('stop-scrolling');

        // 토글 Off로 초기화
        isWireframe = true;
        wireframeToggle.dataset.state = 'off';
        wireframeToggle.querySelector('.toggle-text').textContent = 'Off';

        // 모달 내 라디오 id 충돌 방지 재처리
        const allRadios = modalBody.querySelectorAll('.tab-radio');
        allRadios.forEach((radio, idx) => {
            const newId = `modal-radio-${idx}`;
            const label = modalBody.querySelector(`label[for="${radio.id}"]`);
            radio.id = newId;
            if (label) label.setAttribute('for', newId);
        });

        // 병렬 조합 구조 여부 판단
        const isComboMode = modalBody.querySelector('[data-selector="depth1"]') !== null;

        if (isComboMode) {
            initComboMode(modalBody);
        } else {
            initSingleMode(modalBody);
        }
    };

    // --- 단일 depth 모드 ---
    function initSingleMode(container) {
        const radios = container.querySelectorAll('.tab-radio');
        const viewItems = container.querySelectorAll('.view-item');

        const showView = (idx) => {
            viewItems.forEach((item, i) => {
                item.style.display = (i === idx) ? 'flex' : 'none';
            });
            // 탭 전환 후 현재 wireframe 상태 재적용
            applyWireframeState(container, isWireframe);
        };

        if (radios.length > 0) {
            radios[0].checked = true;
            showView(0);
            radios.forEach((radio, idx) => {
                radio.addEventListener('change', () => showView(idx));
            });
        }
    }

    // --- 병렬 조합 모드 ---
    function initComboMode(container) {
        const depth1Group = container.querySelector('[data-selector="depth1"]');
        const depth2Group = container.querySelector('[data-selector="depth2"]');
        const viewItems = container.querySelectorAll('.view-item[data-combo]');

        let selected = {
            depth1: depth1Group.querySelector('.tab-radio[checked]')?.getAttribute('data-depth')
                    || depth1Group.querySelector('.tab-radio').getAttribute('data-depth'),
            depth2: depth2Group.querySelector('.tab-radio[checked]')?.getAttribute('data-depth')
                    || depth2Group.querySelector('.tab-radio').getAttribute('data-depth')
        };

        const showCombo = () => {
            const comboKey = `${selected.depth1}-${selected.depth2}`;
            viewItems.forEach(item => {
                item.style.display = (item.getAttribute('data-combo') === comboKey) ? 'flex' : 'none';
            });
            // 탭 전환 후 현재 wireframe 상태 재적용
            applyWireframeState(container, isWireframe);
        };

        showCombo();

        depth1Group.querySelectorAll('.tab-radio').forEach(radio => {
            radio.addEventListener('change', () => {
                selected.depth1 = radio.getAttribute('data-depth');
                showCombo();
            });
        });

        depth2Group.querySelectorAll('.tab-radio').forEach(radio => {
            radio.addEventListener('change', () => {
                selected.depth2 = radio.getAttribute('data-depth');
                showCombo();
            });
        });
    }

    // --- 모달 닫기 ---
    const closeModal = () => {
        overlay.classList.remove('active');
        document.body.classList.remove('stop-scrolling');
        setTimeout(() => { modalBody.innerHTML = ''; }, 400);
    };

    // 이벤트 위임
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('view-detail')) {
            const card = e.target.closest('.card');
            openModal(card);
        }
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });
});
