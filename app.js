// IDROPM 애플리케이션 상태 및 동작 제어 스크립트

// ==========================================
// 1. 애플리케이션 상태 (State)
// ==========================================
const appState = {
    // 안약 목록 (초기 데이터는 이미지 2 기준 및 기본 안약)
    medicines: [
        { id: 1, name: "오클라에스 점안액" },
        { id: 2, name: "리프레쉬 플러스" },
        { id: 3, name: "리프레쉬 플러스" } // 중복 등록 가능 시뮬레이션
    ],
    // 알림 설정 목록 (초기 데이터는 이미지 3, 4 기준)
    alarms: [
        {
            id: 1,
            medName: "A 안약",
            dose: 1,
            time: "11:00",
            everyday: false,
            days: [1, 3, 5], // 월, 수, 금 (0:일, 1:월 ...)
            method: "sound" // sound or vibe
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
    // UI 상태
    activePage: "page-home",
    selectedMedicineForAlarm: null,
    currentEditingAlarmId: null,
    bluetoothStatus: "disconnected", // disconnected, connecting, connected
    
    // 오디오 컨텍스트 (알람 사운드 생성용)
    audioContext: null,
    audioIntervalId: null
};

// ==========================================
// 2. 초기 데이터 백업 (리셋용)
// ==========================================
const INITIAL_MEDICINES = JSON.stringify(appState.medicines);
const INITIAL_ALARMS = JSON.stringify(appState.alarms);

// ==========================================
// 3. 페이지 내비게이션 (SPA 라우팅)
// ==========================================
function navigateTo(pageId) {
    // 모든 페이지 비활성화
    const pages = document.querySelectorAll('.app-page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // 지정 페이지 활성화
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        appState.activePage = pageId;
    }

    // 우측 데모 내비게이터 버튼 활성 상태 동기화
    updateDemoNavButtons(pageId);
    
    // 페이지별 진입 시 추가 처리
    if (pageId === "page-medicine") {
        renderMedicineList();
    } else if (pageId === "page-alarm-list") {
        renderAlarmList();
    }
}

// 우측 컨트롤러의 네비게이션 버튼 상태 동기화
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

// 안약 관리 목록 (Page 2) 렌더링
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

    // 안약 선택 드롭다운 갱신 (Page 3용도 포함)
    updateMedicineDropdowns();
}

// 드롭다운 목록을 현재 등록된 안약 데이터와 연동
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

// 알림 목록 페이지 (Page 3) 렌더링
function renderAlarmList() {
    const subListContainer = document.getElementById('alarm-sub-list-container');
    const bannerTime = document.getElementById('banner-time');
    const bannerDays = document.getElementById('banner-days');

    if (!subListContainer) return;

    subListContainer.innerHTML = '';

    // 1. 대표 알림 배너 갱신 (첫 번째 알림을 대표로 설정)
    if (appState.alarms.length > 0) {
        const mainAlarm = appState.alarms[0];
        
        // 시간 포맷팅 (HH:MM -> AM/PM HH:MM)
        bannerTime.textContent = formatTime12h(mainAlarm.time);
        
        // 요일 텍스트 포맷팅
        bannerDays.textContent = mainAlarm.everyday ? '요일 - 매일' : `요일 - ${formatDaysKor(mainAlarm.days)}`;
    } else {
        bannerTime.textContent = "알림 없음";
        bannerDays.textContent = "새 알림을 등록해주세요";
    }

    // 2. 하단 리스트 렌더링 (약명: A... [수정])
    appState.alarms.forEach((alarm, index) => {
        const li = document.createElement('li');
        li.className = 'alarm-sub-item';
        
        // 약명 말줄임표 처리 (이미지처럼 "약명: A...")
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

// ==========================================
// 5. 알림 편집 모드 로드 및 저장 (Page 4)
// ==========================================
function loadAlarmForEdit(alarmId) {
    const alarm = appState.alarms.find(a => a.id === parseInt(alarmId));
    if (!alarm) return;

    appState.currentEditingAlarmId = alarm.id;

    // 폼 채우기
    document.getElementById('edit-alarm-name').value = alarm.medName;
    document.getElementById('edit-alarm-dose').value = alarm.dose;
    document.getElementById('edit-alarm-time').value = alarm.time;
    document.getElementById('display-time-val').textContent = alarm.time;
    document.getElementById('edit-alarm-everyday').checked = alarm.everyday;

    // 요일 활성화 리셋 및 설정
    const dayButtons = document.querySelectorAll('.day-btn');
    dayButtons.forEach(btn => {
        const dayVal = parseInt(btn.getAttribute('data-day'));
        if (alarm.days.includes(dayVal)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 알림방법 설정
    setAlertMethodUI(alarm.method);

    // Page 4로 이동
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

    // 데이터 삽입
    document.getElementById('popup-med').textContent = medName;
    document.getElementById('popup-dose').textContent = dose + '회';
    document.getElementById('popup-time').textContent = formatTime12h(timeStr);

    // 팝업 활성화
    popup.classList.add('active');
    
    // 우측 내비게이터에 1번 활성화
    updateDemoNavButtons('popup');

    // 알림 방법 시뮬레이션
    if (method === "vibe") {
        // 스마트폰 목업에 진동 애니메이션 추가
        phoneMockup.classList.add('vibrate-effect');
    } else {
        // 소리 재생 (Web Audio API 활용)
        playAlarmSound();
    }
}

function closeAlarmPopup() {
    const popup = document.getElementById('alarm-popup');
    const phoneMockup = document.querySelector('.phone-mockup');
    
    popup.classList.remove('active');
    phoneMockup.classList.remove('vibrate-effect');
    
    stopAlarmSound();
    
    // 알림이 닫히면 이전 활성화되어 있던 페이지로 내비게이터 동기화
    navigateTo(appState.activePage);
}

// 브라우저 신디사이저로 알림음 구현 (경고음 듀오톤 루프)
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
        
        // 0.8초 주기로 톤 소리 발생
        appState.audioIntervalId = setInterval(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // 이미지 1의 감각적인 보라색 벨에 매치되는 맑은 비프음 구현
            osc.type = 'sine';
            osc.frequency.setValueAtTime(toggle ? 880 : 660, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
            
            toggle = !toggle;
        }, 600);
    } catch (e) {
        console.warn("Audio Context가 지원되지 않거나 차단되었습니다.", e);
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
    
    // UI 업데이트
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
        
        // 홈 화면 아이콘 카드에 커스텀 불빛 효과 추가
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
// 8. 스캔 시뮬레이션 이펙트 (QR / 바코드)
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

// HH:MM 형식을 AM/PM HH:MM 형식으로 포맷팅 (이미지 1의 PM 11:33, 이미지 3의 AM 11:00 형태 매칭)
function formatTime12h(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${ampm} ${displayHours}:${displayMinutes}`;
}

// 요일 배열을 한국어 요일 리스트 텍스트로 변환 (월, 수, 금 형태)
function formatDaysKor(daysArr) {
    if (!daysArr || daysArr.length === 0) return '없음';
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    // 순서대로 정렬 후 한글 텍스트 조합
    return daysArr.sort((a, b) => a - b).map(d => dayNames[d]).join(', ');
}

// 실시간 시스템 시간 바인딩
function initRealTimeClock() {
    const timeDisplay = document.getElementById('current-time');
    
    function updateClock() {
        const now = new Date();
        const hrs = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        timeDisplay.textContent = `${hrs}:${mins}`;
    }
    
    updateClock();
    setInterval(updateClock, 30000); // 30초마다 업데이트
}

// ==========================================
// 10. 이벤트 바인딩 및 총괄 초기화
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 실시간 시간 구동
    initRealTimeClock();
    
    // 초기 렌더링
    renderMedicineList();
    renderAlarmList();
    
    // ------------------------------------------
    // 앱 내 네비게이션 연결 (뒤로가기, 탭 클릭 등)
    // ------------------------------------------
    
    // 메인 홈 -> 안약 관리
    document.getElementById('btn-to-manage').addEventListener('click', () => {
        navigateTo('page-medicine');
    });

    // 메인 홈 -> 기기 연결 (블루투스 단축 트리거)
    document.getElementById('btn-to-connect').addEventListener('click', () => {
        if (appState.bluetoothStatus === "disconnected") {
            startBluetoothConnection();
        } else {
            disconnectBluetooth();
        }
    });

    // 메인 홈 -> 기록 확인 및 기록 전송 (시각 효과)
    document.getElementById('btn-to-history').addEventListener('click', () => {
        alert("최근 7일간의 안압 기록이 정상 범위를 유지하고 있습니다.");
    });
    document.getElementById('btn-to-send').addEventListener('click', () => {
        alert("점안 이력 및 안압 트렌드 데이터가 안과 주치의에게 안전하게 전송되었습니다.");
    });

    // 뒤로가기 버튼들
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = btn.getAttribute('data-target');
            navigateTo(target);
        });
    });

    // ------------------------------------------
    // 안약 관리 (Page 2) 이벤트
    // ------------------------------------------
    const medSelect = document.getElementById('med-select');
    const medInput = document.getElementById('med-input');
    
    // 직접 입력 토글
    medSelect.addEventListener('change', () => {
        if (medSelect.value === "직접 입력") {
            medInput.classList.remove('hidden');
            medInput.focus();
        } else {
            medInput.classList.add('hidden');
        }
    });

    // [지정 안약 등록]
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
        
        // 초기화
        medInput.value = "";
        medSelect.selectedIndex = 0;
        medInput.classList.add('hidden');

        renderMedicineList();
        alert(`"${name}"이(가) 지정 안약으로 등록되었습니다.`);
    });

    // QR 스캔 시뮬레이션
    document.getElementById('btn-qr-scan').addEventListener('click', () => {
        triggerScanner(() => {
            medSelect.value = "직접 입력";
            medInput.classList.remove('hidden');
            medInput.value = "오클라에스 점안액 (QR인식)";
            alert("QR코드를 분석하여 의약품명이 자동 입력되었습니다.");
        });
    });

    // 목록 이벤트 위임 (삭제, 수정, 알림 설정)
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
            
            // Page 3로 이동하며 해당 약 자동 매칭
            navigateTo('page-alarm-list');
            const alarmSelect = document.getElementById('alarm-med-select');
            if (alarmSelect) alarmSelect.value = name;
        }
    });

    // ------------------------------------------
    // 알림 설정 목록 (Page 3) 이벤트
    // ------------------------------------------
    
    // 바코드 스캔 시뮬레이션
    document.getElementById('btn-barcode-scan').addEventListener('click', () => {
        triggerScanner(() => {
            alert("바코드를 스캔하여 안약 정보를 연동했습니다.");
        });
    });

    // 간편 알림 저장
    document.getElementById('btn-quick-save-alarm').addEventListener('click', () => {
        const medName = document.getElementById('alarm-med-select').value;
        const dose = parseInt(document.getElementById('alarm-dose-input').value) || 1;
        
        if (!medName) {
            alert("안약을 먼저 등록하고 선택해주세요.");
            return;
        }

        const newId = appState.alarms.length > 0 ? Math.max(...appState.alarms.map(a => a.id)) + 1 : 1;
        // 기본 11:00 AM 월수금 알림을 모델 예시로 생성
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

    // 알림 목록 수정 버튼 바인딩 (이벤트 위임)
    document.getElementById('alarm-sub-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edit-alarm')) {
            const id = e.target.getAttribute('data-id');
            loadAlarmForEdit(id);
        }
    });

    // ------------------------------------------
    // 알림 상세/수정 (Page 4) 이벤트
    // ------------------------------------------
    
    // 시간 입력 변화 감지
    const timeInput = document.getElementById('edit-alarm-time');
    timeInput.addEventListener('input', () => {
        document.getElementById('display-time-val').textContent = timeInput.value;
    });

    // 요일 토글 버튼
    const dayButtons = document.querySelectorAll('.day-btn');
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    // 알림 방법 (소리 / 진동) 토글
    document.getElementById('alert-method-sound').addEventListener('click', () => {
        setAlertMethodUI("sound");
    });
    document.getElementById('alert-method-vibe').addEventListener('click', () => {
        setAlertMethodUI("vibe");
    });

    // 상세 저장
    document.getElementById('btn-save-alarm-detail').addEventListener('click', () => {
        if (!appState.currentEditingAlarmId) return;
        
        const alarm = appState.alarms.find(a => a.id === appState.currentEditingAlarmId);
        if (!alarm) return;

        // 수정 값 수집
        alarm.medName = document.getElementById('edit-alarm-name').value.trim() || alarm.medName;
        alarm.dose = parseInt(document.getElementById('edit-alarm-dose').value) || 1;
        alarm.time = document.getElementById('edit-alarm-time').value;
        alarm.everyday = document.getElementById('edit-alarm-everyday').checked;

        // 선택된 요일 값 수집
        const selectedDays = [];
        document.querySelectorAll('.day-btn.active').forEach(btn => {
            selectedDays.push(parseInt(btn.getAttribute('data-day')));
        });
        alarm.days = selectedDays;

        // 알림 방법 수집
        const isSoundActive = document.getElementById('alert-method-sound').classList.contains('active');
        alarm.method = isSoundActive ? "sound" : "vibe";

        // 반영 후 복귀
        renderAlarmList();
        alert("알림 설정 정보가 저장되었습니다.");
        navigateTo('page-alarm-list');
    });

    // 상세 취소
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
    // 우측 데모 컨트롤러 이벤트 연동
    // ------------------------------------------
    
    // 순번 페이지 탐색 버튼들
    document.querySelectorAll('.demo-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            
            if (pageId === "popup") {
                // 1번 화면: 점안 알림 팝업 모달을 강제로 표시
                triggerAlarmPopup("A 안약", 1, "23:33", "sound");
            } else {
                // 팝업이 떠있다면 닫아줌
                document.getElementById('alarm-popup').classList.remove('active');
                navigateTo(pageId);
            }
        });
    });

    // 블루투스 동작 토글
    document.getElementById('sim-btn-bluetooth').addEventListener('click', () => {
        if (appState.bluetoothStatus === "disconnected") {
            startBluetoothConnection();
        } else {
            disconnectBluetooth();
        }
    });

    // 3초 후 점안 알림 트리거 데모
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

    // 데모 데이터 리셋
    document.getElementById('sim-btn-reset').addEventListener('click', () => {
        if (confirm("모든 입력을 초기 상태로 리셋하시겠습니까?")) {
            appState.medicines = JSON.parse(INITIAL_MEDICINES);
            appState.alarms = JSON.parse(INITIAL_ALARMS);
            disconnectBluetooth();
            
            renderMedicineList();
            renderAlarmList();
            navigateTo('page-home');
            alert("초기 데이터 상태로 정상 복원되었습니다.");
        }
    });

});
