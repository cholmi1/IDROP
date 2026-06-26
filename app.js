// IDROPM 애플리케이션 상태 및 동작 제어 스크립트

// ==========================================
// 1. 애플리케이션 상태 (State)
// ==========================================
const appState = {
    // 안약 목록 (초기 데이터는 이미지 2 기준)
    medicines: [
        { id: 1, name: "오클라에스 점안액" },
        { id: 2, name: "리프레쉬 플러스" },
        { id: 3, name: "리프레쉬 플러스" }
    ],
    // 알림 설정 목록 (초기 데이터는 이미지 3, 4 기준)
    alarms: [
        {
            id: 1,
            medName: "A 안약",
            dose: 1,
            time: "11:00",
            everyday: false,
            days: [1, 3, 5], // 월, 수, 금
            method: "sound"
        },
        {
            id: 2,
            medName: "B 안약",
            dose: 1,
            time: "10:00",
            everyday: true,
            days: [0, 1, 2, 3, 4, 5, 6], // 매일
            method: "sound"
        }
    ],
    // 점안 이력 기록 (이미지 6 기준 더미 데이터 8개로 초기화)
    historyRecords: [
        { id: 1, timeStr: "2023-12-14 12:20:00", medName: "A 안약", dose: 1 },
        { id: 2, timeStr: "2023-12-14 12:20:00", medName: "A 안약", dose: 1 },
        { id: 3, timeStr: "2023-12-14 12:20:00", medName: "A 안약", dose: 1 },
        { id: 4, timeStr: "2023-12-14 12:20:00", medName: "A 안약", dose: 1 },
        { id: 5, timeStr: "2023-12-14 12:20:00", medName: "A 안약", dose: 1 },
        { id: 6, timeStr: "2023-12-14 12:20:00", medName: "A 안약", dose: 1 },
        { id: 7, timeStr: "2023-12-14 12:20:00", medName: "A 안약", dose: 1 },
        { id: 8, timeStr: "2023-12-14 12:20:00", medName: "A 안약", dose: 1 }
    ],
    // 기본 누적 기록 시작 개수 (이미지 6에 표기된 총 2,000건 기준 시뮬레이션용)
    baseHistoryCount: 2000,
    
    // 점안 준수 통계 데이터 (이미지 7 그래프용 12/8 ~ 12/14)
    compliancePoints: [
        { date: "12/8", val: 5 },
        { date: "12/9", val: 14 },
        { date: "12/10", val: 5 },
        { date: "12/11", val: 11 },
        { date: "12/12", val: 18.5 },
        { date: "12/13", val: 11 },
        { date: "12/14", val: 18 }
    ],
    // 준수율 세부 수치 (점안/미점안 수)
    complianceStats: {
        taken: 19,
        missed: 1
    },

    // UI 제어 상태
    activePage: "page-home",
    selectedMedicineForAlarm: null,
    currentEditingAlarmId: null,
    bluetoothStatus: "disconnected", // disconnected, connecting, connected
    
    // 알림 팝업 정보 임시 보관
    activeAlarmTemp: null,

    // 오디오 컨텍스트
    audioContext: null,
    audioIntervalId: null
};

// ==========================================
// 2. 초기 데이터 백업 (리셋용)
// ==========================================
const INITIAL_MEDICINES = JSON.stringify(appState.medicines);
const INITIAL_ALARMS = JSON.stringify(appState.alarms);
const INITIAL_HISTORY = JSON.stringify(appState.historyRecords);
const INITIAL_STATS = JSON.stringify(appState.complianceStats);
const INITIAL_POINTS = JSON.stringify(appState.compliancePoints);

// ==========================================
// 3. 페이지 내비게이션 (SPA 라우팅)
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

    // 우측 데모 가이드 활성 상태 동기화
    updateDemoNavButtons(pageId);
    
    // 페이지 진입 시 동적 데이터 갱신
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
// 4. 컴포넌트 렌더링 로직
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
            <div class="med-info-group">
                <span class="med-num">${index + 1}</span>
                <span class="med-name">${med.name}</span>
            </div>
            <div class="med-actions-group">
                <button class="med-btn btn-edit" data-id="${med.id}">수정</button>
                <button class="med-btn btn-delete" data-id="${med.id}">삭제</button>
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
            alarmMedSelect.innerHTML = '<option value="" disabled selected>등록된 안약 없음</option>';
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
    const bannerTime = document.getElementById('banner-time');
    const bannerDays = document.getElementById('banner-days');

    if (!subListContainer) return;
    subListContainer.innerHTML = '';

    if (appState.alarms.length > 0) {
        const mainAlarm = appState.alarms[0];
        bannerTime.textContent = formatTime12h(mainAlarm.time);
        bannerDays.textContent = mainAlarm.everyday ? '요일 - 매일' : `요일 - ${formatDaysKor(mainAlarm.days)}`;
    } else {
        bannerTime.textContent = "알림 없음";
        bannerDays.textContent = "새 알림을 등록해주세요";
    }

    appState.alarms.forEach((alarm, index) => {
        const li = document.createElement('li');
        li.className = 'alarm-sub-item';
        let displayName = alarm.medName;
        if (displayName.length > 6) {
            displayName = displayName.substring(0, 5) + '...';
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

// [신규] 점안 기록 이력 목록 (Page 6) 렌더링
function renderHistoryList() {
    const recordContainer = document.getElementById('history-record-container');
    const totalBadge = document.getElementById('history-total-badge');
    
    if (!recordContainer) return;
    recordContainer.innerHTML = '';

    // 총 기록 개수 표기 (누적 총합 시뮬레이션)
    const totalCount = appState.baseHistoryCount + (appState.historyRecords.length - 8);
    if (totalBadge) {
        totalBadge.textContent = `총 ${totalCount.toLocaleString()}건 P. 1`;
    }

    appState.historyRecords.forEach(rec => {
        const li = document.createElement('li');
        li.className = 'history-record-item';
        li.innerHTML = `
            <span class="history-item-time">${rec.timeStr}</span>
            <span class="history-item-detail">${rec.medName} ${rec.dose}회</span>
        `;
        recordContainer.appendChild(li);
    });
}

// [신규] 점안 준수 통계 요약 (Page 7)
function renderComplianceStats() {
    const txtRate = document.getElementById('txt-compliance-rate');
    const txtCounts = document.getElementById('txt-compliance-counts');
    
    if (!txtRate || !txtCounts) return;

    const taken = appState.complianceStats.taken;
    const missed = appState.complianceStats.missed;
    const total = taken + missed;
    
    const rate = total > 0 ? Math.round((taken / total) * 100) : 100;
    
    txtRate.textContent = `점안 준수율 ${rate}%`;
    txtCounts.textContent = `점안 ${taken}개 | 미점안 ${missed}개`;
}

// [신규] SVG 기반 고품질 라인 차트 동적 드로잉 (Page 7)
function renderComplianceChart() {
    const wrapper = document.getElementById('svg-chart-wrapper');
    if (!wrapper) return;

    const data = appState.compliancePoints;
    
    // 차트 크기 정의
    const w = 310;
    const h = 185;
    
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;
    
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;
    
    // Y축 범위 0 ~ 20
    const yMax = 20;
    
    // 좌표 보간 함수
    function getX(index) {
        return paddingLeft + (index / (data.length - 1)) * chartW;
    }
    function getY(val) {
        return h - paddingBottom - (val / yMax) * chartH;
    }

    // 1. 수평 가이드선 및 Y축 라벨 생성
    let yGridLines = '';
    const yTicks = [0, 5, 10, 15, 20];
    yTicks.forEach(tick => {
        const yPos = getY(tick);
        yGridLines += `
            <!-- 가이드선 -->
            <line x1="${paddingLeft}" y1="${yPos}" x2="${w - paddingRight}" y2="${yPos}" stroke="#EAECF0" stroke-width="1" />
            <!-- Y축 텍스트 -->
            <text x="${paddingLeft - 10}" y="${yPos + 4}" font-size="10" font-weight="600" fill="#98A2B3" text-anchor="end">${tick}</text>
        `;
    });

    // 2. X축 라벨 생성 (날짜)
    let xLabels = '';
    data.forEach((d, i) => {
        const xPos = getX(i);
        xLabels += `
            <text x="${xPos}" y="${h - 6}" font-size="10" font-weight="600" fill="#98A2B3" text-anchor="middle">${d.date}</text>
        `;
    });

    // 3. 차트 라인 패스 및 채우기 면 패스 좌표 산출
    let linePathD = '';
    let areaPathD = `M ${getX(0)} ${getY(0)} `; // 하단 좌측 시작

    data.forEach((d, i) => {
        const x = getX(i);
        const y = getY(d.val);
        
        if (i === 0) {
            linePathD += `M ${x} ${y} `;
            areaPathD = `M ${x} ${h - paddingBottom} L ${x} ${y} `;
        } else {
            linePathD += `L ${x} ${y} `;
            areaPathD += `L ${x} ${y} `;
        }
    });
    
    // 채우기 영역 마감
    areaPathD += `L ${getX(data.length - 1)} ${h - paddingBottom} Z`;

    // 4. 데이터 포인트 마크 원형 생성
    let dataPoints = '';
    data.forEach((d, i) => {
        const x = getX(i);
        const y = getY(d.val);
        
        // 이미지 7에서 12/8, 12/11, 12/14에 채워진 원형 포인트 강조 효과
        const isSpecialPoint = (i === 0 || i === 3 || i === 6);
        
        if (isSpecialPoint) {
            dataPoints += `
                <!-- 바깥 링 테두리 -->
                <circle cx="${x}" cy="${y}" r="6" fill="rgba(110, 83, 255, 0.25)" />
                <!-- 안쪽 핵심 원 -->
                <circle class="chart-pt" data-idx="${i}" cx="${x}" cy="${y}" r="4" fill="#6E53FF" stroke="#FFFFFF" stroke-width="1.5" style="cursor:pointer;" />
            `;
        } else {
            dataPoints += `
                <circle class="chart-pt" data-idx="${i}" cx="${x}" cy="${y}" r="3.5" fill="#6E53FF" stroke="#FFFFFF" stroke-width="1.2" style="cursor:pointer;" />
            `;
        }
    });

    // SVG 조립 및 렌더링
    wrapper.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%">
            <defs>
                <!-- 보라색 그라데이션 채우기 필터 -->
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#6E53FF" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#6E53FF" stop-opacity="0.0" />
                </linearGradient>
            </defs>
            
            <!-- Y축 가이드 라인 및 라벨 -->
            ${yGridLines}
            
            <!-- X축 텍스트 -->
            ${xLabels}
            
            <!-- 차트 영역 채우기 그라데이션 -->
            <path d="${areaPathD}" fill="url(#chart-area-grad)" />
            
            <!-- 차트 메인 보라 꺾은선 -->
            <path d="${linePathD}" fill="none" stroke="#6E53FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            
            <!-- 데이터 포인트 원들 -->
            ${dataPoints}
        </svg>
    `;
    
    // 차트 포인트 호버 시 수치 피드백 리스너 부착
    document.querySelectorAll('.chart-pt').forEach(circle => {
        circle.addEventListener('click', (e) => {
            const idx = parseInt(circle.getAttribute('data-idx'));
            const pt = data[idx];
            alert(`${pt.date} 기준 점안 수행 횟수: ${pt.val}회`);
        });
    });
}

// ==========================================
// 5. 알림 편집 모드 로드 및 저장 (Page 4)
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

    const dayButtons = document.querySelectorAll('.day-btn');
    dayButtons.forEach(btn => {
        const dayVal = parseInt(btn.getAttribute('data-day'));
        if (alarm.days.includes(dayVal)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    setAlertMethodUI(alarm.method);
    navigateTo('page-alarm-detail');
}

function setAlertMethodUI(method) {
    const btnSound = document.getElementById('alert-method-sound');
    const btnVibe = document.getElementById('alert-method-vibe');
    if (method === "sound") {
        btnSound.classList.add('active');
        btnVibe.classList.remove('active');
    } else {
        btnSound.classList.remove('active');
        btnVibe.classList.add('active');
    }
}

// ==========================================
// 6. 점안 알림 발생 및 시뮬레이션 (Page 1)
// ==========================================
function triggerAlarmPopup(medName, dose, timeStr, method) {
    const popup = document.getElementById('alarm-popup');
    const phoneMockup = document.querySelector('.phone-mockup');

    // 팝업 데이터 주입
    document.getElementById('popup-med').textContent = medName;
    document.getElementById('popup-dose').textContent = dose + '회';
    document.getElementById('popup-time').textContent = formatTime12h(timeStr);

    // 알림 시뮬레이션용 데이터 임시 바인딩
    appState.activeAlarmTemp = { medName, dose, method };

    popup.classList.add('active');
    updateDemoNavButtons('popup');

    if (method === "vibe") {
        phoneMockup.classList.add('vibrate-effect');
    } else {
        playAlarmSound();
    }
}

// 알림 모달 닫기 및 점안 이력 실시간 기록 누적
function closeAlarmPopup() {
    const popup = document.getElementById('alarm-popup');
    const phoneMockup = document.querySelector('.phone-mockup');
    
    popup.classList.remove('active');
    phoneMockup.classList.remove('vibrate-effect');
    
    stopAlarmSound();

    // [신규 인터랙션] 점안 완료 이력 누적 처리
    if (appState.activeAlarmTemp) {
        const info = appState.activeAlarmTemp;
        
        // 현재 로컬 시간 산출 (Format: YYYY-MM-DD HH:mm:ss)
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const hh = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        const timeStrFormatted = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

        // 이력 리스트의 가장 처음에 추가 (최신순 노출)
        const newRecord = {
            id: appState.historyRecords.length + 1,
            timeStr: timeStrFormatted,
            medName: info.medName,
            dose: info.dose
        };
        appState.historyRecords.unshift(newRecord);

        // 준수 통계 수치 갱신 (점안 완료 횟수 1 증가)
        appState.complianceStats.taken += 1;
        
        // 준수 그래프 오늘 데이터 1 증가 가상 연동
        if (appState.compliancePoints.length > 0) {
            const todayPoint = appState.compliancePoints[appState.compliancePoints.length - 1];
            todayPoint.val += 1;
        }

        appState.activeAlarmTemp = null;
        
        // 알림 메시지 노출
        alert(`점안이 성공적으로 기록되었습니다.\n[점안 기록] 페이지에서 최신 내역을 확인할 수 있습니다.`);
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
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
            
            toggle = !toggle;
        }, 600);
    } catch (e) {
        console.warn("AudioContext 재생에 실패했습니다.", e);
    }
}

function stopAlarmSound() {
    if (appState.audioIntervalId) {
        clearInterval(appState.audioIntervalId);
        appState.audioIntervalId = null;
    }
}

// ==========================================
// 7. 블루투스 기기 연결 시뮬레이션
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

// ==========================================
// 8. 스캔 시뮬레이션 이펙트
// ==========================================
function triggerScanner(callback) {
    const overlay = document.getElementById('scanner-overlay');
    overlay.classList.add('active');
    setTimeout(() => {
        overlay.classList.remove('active');
        if (callback) callback();
    }, 2200);
}

// ==========================================
// 9. 유틸리티 헬퍼 함수
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
// 10. 이벤트 바인딩 및 총괄 초기화
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    initRealTimeClock();
    
    renderMedicineList();
    renderAlarmList();
    renderHistoryList();
    
    // ------------------------------------------
    // 앱 내 네비게이션 연결 (뒤로가기, 탭 클릭 등)
    // ------------------------------------------
    
    // 메인 홈 -> 안약 관리
    document.getElementById('btn-to-manage').addEventListener('click', () => {
        navigateTo('page-medicine');
    });

    // 메인 홈 -> 기기 연결
    document.getElementById('btn-to-connect').addEventListener('click', () => {
        if (appState.bluetoothStatus === "disconnected") {
            startBluetoothConnection();
        } else {
            disconnectBluetooth();
        }
    });

    // [신규 연동] 메인 홈 -> 점안 기록 화면 (이동)
    document.getElementById('btn-to-history').addEventListener('click', () => {
        navigateTo('page-history-list');
    });

    // [신규 연동] 점안 기록 하단 -> 점안 준수 현황 (이동)
    document.getElementById('btn-to-compliance').addEventListener('click', () => {
        navigateTo('page-compliance');
    });

    // 메인 홈 -> 기록 전송
    document.getElementById('btn-to-send').addEventListener('click', () => {
        alert("점안 이력 및 안압 트렌드 데이터가 안과 주치의에게 안전하게 전송되었습니다.");
    });

    // 뒤로가기 버튼들 일괄 연동
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            navigateTo(target);
        });
    });

    // ------------------------------------------
    // 안약 관리 (Page 2) 이벤트
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

    document.getElementById('medicine-list-container').addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-delete')) {
            const id = parseInt(target.getAttribute('data-id'));
            appState.medicines = appState.medicines.filter(m => m.id !== id);
            renderMedicineList();
        } 
        else if (target.classList.contains('btn-edit')) {
            const id = parseInt(target.getAttribute('data-id'));
            const med = appState.medicines.find(m => m.id === id);
            const newName = prompt("안약 이름을 수정하세요:", med.name);
            if (newName && newName.trim()) {
                med.name = newName.trim();
                renderMedicineList();
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
    // 알림 설정 목록 (Page 3) 이벤트
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
            method: "sound"
        };

        appState.alarms.push(newAlarm);
        renderAlarmList();
        alert(`"${medName}"에 대한 오전 11:00(월,수,금) 알림이 추가되었습니다. 상세 일정은 하단 목록의 [수정]을 클릭해 주세요.`);
    });

    document.getElementById('alarm-sub-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edit-alarm')) {
            const id = e.target.getAttribute('data-id');
            loadAlarmForEdit(id);
        }
    });

    // ------------------------------------------
    // 알림 상세/수정 (Page 4) 이벤트
    // ------------------------------------------
    const timeInput = document.getElementById('edit-alarm-time');
    timeInput.addEventListener('input', () => {
        document.getElementById('display-time-val').textContent = timeInput.value;
    });

    const dayButtons = document.querySelectorAll('.day-btn');
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    document.getElementById('alert-method-sound').addEventListener('click', () => {
        setAlertMethodUI("sound");
    });
    document.getElementById('alert-method-vibe').addEventListener('click', () => {
        setAlertMethodUI("vibe");
    });

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

        const isSoundActive = document.getElementById('alert-method-sound').classList.contains('active');
        alarm.method = isSoundActive ? "sound" : "vibe";

        renderAlarmList();
        alert("알림 설정 정보가 저장되었습니다.");
        navigateTo('page-alarm-list');
    });

    document.getElementById('btn-cancel-alarm-detail').addEventListener('click', () => {
        navigateTo('page-alarm-list');
    });

    // ------------------------------------------
    // [화면 1] 알림 팝업 확인 완료
    // ------------------------------------------
    document.getElementById('btn-close-popup').addEventListener('click', () => {
        closeAlarmPopup();
    });

    // ------------------------------------------
    // [신규] 날짜 범위 조절 시뮬레이션 (Page 7)
    // ------------------------------------------
    document.getElementById('btn-prev-date-range').addEventListener('click', () => {
        document.getElementById('txt-date-range').textContent = "[2023/12/1] ~ [2023/12/7]";
        // 이전 주로 데이터 포인트 임의 스위칭
        appState.compliancePoints = [
            { date: "12/1", val: 8 },
            { date: "12/2", val: 12 },
            { date: "12/3", val: 6 },
            { date: "12/4", val: 15 },
            { date: "12/5", val: 10 },
            { date: "12/6", val: 17 },
            { date: "12/7", val: 14 }
        ];
        appState.complianceStats = { taken: 17, missed: 3 };
        renderComplianceChart();
        renderComplianceStats();
    });

    document.getElementById('btn-next-date-range').addEventListener('click', () => {
        document.getElementById('txt-date-range').textContent = "[2023/12/8] ~ [2023/12/14]";
        // 원상 복귀
        appState.compliancePoints = JSON.parse(INITIAL_POINTS);
        appState.complianceStats = JSON.parse(INITIAL_STATS);
        renderComplianceChart();
        renderComplianceStats();
    });

    // ------------------------------------------
    // 우측 데모 컨트롤러 이벤트 연동
    // ------------------------------------------
    document.querySelectorAll('.demo-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            
            if (pageId === "popup") {
                triggerAlarmPopup("A 안약", 1, "23:33", "sound");
            } else {
                document.getElementById('alarm-popup').classList.remove('active');
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
                
                // 이미지 1 기준 데이터로 알림 팝업 전송 (PM 11:33, A 안약, 1회)
                triggerAlarmPopup("A 안약", 1, "23:33", "sound");
            }
        }, 1000);
    });

    // 데모 데이터 리셋 (추가 화면 데이터도 초기화 대상)
    document.getElementById('sim-btn-reset').addEventListener('click', () => {
        if (confirm("모든 입력을 초기 상태로 리셋하시겠습니까?")) {
            appState.medicines = JSON.parse(INITIAL_MEDICINES);
            appState.alarms = JSON.parse(INITIAL_ALARMS);
            appState.historyRecords = JSON.parse(INITIAL_HISTORY);
            appState.complianceStats = JSON.parse(INITIAL_STATS);
            appState.compliancePoints = JSON.parse(INITIAL_POINTS);
            
            disconnectBluetooth();
            document.getElementById('txt-date-range').textContent = "[2023/12/8] ~ [2023/12/14]";
            
            renderMedicineList();
            renderAlarmList();
            renderHistoryList();
            
            navigateTo('page-home');
            alert("초기 데이터 상태로 정상 복원되었습니다.");
        }
    });

});
