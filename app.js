// IDROPM 애플리케이션 상태 및 동작 제어 스크립트

// ==========================================
// 1. 의약품 검색 요약 정보 사전 데이터베이스 (Note 자동 연동용)
// ==========================================
const medDictionary = {
    "오클라에스 점안액": "성분: 히알루론산나트륨\n효능: 각결막 상피장해 치료, 안구 건조감 해소\n용법: 1회 1방울, 1일 5~6회 점안. 무보존제 제품으로 개봉 후 즉시 사용 권장.\n주의: 점안 시 용기 끝이 눈에 닿지 않도록 주의할 것.",
    "리프레쉬 플러스": "성분: 카르복시메틸셀룰로오스나트륨\n효능: 안구건조증 완화, 자극감 완화 및 수분 공급\n용법: 필요 시 질환 부위에 1~2방울 점안. 1회용 제품이므로 재사용을 금지함.\n주의: 다른 안약과 병용 시 최소 5분 이상의 시간 간격을 두고 사용 권장.",
    "코솝에스 점안액": "성분: 도르졸라미드염산염, 티몰롤말레산염\n효능: 녹내장 및 고안압증 환자의 상승된 안압 감소\n용법: 질환이 있는 눈에 1회 1방울, 1일 2회 점안.\n주의: 천식, 만성폐쇄성폐질환 환자 또는 중증 심장질환 환자는 의사 상담 필요.",
    "알파간피 점안액": "성분: 브리모니딘타르타르산염\n효능: 개방각 녹내장 및 고안압증의 안압 하강 치료\n용법: 질환이 있는 눈에 1회 1방울, 1일 2회(약 12시간 간격) 점안.\n주의: 소프트렌즈 착용 시 점안 15분 후 렌즈를 착용할 것. 졸음 유발 가능.",
    "옵티클점안액-클로람페니콜": "성분: 클로람페니콜\n효능: 결막염, 각막염 등 광범위 세균성 안과 감염증 치료\n용법: 1회 1~2방울, 1일 3~5회 점안. 증상 개선에 따라 감량.\n주의: 장기 사용 시 조혈계 부작용 확인을 위한 혈액 검사가 필요할 수 있음."
};

// ==========================================
// 2. 애플리케이션 상태 (State)
// ==========================================
const appState = {
    // 안약 목록 (초기 데이터)
    medicines: [
        { id: 1, name: "오클라에스 점안액" },
        { id: 2, name: "리프레쉬 플러스" },
        { id: 3, name: "옵티클점안액-클로람페니콜" }
    ],
    // 알림 설정 목록
    alarms: [
        {
            id: 1,
            medName: "오클라에스 점안액",
            dose: 1,
            time: "11:00",
            everyday: false,
            days: [1, 3, 5], // 월, 수, 금
            method: ["sound", "vibe"] // 소리, 진동 동시 설정 가능
        },
        {
            id: 2,
            medName: "옵티클점안액-클로람페니콜",
            dose: 1,
            time: "13:20",
            everyday: true,
            days: [0, 1, 2, 3, 4, 5, 6], // 매일
            method: ["sound"]
        }
    ],
    // 점안 이력 및 미점안 계획 기록 통합 관리 (2D 타임라인 그래프 플롯용)
    // taken: true (점안 완료 - 도트 채움), taken: false (미점안 - 빈 도트)
    historyRecords: [
        { id: 1, date: "2023-12-14", time: "12:20:00", hour: 12.33, medName: "오클라에스 점안액", dose: 1, device: "기기1", taken: true },
        { id: 2, date: "2023-12-14", time: "23:33:00", hour: 23.55, medName: "오클라에스 점안액", dose: 1, device: "기기1", taken: true },
        { id: 3, date: "2023-12-14", time: "08:00:00", hour: 8.0, medName: "오클라에스 점안액", dose: 1, device: "기기1", taken: false }, // 미점안 예시
        
        { id: 4, date: "2023-12-13", time: "13:20:35", hour: 13.34, medName: "옵티클점안액-클로람페니콜", dose: 1, device: "기기1", taken: true },
        { id: 5, date: "2023-12-13", time: "18:30:00", hour: 18.5, medName: "옵티클점안액-클로람페니콜", dose: 1, device: "기기2", taken: true },
        
        { id: 6, date: "2023-12-12", time: "10:30:00", hour: 10.5, medName: "리프레쉬 플러스", dose: 1, device: "기기1", taken: true },
        { id: 7, date: "2023-12-12", time: "19:00:00", hour: 19.0, medName: "리프레쉬 플러스", dose: 1, device: "기기1", taken: true },
        
        { id: 8, date: "2023-12-11", time: "11:00:00", hour: 11.0, medName: "오클라에스 점안액", dose: 1, device: "기기2", taken: true },
        { id: 9, date: "2023-12-11", time: "16:00:00", hour: 16.0, medName: "오클라에스 점안액", dose: 1, device: "기기1", taken: false }, // 미점안
        
        { id: 10, date: "2023-12-10", time: "05:00:00", hour: 5.0, medName: "옵티클점안액-클로람페니콜", dose: 1, device: "기기1", taken: true },
        
        { id: 11, date: "2023-12-09", time: "14:00:00", hour: 14.0, medName: "오클라에스 점안액", dose: 1, device: "기기1", taken: true },
        
        { id: 12, date: "2023-12-08", time: "05:00:00", hour: 5.0, medName: "리프레쉬 플러스", dose: 1, device: "기기2", taken: true }
    ],
    // 가상의 총 기록 시작 건수 (뱃지 카운트용)
    baseHistoryCount: 1988,

    // UI 제어 상태
    activePage: "page-home",
    selectedMedicineForAlarm: null,
    currentEditingAlarmId: null,
    bluetoothStatus: "disconnected", // disconnected, connecting, connected
    
    // 임시 모달 활성용 타겟 ID 보관
    activeAlarmTemp: null,
    activeEditingRecordId: null, // 점안 결과 팝업 수정용 ID

    // 오디오 콘텍스트
    audioContext: null,
    audioIntervalId: null
};

// ==========================================
// 3. 초기 데이터 백업 (리셋용)
// ==========================================
const INITIAL_MEDICINES = JSON.stringify(appState.medicines);
const INITIAL_ALARMS = JSON.stringify(appState.alarms);
const INITIAL_HISTORY = JSON.stringify(appState.historyRecords);

// ==========================================
// 4. 페이지 내비게이션 (SPA 라우팅)
// ==========================================
function navigateTo(pageId) {
    const pages = document.querySelectorAll('.app-page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        appState.activePage = pageId;
    }

    updateDemoNavButtons(pageId);
    
    // 페이지 전환 시 실시간 데이터 리프레쉬
    if (pageId === "page-medicine") {
        renderMedicineList();
    } else if (pageId === "page-alarm-list") {
        renderAlarmList();
    } else if (pageId === "page-history-list") {
        renderHistoryList();
    } else if (pageId === "page-compliance") {
        renderComplianceChart();
        renderComplianceStats();
    }
}

function updateDemoNavButtons(pageId) {
    const navButtons = document.querySelectorAll('.demo-nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });
}

// ==========================================
// 5. 컴포넌트 렌더링 로직
// ==========================================

// 안약 관리 목록 (Page 2)
function renderMedicineList() {
    const listContainer = document.getElementById('medicine-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    appState.medicines.forEach((med, index) => {
        const li = document.createElement('li');
        li.className = 'medicine-item';
        li.innerHTML = `
            <div class="med-info-group" data-name="${med.name}">
                <span class="med-num">${index + 1}</span>
                <span class="med-name">${med.name}</span>
            </div>
            <div class="med-actions-group">
                <button class="med-btn btn-edit" data-id="${med.id}">수정</button>
                <button class="med-btn btn-delete" data-id="${med.id}" data-name="${med.name}">삭제</button>
                <button class="med-btn btn-setup-alarm" data-name="${med.name}">알림 설정</button>
            </div>
        `;
        listContainer.appendChild(li);
    });

    updateMedicineDropdowns();
}

function updateMedicineDropdowns() {
    const alarmMedSelect = document.getElementById('alarm-med-select');
    if (alarmMedSelect) {
        alarmMedSelect.innerHTML = '';
        if (appState.medicines.length === 0) {
            alarmMedSelect.innerHTML = '<option value="" disabled selected>지정 안약 없음</option>';
        } else {
            appState.medicines.forEach(med => {
                const opt = document.createElement('option');
                opt.value = med.name;
                opt.textContent = med.name;
                alarmMedSelect.appendChild(opt);
            });
        }
    }
}

// 알림 설정 목록 (Page 3)
function renderAlarmList() {
    const subListContainer = document.getElementById('alarm-sub-list-container');
    if (!subListContainer) return;
    subListContainer.innerHTML = '';

    // 첫 진입 시 배너 정보는 첫 번째 알림으로 표시
    if (appState.alarms.length > 0) {
        updateAlarmBanner(appState.alarms[0]);
    } else {
        const bannerTime = document.getElementById('banner-time');
        const bannerDays = document.getElementById('banner-days');
        bannerTime.textContent = "알림 없음";
        bannerDays.textContent = "새 알림을 등록해주세요";
    }

    appState.alarms.forEach((alarm, index) => {
        const li = document.createElement('li');
        li.className = 'alarm-sub-item';
        li.setAttribute('data-id', alarm.id);
        
        let displayName = alarm.medName;
        if (displayName.length > 15) {
            displayName = displayName.substring(0, 14) + '...';
        }
        li.innerHTML = `
            <div class="alarm-sub-info">
                <span>${index + 1}. 약명: ${displayName}</span>
            </div>
            <button class="btn-edit-alarm" data-id="${alarm.id}">수정</button>
        `;
        subListContainer.appendChild(li);
    });
}

// 알림 상단 대표 배너 업데이트 함수
function updateAlarmBanner(alarm) {
    const bannerTime = document.getElementById('banner-time');
    const bannerDays = document.getElementById('banner-days');
    if (bannerTime && bannerDays) {
        bannerTime.textContent = formatTime12h(alarm.time);
        bannerDays.textContent = alarm.everyday ? '요일 - 매일' : `요일 - ${formatDaysKor(alarm.days)}`;
    }
}

// 점안 기록 이력 목록 (Page 6)
function renderHistoryList() {
    const recordContainer = document.getElementById('history-record-container');
    const totalBadge = document.getElementById('history-total-badge');
    
    if (!recordContainer) return;
    recordContainer.innerHTML = '';

    const totalCount = appState.baseHistoryCount + appState.historyRecords.length;
    if (totalBadge) {
        totalBadge.textContent = `총 ${totalCount.toLocaleString()}건 P. 1`;
    }

    appState.historyRecords.forEach(rec => {
        const li = document.createElement('li');
        li.className = 'history-record-item';
        li.setAttribute('data-id', rec.id);
        
        // 점안 완료와 미점안 구분 표기
        const takenText = rec.taken ? "점안 완료" : "미점안";
        const takenStyle = rec.taken ? "" : "style='color: #FF3B30; font-weight: 700;'";

        li.innerHTML = `
            <span class="history-item-time">${rec.date} ${rec.time}</span>
            <span class="history-item-detail">${rec.medName} ${rec.dose}회 - <span ${takenStyle}>${takenText}</span> (${rec.device})</span>
        `;
        recordContainer.appendChild(li);
    });
}

// 점안 준수 통계 요약 (Page 7) - 수식 및 계산 결과 연동
function renderComplianceStats() {
    const txtRate = document.getElementById('txt-compliance-rate');
    const txtFormula = document.getElementById('txt-compliance-formula');
    const txtCounts = document.getElementById('txt-compliance-counts');
    
    if (!txtRate || !txtCounts || !txtFormula) return;

    // 점안 완료(taken: true) 갯수와 전체 이력 갯수를 활용한 리액티브 계산
    const taken = appState.historyRecords.filter(r => r.taken).length;
    const total = appState.historyRecords.length;
    const missed = total - taken;
    
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    txtRate.textContent = `점안 준수율 ${rate}%`;
    txtFormula.textContent = `(계산식: [점안 ${taken}회 / 전체 ${total}회] x 100)`;
    txtCounts.textContent = `점안 ${taken}개 | 미점안 ${missed}개`;
}

// [사양 전면 변경] 24시간 X축 - 일자 Y축 SVG 차트 드로잉 (Page 7)
function renderComplianceChart() {
    const wrapper = document.getElementById('svg-chart-wrapper');
    if (!wrapper) return;

    // 차트 치수
    const w = 310;
    const h = 200;
    
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 30;
    
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    // 날짜 매핑 (Y축)
    const dates = ["12/14", "12/13", "12/12", "12/11", "12/10", "12/9", "12/8"];

    // 좌표 연산 헬퍼
    function getX(hour) {
        return paddingLeft + (hour / 24) * chartW;
    }
    function getY(dateIdx) {
        return paddingTop + dateIdx * (chartH / (dates.length - 1));
    }

    // 1. 수평선 (일자 기준 라인 7개) 및 Y축 일자 텍스트 생성
    let yLinesHtml = '';
    dates.forEach((date, idx) => {
        const yPos = getY(idx);
        yLinesHtml += `
            <!-- 가로 일자 격자선 -->
            <line x1="${paddingLeft}" y1="${yPos}" x2="${w - paddingRight}" y2="${yPos}" stroke="#EAECF0" stroke-width="1.5" />
            <!-- Y축 날짜 라벨 -->
            <text x="${paddingLeft - 8}" y="${yPos + 4}" font-size="10" font-weight="600" fill="#4E5968" text-anchor="end">${date}</text>
        `;
    });

    // 2. 수직선 (4시간 단위 시간 격자선) 및 X축 시간 텍스트 생성 (0, 4, 8, 12, 16, 20, 24시)
    let xLinesHtml = '';
    const hoursTicks = [0, 4, 8, 12, 16, 20, 24];
    hoursTicks.forEach(tick => {
        const xPos = getX(tick);
        xLinesHtml += `
            <!-- 세로 시간 격자 점선 -->
            <line x1="${xPos}" y1="${paddingTop}" x2="${xPos}" y2="${h - paddingBottom}" stroke="#EAECF0" stroke-width="1" stroke-dasharray="2, 2" />
            <!-- X축 시간 라벨 -->
            <text x="${xPos}" y="${h - 10}" font-size="10" font-weight="600" fill="#98A2B3" text-anchor="middle">${tick}시</text>
        `;
    });

    // 3. 점안 기록 포인터 드로잉 (이력 상태 데이터 기반)
    let pointsHtml = '';
    appState.historyRecords.forEach(rec => {
        // 기록의 날짜 정보 매핑 (예: "2023-12-14" -> "12/14")
        const recordDateShort = rec.date.substring(5).replace('-', '/');
        const dateIdx = dates.indexOf(recordDateShort);
        
        if (dateIdx === -1) return; // 범위 밖 날짜 무시

        const xPos = getX(rec.hour);
        const yPos = getY(dateIdx);

        // 점안 완료(taken: true) -> 보라색 채워진 원형 도트
        // 미점안(taken: false) -> 속이 빈 보라색 테두리 원형 도트
        if (rec.taken) {
            pointsHtml += `
                <circle class="compliance-chart-dot" data-id="${rec.id}" cx="${xPos}" cy="${yPos}" r="6.5" fill="#6E53FF" stroke="#FFFFFF" stroke-width="1.5" style="cursor:pointer;" />
            `;
        } else {
            pointsHtml += `
                <circle class="compliance-chart-dot" data-id="${rec.id}" cx="${xPos}" cy="${yPos}" r="6.5" fill="#FFFFFF" stroke="#6E53FF" stroke-width="2" style="cursor:pointer;" />
            `;
        }
    });

    // 전체 SVG 조합 주입
    wrapper.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%">
            <!-- X축 시간 점선 및 텍스트 -->
            ${xLinesHtml}
            
            <!-- Y축 가로선 및 일자 텍스트 -->
            ${yLinesHtml}
            
            <!-- 점안 완료 / 미점안 도트 플롯 -->
            ${pointsHtml}
        </svg>
    `;

    // 차트 포인트 클릭 시 [점안결과] 상세 팝업 모달 연동
    document.querySelectorAll('.compliance-chart-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const id = parseInt(dot.getAttribute('data-id'));
            openResultDetailPopup(id);
        });
    });
}

// ==========================================
// 6. [점안결과] 상세 모달 팝업 액션 제어 (신규)
// ==========================================
function openResultDetailPopup(recordId) {
    const record = appState.historyRecords.find(r => r.id === recordId);
    if (!record) return;

    appState.activeEditingRecordId = record.id;

    // 모달 폼 바인딩
    document.getElementById('result-taken-check').checked = record.taken;
    document.getElementById('result-date').value = record.date;
    document.getElementById('result-time').value = record.time;
    document.getElementById('result-device').value = record.device;
    document.getElementById('result-med').value = record.medName;

    // 팝업 표시
    const popup = document.getElementById('result-detail-popup');
    popup.classList.add('active');
}

function closeResultDetailPopup() {
    const popup = document.getElementById('result-detail-popup');
    popup.classList.remove('active');
    appState.activeEditingRecordId = null;
}

// ==========================================
// 7. 알림 편집 모드 상세 제어 (Page 4)
// ==========================================
function loadAlarmForEdit(alarmId) {
    const alarm = appState.alarms.find(a => a.id === parseInt(alarmId));
    if (!alarm) return;

    appState.currentEditingAlarmId = alarm.id;

    document.getElementById('edit-alarm-name').value = alarm.medName;
    document.getElementById('edit-alarm-dose').value = alarm.dose;
    document.getElementById('edit-alarm-time').value = alarm.time;
    document.getElementById('display-time-val').textContent = alarm.time;
    document.getElementById('edit-alarm-everyday').checked = alarm.everyday;

    // 요일 버튼 활성화
    const dayButtons = document.querySelectorAll('.day-btn');
    dayButtons.forEach(btn => {
        const dayVal = parseInt(btn.getAttribute('data-day'));
        if (alarm.days.includes(dayVal)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 알림방법 다중 활성화 설정
    setAlertMethodsUI(alarm.method);

    navigateTo('page-alarm-detail');
}

// 다중 선택 상태를 UI에 반영
function setAlertMethodsUI(methodsArr) {
    const btnSound = document.getElementById('alert-method-sound');
    const btnVibe = document.getElementById('alert-method-vibe');

    btnSound.classList.remove('active');
    btnVibe.classList.remove('active');

    if (methodsArr.includes('sound')) btnSound.classList.add('active');
    if (methodsArr.includes('vibe')) btnVibe.classList.add('active');
}

// ==========================================
// 8. 점안 알림 발생 및 시뮬레이션 (Page 1)
// ==========================================
function triggerAlarmPopup(medName, dose, timeStr, methodsArr) {
    const popup = document.getElementById('alarm-popup');
    const phoneMockup = document.querySelector('.phone-mockup');

    document.getElementById('popup-med').textContent = medName;
    document.getElementById('popup-dose').textContent = dose + '회';
    document.getElementById('popup-time').textContent = formatTime12h(timeStr);

    appState.activeAlarmTemp = { medName, dose, methodsArr };
    popup.classList.add('active');
    updateDemoNavButtons('popup');

    // [신규] 소리와 진동 동시 설정 가능 여부에 따른 처리
    const hasSound = methodsArr.includes('sound');
    const hasVibe = methodsArr.includes('vibe');

    if (hasVibe) {
        phoneMockup.classList.add('vibrate-effect');
    }
    if (hasSound) {
        playAlarmSound();
    }
}

// 팝업 닫기 시 실시간 신규 이력 추가
function closeAlarmPopup() {
    const popup = document.getElementById('alarm-popup');
    const phoneMockup = document.querySelector('.phone-mockup');
    
    popup.classList.remove('active');
    phoneMockup.classList.remove('vibrate-effect');
    stopAlarmSound();

    if (appState.activeAlarmTemp) {
        const info = appState.activeAlarmTemp;
        const now = new Date();
        
        const yyyy = now.getFullYear();
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const hh = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const timeStr = `${hh}:${min}:${ss}`;
        const hourDecimal = now.getHours() + (now.getMinutes() / 60);

        // 신규 이력 추가 (기본 완료 상태)
        const nextId = appState.historyRecords.length > 0 ? Math.max(...appState.historyRecords.map(r => r.id)) + 1 : 1;
        const newRecord = {
            id: nextId,
            date: dateStr,
            time: timeStr,
            hour: hourDecimal,
            medName: info.medName,
            dose: info.dose,
            device: "기기1",
            taken: true
        };
        appState.historyRecords.unshift(newRecord);
        appState.activeAlarmTemp = null;
        
        alert(`점안이 기록되었습니다.\n[점안 기록] 페이지 및 [준수 현황] 그래프에 실시간 동기화되었습니다.`);
    }
    
    navigateTo(appState.activePage);
}

function playAlarmSound() {
    try {
        if (!appState.audioContext) {
            appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = appState.audioContext;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        let toggle = true;
        appState.audioIntervalId = setInterval(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(toggle ? 880 : 660, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
            
            toggle = !toggle;
        }, 600);
    } catch (e) {
        console.warn("오디오 신디사이저 재생 실패", e);
    }
}

function stopAlarmSound() {
    if (appState.audioIntervalId) {
        clearInterval(appState.audioIntervalId);
        appState.audioIntervalId = null;
    }
}

// ==========================================
// 9. 블루투스 및 바코드/QR 시뮬레이션
// ==========================================
function startBluetoothConnection() {
    const strip = document.getElementById('device-status-strip');
    const dot = strip.querySelector('.status-dot');
    const txt = strip.querySelector('.status-text');
    const btn = document.getElementById('sim-btn-bluetooth');

    appState.bluetoothStatus = "connecting";
    dot.className = "status-dot connecting";
    txt.textContent = "스마트 안압계 연결 중...";
    btn.disabled = true;
    btn.textContent = "연결 중...";

    setTimeout(() => {
        appState.bluetoothStatus = "connected";
        dot.className = "status-dot connected";
        txt.textContent = "IDROP 안압계가 연결되었습니다 (배터리 85%)";
        btn.disabled = false;
        btn.textContent = "연결 해제";
        
        const connectCard = document.getElementById('btn-to-connect');
        connectCard.style.borderColor = "var(--blue-main)";
        connectCard.style.boxShadow = "0 0 15px rgba(59, 130, 246, 0.4)";
    }, 2000);
}

function disconnectBluetooth() {
    const strip = document.getElementById('device-status-strip');
    const dot = strip.querySelector('.status-dot');
    const txt = strip.querySelector('.status-text');
    const btn = document.getElementById('sim-btn-bluetooth');
    
    appState.bluetoothStatus = "disconnected";
    dot.className = "status-dot disconnected";
    txt.textContent = "연결된 기기 없음";
    btn.textContent = "연결 시작";
    
    const connectCard = document.getElementById('btn-to-connect');
    connectCard.style.borderColor = "";
    connectCard.style.boxShadow = "";
}

function triggerScanner(callback) {
    const overlay = document.getElementById('scanner-overlay');
    overlay.classList.add('active');
    setTimeout(() => {
        overlay.classList.remove('active');
        if (callback) callback();
    }, 2200);
}

// ==========================================
// 10. 유틸리티 및 시간 포맷터
// ==========================================
function formatTime12h(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${ampm} ${displayHours}:${displayMinutes}`;
}

function formatDaysKor(daysArr) {
    if (!daysArr || daysArr.length === 0) return '없음';
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return daysArr.sort((a, b) => a - b).map(d => dayNames[d]).join(', ');
}

function initRealTimeClock() {
    const timeDisplay = document.getElementById('current-time');
    function updateClock() {
        const now = new Date();
        const hrs = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        timeDisplay.textContent = `${hrs}:${mins}`;
    }
    updateClock();
    setInterval(updateClock, 30000);
}

// ==========================================
// 11. 이벤트 리스너 통합 바인딩
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    initRealTimeClock();
    
    renderMedicineList();
    renderAlarmList();
    renderHistoryList();

    // ------------------------------------------
    // [신규] 지정 안약 정보 Note 요약 자동 입력 리스너 (Page 2)
    // ------------------------------------------
    document.getElementById('medicine-list-container').addEventListener('click', (e) => {
        const medInfoGroup = e.target.closest('.med-info-group');
        if (medInfoGroup) {
            const medName = medInfoGroup.getAttribute('data-name');
            const noteTextarea = document.getElementById('med-notes');
            
            if (noteTextarea) {
                // 정보 사전 맵에서 조회
                const summary = medDictionary[medName] || `제품명: ${medName}\n(기본 의약정보 요약이 존재하지 않습니다. 처방 용법에 맞춰 추가 기재해 주십시오.)`;
                noteTextarea.value = summary;
                
                // 시각적 강조 효과
                noteTextarea.style.backgroundColor = "#F4F3FF";
                setTimeout(() => {
                    noteTextarea.style.backgroundColor = "transparent";
                }, 500);
            }
        }
    });
    
    // ------------------------------------------
    // [신규] 매일 체크박스 - 요일 일괄 체크 연동 리스너 (Page 4)
    // ------------------------------------------
    const everydayCheck = document.getElementById('edit-alarm-everyday');
    everydayCheck.addEventListener('change', () => {
        const isChecked = everydayCheck.checked;
        const dayButtons = document.querySelectorAll('.day-btn');
        
        dayButtons.forEach(btn => {
            if (isChecked) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    });

    // 개별 요일 버튼 클릭 시 매일 상태 실시간 감지 연동
    const dayButtons = document.querySelectorAll('.day-btn');
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            
            // 7개 요일이 모두 활성인지 검사
            const activeDaysCount = document.querySelectorAll('.day-btn.active').length;
            if (activeDaysCount === 7) {
                everydayCheck.checked = true;
            } else {
                everydayCheck.checked = false;
            }
        });
    });

    // ------------------------------------------
    // [신규] 알림방법 다중 선택 리스너 (Page 4)
    // ------------------------------------------
    document.getElementById('alert-method-sound').addEventListener('click', (e) => {
        e.target.classList.toggle('active');
    });
    document.getElementById('alert-method-vibe').addEventListener('click', (e) => {
        e.target.classList.toggle('active');
    });

    // ------------------------------------------
    // [신규] 알림 목록 클릭 시 상단 배너 시간 즉시 갱신 (Page 3)
    // ------------------------------------------
    document.getElementById('alarm-sub-list-container').addEventListener('click', (e) => {
        const item = e.target.closest('.alarm-sub-item');
        if (item && !e.target.classList.contains('btn-edit-alarm')) {
            const id = parseInt(item.getAttribute('data-id'));
            const alarm = appState.alarms.find(a => a.id === id);
            if (alarm) {
                updateAlarmBanner(alarm);
                
                // 클릭 효과 부여
                item.style.backgroundColor = "#E6E4F9";
                setTimeout(() => {
                    item.style.backgroundColor = "#FCFCFD";
                }, 300);
            }
        }
    });

    // ------------------------------------------
    // [신규] 점안 기록 화면(Page 6) 리스트 클릭 시 [점안결과] 상세 팝업 연결
    // ------------------------------------------
    document.getElementById('history-record-container').addEventListener('click', (e) => {
        const item = e.target.closest('.history-record-item');
        if (item) {
            const id = parseInt(item.getAttribute('data-id'));
            openResultDetailPopup(id);
        }
    });

    // ------------------------------------------
    // [신규] [점안결과] 상세 팝업 액션 바인딩
    // ------------------------------------------
    
    // [저장]
    document.getElementById('btn-result-save').addEventListener('click', () => {
        if (!appState.activeEditingRecordId) return;
        
        const rec = appState.historyRecords.find(r => r.id === appState.activeEditingRecordId);
        if (!rec) return;

        // 수정 데이터 수집 및 폼 검증
        rec.taken = document.getElementById('result-taken-check').checked;
        rec.date = document.getElementById('result-date').value.trim();
        rec.time = document.getElementById('result-time').value.trim();
        rec.device = document.getElementById('result-device').value.trim();
        rec.medName = document.getElementById('result-med').value.trim();

        // 24시간 도트 플롯을 위해 hour 재연산
        const [h, m] = rec.time.split(':').map(Number);
        if (!isNaN(h)) {
            rec.hour = h + (isNaN(m) ? 0 : m / 60);
        }

        // 목록, 차트, 통계 갱신 및 닫기
        renderHistoryList();
        renderComplianceChart();
        renderComplianceStats();
        closeResultDetailPopup();
        
        alert("점안 결과 정보가 성공적으로 업데이트되었습니다.");
    });

    // [삭제]
    document.getElementById('btn-result-delete').addEventListener('click', () => {
        if (!appState.activeEditingRecordId) return;
        
        if (confirm("이 점안 기록을 정말로 삭제하시겠습니까?")) {
            appState.historyRecords = appState.historyRecords.filter(r => r.id !== appState.activeEditingRecordId);
            
            renderHistoryList();
            renderComplianceChart();
            renderComplianceStats();
            closeResultDetailPopup();
            
            alert("해당 기록이 성공적으로 삭제되었습니다.");
        }
    });

    // [취소]
    document.getElementById('btn-result-cancel').addEventListener('click', () => {
        closeResultDetailPopup();
    });

    // ------------------------------------------
    // 앱 전반 네비게이션
    // ------------------------------------------
    document.getElementById('btn-to-manage').addEventListener('click', () => {
        navigateTo('page-medicine');
    });

    document.getElementById('btn-to-connect').addEventListener('click', () => {
        if (appState.bluetoothStatus === "disconnected") {
            startBluetoothConnection();
        } else {
            disconnectBluetooth();
        }
    });

    document.getElementById('btn-to-history').addEventListener('click', () => {
        navigateTo('page-history-list');
    });

    document.getElementById('btn-to-compliance').addEventListener('click', () => {
        navigateTo('page-compliance');
    });

    document.getElementById('btn-to-send').addEventListener('click', () => {
        alert("점안 이력 및 안압 트렌드 데이터가 안과 주치의에게 안전하게 전송되었습니다.");
    });

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            navigateTo(target);
        });
    });

    // ------------------------------------------
    // 안약 관리 (Page 2) 기본 액션
    // ------------------------------------------
    const medSelect = document.getElementById('med-select');
    const medInput = document.getElementById('med-input');
    
    medSelect.addEventListener('change', () => {
        if (medSelect.value === "직접 입력") {
            medInput.classList.remove('hidden');
            medInput.focus();
        } else {
            medInput.classList.add('hidden');
        }
    });

    document.getElementById('btn-add-medicine').addEventListener('click', () => {
        let name = "";
        if (medSelect.value === "직접 입력") {
            name = medInput.value.trim();
        } else {
            name = medSelect.value;
        }

        if (!name) {
            alert("등록할 안약명을 입력하거나 선택해주세요.");
            return;
        }

        const newId = appState.medicines.length > 0 ? Math.max(...appState.medicines.map(m => m.id)) + 1 : 1;
        appState.medicines.push({ id: newId, name: name });
        
        medInput.value = "";
        medSelect.selectedIndex = 0;
        medInput.classList.add('hidden');

        renderMedicineList();
        alert(`"${name}"이(가) 지정 안약으로 등록되었습니다.`);
    });

    document.getElementById('btn-qr-scan').addEventListener('click', () => {
        triggerScanner(() => {
            medSelect.value = "직접 입력";
            medInput.classList.remove('hidden');
            medInput.value = "오클라에스 점안액 (QR인식)";
            alert("QR코드를 분석하여 의약품명이 자동 입력되었습니다.");
        });
    });

    // 목록 위임 핸들러 (수정, [신규] 종속성 삭제, 알림설정 바로가기)
    document.getElementById('medicine-list-container').addEventListener('click', (e) => {
        const target = e.target;
        
        // [신규] 지정 안약 삭제 시 연동된 모든 알림 설정 자동 정리 (Cascade Delete)
        if (target.classList.contains('btn-delete')) {
            const id = parseInt(target.getAttribute('data-id'));
            const name = target.getAttribute('data-name');
            
            if (confirm(`"${name}" 안약을 삭제하시겠습니까?\n주의: 해당 안약과 연결된 모든 [알림 설정]도 함께 일괄 삭제됩니다.`)) {
                // 1. 안약 제거
                appState.medicines = appState.medicines.filter(m => m.id !== id);
                
                // 2. 연동 알림 카운트 측정 및 일괄 삭제
                const beforeCount = appState.alarms.length;
                appState.alarms = appState.alarms.filter(a => a.medName !== name);
                const afterCount = appState.alarms.length;
                const removedCount = beforeCount - afterCount;
                
                // 3. 재렌더링
                renderMedicineList();
                renderAlarmList();
                
                // 4. 피드백 노출
                if (removedCount > 0) {
                    alert(`"${name}" 안약이 삭제되었으며, 연동되어 있던 알림 설정 ${removedCount}건이 함께 정리되었습니다.`);
                } else {
                    alert(`"${name}" 안약이 성공적으로 삭제되었습니다.`);
                }
            }
        } 
        else if (target.classList.contains('btn-edit')) {
            const id = parseInt(target.getAttribute('data-id'));
            const med = appState.medicines.find(m => m.id === id);
            const oldName = med.name;
            const newName = prompt("안약 이름을 수정하세요:", med.name);
            
            if (newName && newName.trim()) {
                const trimmedName = newName.trim();
                med.name = trimmedName;
                
                // 알림 설정의 연동명도 같이 수정
                appState.alarms.forEach(a => {
                    if (a.medName === oldName) a.medName = trimmedName;
                });

                renderMedicineList();
                renderAlarmList();
            }
        } 
        else if (target.classList.contains('btn-setup-alarm')) {
            const name = target.getAttribute('data-name');
            appState.selectedMedicineForAlarm = name;
            navigateTo('page-alarm-list');
            const alarmSelect = document.getElementById('alarm-med-select');
            if (alarmSelect) alarmSelect.value = name;
        }
    });

    // ------------------------------------------
    // 알림 설정 목록 (Page 3) 기본 액션
    // ------------------------------------------
    document.getElementById('btn-barcode-scan').addEventListener('click', () => {
        triggerScanner(() => {
            alert("바코드를 스캔하여 안약 정보를 연동했습니다.");
        });
    });

    document.getElementById('btn-quick-save-alarm').addEventListener('click', () => {
        const medName = document.getElementById('alarm-med-select').value;
        const dose = parseInt(document.getElementById('alarm-dose-input').value) || 1;
        
        if (!medName) {
            alert("안약을 먼저 등록하고 선택해주세요.");
            return;
        }

        const newId = appState.alarms.length > 0 ? Math.max(...appState.alarms.map(a => a.id)) + 1 : 1;
        const newAlarm = {
            id: newId,
            medName: medName,
            dose: dose,
            time: "11:00",
            everyday: false,
            days: [1, 3, 5],
            method: ["sound"]
        };

        appState.alarms.push(newAlarm);
        renderAlarmList();
        alert(`"${medName}"에 대한 오전 11:00(월,수,금) 알림이 추가되었습니다.\n하단 리스트의 [수정] 버튼을 클릭해 알림 시각과 요일을 상세 편집할 수 있습니다.`);
    });

    document.getElementById('alarm-sub-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edit-alarm')) {
            const id = e.target.getAttribute('data-id');
            loadAlarmForEdit(id);
        }
    });

    // ------------------------------------------
    // 알림 상세/수정 (Page 4) 저장 제어
    // ------------------------------------------
    document.getElementById('btn-save-alarm-detail').addEventListener('click', () => {
        if (!appState.currentEditingAlarmId) return;
        
        const alarm = appState.alarms.find(a => a.id === appState.currentEditingAlarmId);
        if (!alarm) return;

        alarm.medName = document.getElementById('edit-alarm-name').value.trim() || alarm.medName;
        alarm.dose = parseInt(document.getElementById('edit-alarm-dose').value) || 1;
        alarm.time = document.getElementById('edit-alarm-time').value;
        alarm.everyday = document.getElementById('edit-alarm-everyday').checked;

        const selectedDays = [];
        document.querySelectorAll('.day-btn.active').forEach(btn => {
            selectedDays.push(parseInt(btn.getAttribute('data-day')));
        });
        alarm.days = selectedDays;

        // [신규] 소리, 진동 다중 선택 수집
        const activeMethods = [];
        if (document.getElementById('alert-method-sound').classList.contains('active')) activeMethods.push('sound');
        if (document.getElementById('alert-method-vibe').classList.contains('active')) activeMethods.push('vibe');
        alarm.method = activeMethods;

        renderAlarmList();
        alert("알림 설정 정보가 반영되었습니다.");
        navigateTo('page-alarm-list');
    });

    // ------------------------------------------
    // 점안 준수 날짜 조절 시뮬레이터 (Page 7)
    // ------------------------------------------
    document.getElementById('btn-prev-date-range').addEventListener('click', () => {
        document.getElementById('txt-date-range').textContent = "[2023/12/1] ~ [2023/12/7]";
        appState.compliancePoints = [
            { date: "12/1", val: 8 },
            { date: "12/2", val: 12 },
            { date: "12/3", val: 6 },
            { date: "12/4", val: 15 },
            { date: "12/5", val: 10 },
            { date: "12/6", val: 17 },
            { date: "12/7", val: 14 }
        ];
        renderComplianceChart();
        renderComplianceStats();
    });

    document.getElementById('btn-next-date-range').addEventListener('click', () => {
        document.getElementById('txt-date-range').textContent = "[2023/12/8] ~ [2023/12/14]";
        renderComplianceChart();
        renderComplianceStats();
    });

    // ------------------------------------------
    // 우측 데모 내비게이터 바인딩
    // ------------------------------------------
    document.querySelectorAll('.demo-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            if (pageId === "popup") {
                triggerAlarmPopup("오클라에스 점안액", 1, "23:33", ["sound", "vibe"]);
            } else {
                document.getElementById('alarm-popup').classList.remove('active');
                closeResultDetailPopup();
                navigateTo(pageId);
            }
        });
    });

    document.getElementById('sim-btn-bluetooth').addEventListener('click', () => {
        if (appState.bluetoothStatus === "disconnected") {
            startBluetoothConnection();
        } else {
            disconnectBluetooth();
        }
    });

    document.getElementById('sim-btn-alarm-trigger').addEventListener('click', (e) => {
        const btn = e.target;
        btn.disabled = true;
        let sec = 3;
        btn.textContent = `발생 ${sec}초 전...`;
        
        const cntInterval = setInterval(() => {
            sec--;
            if (sec > 0) {
                btn.textContent = `발생 ${sec}초 전...`;
            } else {
                clearInterval(cntInterval);
                btn.disabled = false;
                btn.textContent = "예약 알림 테스트";
                triggerAlarmPopup("오클라에스 점안액", 1, "23:33", ["sound", "vibe"]);
            }
        }, 1000);
    });

    document.getElementById('sim-btn-reset').addEventListener('click', () => {
        if (confirm("모든 입력을 초기 상태로 리셋하시겠습니까?")) {
            appState.medicines = JSON.parse(INITIAL_MEDICINES);
            appState.alarms = JSON.parse(INITIAL_ALARMS);
            appState.historyRecords = JSON.parse(INITIAL_HISTORY);
            
            disconnectBluetooth();
            document.getElementById('txt-date-range').textContent = "[2023/12/8] ~ [2023/12/14]";
            const noteTextarea = document.getElementById('med-notes');
            if (noteTextarea) noteTextarea.value = "";
            
            renderMedicineList();
            renderAlarmList();
            renderHistoryList();
            
            navigateTo('page-home');
            alert("초기 데이터 상태로 복원되었습니다.");
        }
    });

});
