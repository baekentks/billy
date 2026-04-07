document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sections = document.querySelectorAll('.depth-section');
    
    // 1. 세부 항목 탭(서브 필터) 컨테이너 생성 및 삽입
    const subFilterContainer = document.createElement('div');
    subFilterContainer.className = 'sub-filter-group hidden';
    document.querySelector('.filter-group').after(subFilterContainer);

    // 2. 팝업(모달) 구조 동적 생성 (사용자님의 기존 스타일 적용 대상)
    const modalHTML = `
        <div id="modalOverlay" class="modal-overlay">
            <div class="modal-content">
                <button class="close-modal" style="position:absolute; top:30px; right:30px; font-size:30px; border:none; background:none; cursor:pointer;">&times;</button>
                <div id="modalBody"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('modalOverlay');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = overlay.querySelector('.close-modal');

    // --- 메인 필터 로직 (1Depth, 2Depth) ---
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

            // 메인 필터 클릭 시 하위 탭 생성
            renderSubFilters(filter);
        });
    });

    // --- 세부 항목 탭(서브 필터) 생성 함수 ---
    function renderSubFilters(mainFilter) {
        // '전체'일 때는 하위 탭 숨김
        if (mainFilter === 'all') {
            subFilterContainer.classList.add('hidden');
            return;
        }

        subFilterContainer.classList.remove('hidden');
        const targetSection = document.querySelector(`.depth-section[data-category="${mainFilter}"]`);
        if (!targetSection) return;

        const cards = targetSection.querySelectorAll('.card');

        // 하위 탭 구성: [전체] + [각 카드의 h3 제목]
        let subHTML = `<button class="sub-filter-btn active" data-sub="all">전체</button>`;
        cards.forEach((card, index) => {
            const title = card.querySelector('h3').innerText;
            subHTML += `<button class="sub-filter-btn" data-sub="${index}">${title}</button>`;
            card.setAttribute('data-index', index); // 필터링을 위한 인덱스 부여
        });

        subFilterContainer.innerHTML = subHTML;

        // 하위 탭 클릭 이벤트
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

    // --- 팝업(모달) 제어 로직 ---
    const openModal = (card) => {
        const dataNode = card.querySelector('.modal-data');
        if (dataNode) {
            modalBody.innerHTML = dataNode.innerHTML; // 원본 데이터 그대로 복사
            overlay.classList.add('active');
            document.body.classList.add('stop-scrolling');
        }
    };

    const closeModal = () => {
        overlay.classList.remove('active');
        document.body.classList.remove('stop-scrolling');
        setTimeout(() => { modalBody.innerHTML = ''; }, 400);
    };

    // [중요] 이벤트 위임: 필터링으로 카드가 숨겨졌다 나타나도 버튼 클릭 유지
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