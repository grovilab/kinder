// ============================================
// 어린이집 준비물 체크리스트 - main.js
// ============================================

// localStorage에 사용할 키 이름
const STORAGE_KEY = "daycareChecklist";

// 항상 기본으로 포함되는 준비물 목록
const DEFAULT_ITEMS = ["물통", "수저세트", "여벌옷", "알림장"];

// 키워드 → 추가 준비물 매핑 규칙
// 공지사항 안에 키워드가 포함되어 있으면 해당 준비물들을 추가한다.
const KEYWORD_RULES = [
  { keywords: ["물놀이", "수영"], items: ["수영복", "수건", "방수팩"] },
  { keywords: ["소풍", "견학"], items: ["도시락", "모자", "운동화"] },
  { keywords: ["미술", "만들기"], items: ["미술가운", "물티슈"] },
  { keywords: ["체육", "운동"], items: ["운동화", "물통"] },
  { keywords: ["숲", "산책"], items: ["모자", "편한 신발"] },
  { keywords: ["비", "우천"], items: ["우산", "장화"] },
  { keywords: ["낮잠"], items: ["낮잠이불"] },
  { keywords: ["약", "투약"], items: ["약", "투약의뢰서"] },
];

// DOM 요소 참조
const noticeInput = document.getElementById("noticeInput");
const generateBtn = document.getElementById("generateBtn");
const resetBtn = document.getElementById("resetBtn");
const checklistEl = document.getElementById("checklist");
const emptyMessage = document.getElementById("emptyMessage");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const completeMessage = document.getElementById("completeMessage");

// 앱의 상태(state)
// items: [{ name: "물통", checked: false, fromDefault: true }, ...]
let state = {
  notice: "",
  items: [],
};

// ============================================
// 초기화: 페이지 로드 시 localStorage에서 상태 불러오기
// ============================================
function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      // 저장된 데이터가 손상된 경우 무시하고 새로 시작
      state = { notice: "", items: [] };
    }
  }

  // 저장된 공지사항이 있으면 textarea에 복원
  noticeInput.value = state.notice || "";

  renderChecklist();
}

// ============================================
// 공지사항 분석 → 준비물 목록 생성
// ============================================
function analyzeNotice(noticeText) {
  // 기본 준비물로 시작
  let resultItems = [...DEFAULT_ITEMS];

  // 키워드 규칙을 순회하며 공지사항에 포함된 키워드가 있는지 검사
  KEYWORD_RULES.forEach((rule) => {
    const matched = rule.keywords.some((kw) => noticeText.includes(kw));
    if (matched) {
      resultItems.push(...rule.items);
    }
  });

  // 중복 항목 제거 (Set을 이용해 유니크한 값만 남김)
  const uniqueItems = [...new Set(resultItems)];

  return uniqueItems;
}

// ============================================
// "준비물 생성" 버튼 클릭 핸들러
// ============================================
function handleGenerate() {
  const noticeText = noticeInput.value.trim();

  // 새로 생성된 준비물 이름 목록
  const newItemNames = analyzeNotice(noticeText);

  // 기존에 체크되어 있던 항목은 체크 상태를 유지하기 위해 매핑
  const prevCheckedMap = {};
  state.items.forEach((item) => {
    prevCheckedMap[item.name] = item.checked;
  });

  // 새 상태 구성
  state.notice = noticeText;
  state.items = newItemNames.map((name) => ({
    name,
    checked: prevCheckedMap[name] || false,
  }));

  saveState();
  renderChecklist();
}

// ============================================
// 초기화 버튼 클릭 핸들러
// ============================================
function handleReset() {
  const confirmed = confirm("체크리스트를 모두 초기화할까요?");
  if (!confirmed) return;

  state = { notice: "", items: [] };
  noticeInput.value = "";

  saveState();
  renderChecklist();
}

// ============================================
// 체크박스 토글 핸들러
// ============================================
function toggleItem(index) {
  state.items[index].checked = !state.items[index].checked;
  saveState();
  renderChecklist();
}

// ============================================
// 상태를 localStorage에 저장
// ============================================
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ============================================
// 체크리스트 화면 렌더링
// ============================================
function renderChecklist() {
  checklistEl.innerHTML = "";

  // 준비물이 없는 경우 안내 메시지 표시
  if (state.items.length === 0) {
    emptyMessage.classList.remove("hidden");
  } else {
    emptyMessage.classList.add("hidden");
  }

  state.items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "checklist-item" + (item.checked ? " checked" : "");

    // 체크박스
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `item-${index}`;
    checkbox.checked = item.checked;
    checkbox.addEventListener("change", () => toggleItem(index));

    // 라벨
    const label = document.createElement("label");
    label.htmlFor = `item-${index}`;
    label.textContent = item.name;

    // 기본 준비물인지 표시하는 태그
    const tag = document.createElement("span");
    if (DEFAULT_ITEMS.includes(item.name)) {
      tag.className = "item-tag";
      tag.textContent = "기본";
    }

    li.appendChild(checkbox);
    li.appendChild(label);
    if (tag.textContent) li.appendChild(tag);

    checklistEl.appendChild(li);
  });

  updateProgress();
}

// ============================================
// 진행률(%) 및 진행바 업데이트
// ============================================
function updateProgress() {
  const total = state.items.length;
  const checkedCount = state.items.filter((item) => item.checked).length;
  const percent = total === 0 ? 0 : Math.round((checkedCount / total) * 100);

  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;

  // 모든 항목이 체크되었고 항목이 1개 이상일 때 완료 메시지 표시
  if (total > 0 && checkedCount === total) {
    completeMessage.classList.remove("hidden");
  } else {
    completeMessage.classList.add("hidden");
  }
}

// ============================================
// 이벤트 리스너 등록
// ============================================
generateBtn.addEventListener("click", handleGenerate);
resetBtn.addEventListener("click", handleReset);

// 앱 시작
init();
