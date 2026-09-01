/* =========================================================
   main.js
   커버 화면, 화면 전환, 인사말, 달력/D-day, 지도/안내 텍스트,
   이미지 없을 때 처리(fallback) 등 전역 공통 로직
   ========================================================= */

/* ---------------------------------------------------------
   이미지 로드 실패 시 깨진 이미지 대신 placeholder 처리
--------------------------------------------------------- */
function setImageSafe(imgEl, src, altText) {
  if (!imgEl) return;
  imgEl.alt = altText || "";
  imgEl.style.opacity = "0";
  imgEl.style.transition = "opacity 0.3s ease";
  imgEl.onload = () => {
    imgEl.style.opacity = "1";
  };
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.remove();
    const holder = document.createElement("div");
    holder.className = "img-missing";
    holder.style.width = "100%";
    holder.style.height = "100%";
    holder.textContent = "이미지 준비 중";
    imgEl.parentElement && imgEl.parentElement.appendChild(holder);
  };
  imgEl.src = src;
}

/* 이미지 존재 여부를 비동기로 확인 (갤러리/스토리처럼 개수를 모를 때 사용) */
function checkImageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/* 확장자가 실제 파일과 다를 때(.jpg로 적었는데 실제로는 .jpeg/.png 등)를 대비해
   같은 이름의 다른 확장자를 자동으로 찾아봅니다. */
const IMAGE_EXT_FALLBACKS = ["jpg", "jpeg", "JPG", "JPEG", "png", "PNG", "webp", "WEBP"];

async function resolveImageWithFallback(path) {
  if (await checkImageExists(path)) return path;
  const dot = path.lastIndexOf(".");
  const base = dot !== -1 ? path.slice(0, dot) : path;
  for (const ext of IMAGE_EXT_FALLBACKS) {
    const candidate = `${base}.${ext}`;
    if (candidate === path) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await checkImageExists(candidate)) return candidate;
  }
  return null;
}

/* 커버/메인 사진처럼 "이미 화면에 보여줄 <img> 태그가 정해진" 경우에 쓰는 버전.
   미리 존재 여부를 확인(=한 번 더 다운로드)하지 않고, 그 <img> 태그에 바로 시도한
   뒤 실패할 때만 다른 확장자로 다시 시도합니다. → 정상적인 경우 다운로드 1회로 끝남 */
function setImageWithExtFallback(imgEl, path, altText) {
  if (!imgEl) return;
  imgEl.alt = altText || "";
  // 시도하는 동안 깨진 이미지 아이콘/대체 텍스트가 보이지 않도록 숨겨두고,
  // 실제로 불러오는 데 성공했을 때만 자연스럽게 나타나게 함
  imgEl.style.opacity = "0";
  imgEl.style.transition = "opacity 0.3s ease";
  imgEl.onload = () => {
    imgEl.style.opacity = "1";
  };

  const dot = path.lastIndexOf(".");
  const base = dot !== -1 ? path.slice(0, dot) : path;
  const originalExt = dot !== -1 ? path.slice(dot + 1) : "";
  const extList = [originalExt, ...IMAGE_EXT_FALLBACKS].filter(
    (ext, idx, arr) => ext && arr.indexOf(ext) === idx
  );
  let i = 0;

  function tryNext() {
    if (i >= extList.length) {
      imgEl.onerror = null;
      imgEl.remove();
      const holder = document.createElement("div");
      holder.className = "img-missing";
      holder.style.width = "100%";
      holder.style.height = "100%";
      holder.textContent = "이미지 준비 중";
      imgEl.parentElement && imgEl.parentElement.appendChild(holder);
      return;
    }
    imgEl.src = `${base}.${extList[i]}`;
    i++;
  }

  imgEl.onerror = tryNext;
  tryNext();
}

/* ---------------------------------------------------------
   토스트
--------------------------------------------------------- */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

/* ---------------------------------------------------------
   배경음악 - 사용자의 첫 상호작용(탭/스크롤/클릭) 때 재생 시도
   (버튼이 없어졌으므로 브라우저 자동재생 정책을 고려해 처리)
--------------------------------------------------------- */
function initMusic() {
  const audio = document.getElementById("bgm");
  const btn = document.getElementById("btnMusicToggle");
  if (!audio || !btn) return;

  audio.addEventListener("error", () => {
    btn.style.display = "none";
  });

  audio.addEventListener("play", () => btn.classList.add("is-playing"));
  audio.addEventListener("pause", () => btn.classList.remove("is-playing"));

  btn.addEventListener("click", () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });

  // 사용자가 페이지 어디든 처음 터치/클릭하는 순간(제스처) 자동 재생을 시도
  const tryAutoplay = () => {
    audio.play().catch(() => {
      // 그래도 막히면 사용자가 버튼을 직접 눌러야 합니다.
    });
  };
  ["click", "touchstart"].forEach((evt) =>
    document.addEventListener(evt, tryAutoplay, { once: true, passive: true })
  );
}

/* ---------------------------------------------------------
   00-1. 메인 사진
--------------------------------------------------------- */
function initMainPhotoIntro() {
  const img = document.getElementById("mainPhotoLarge");
  const src = MAIN_IMAGES && MAIN_IMAGES[0];
  if (!img || !src) return;
  setImageWithExtFallback(img, src, "메인 사진");
}

/* ---------------------------------------------------------
   01-1. 참석여부 안내 / 하객 스냅 문구 (config.js에서 관리)
--------------------------------------------------------- */
function initTexts() {
  document.getElementById("rsvpIntro").textContent = INVITATION_TEXT.rsvpIntro;
  document.getElementById("snapTitle").textContent = `${INVITATION_TEXT.snapTitle} 📷`;
  document.getElementById("snapDescription").textContent = INVITATION_TEXT.snapDescription;
}

/* ---------------------------------------------------------
   01. 인사말 렌더링
--------------------------------------------------------- */
function initGreeting() {
  const wrap = document.getElementById("greetingLines");
  INVITATION_TEXT.greetingLines.forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line; // 빈 문자열이면 여백줄 역할
    wrap.appendChild(p);
  });

  const groomLine = `${WEDDING_INFO.groomFather} · ${WEDDING_INFO.groomMother}의 ${WEDDING_INFO.groomOrder} `;
  const brideLine = `${WEDDING_INFO.brideFather} · ${WEDDING_INFO.brideMother}의 ${WEDDING_INFO.brideOrder} `;
  document.getElementById("groomParentsLine").innerHTML =
    `${groomLine}<span class="who">${WEDDING_INFO.groomName}</span>`;
  document.getElementById("brideParentsLine").innerHTML =
    `${brideLine}<span class="who">${WEDDING_INFO.brideName}</span>`;
}

/* ---------------------------------------------------------
   04. 달력 제목(날짜/요일/시간) + D-day 문장
   달력 그림 자체는 첨부 이미지로 고정, 날짜/D-day 텍스트만 자동 계산
--------------------------------------------------------- */
function initCalendar() {
  const weddingDate = new Date(WEDDING_INFO.weddingDate + "T00:00:00");
  const year = weddingDate.getFullYear();
  const month = weddingDate.getMonth();
  const weddingDay = weddingDate.getDate();

  // 제목: "2027.04.18" / 부제: "일요일 오전 11시"
  document.getElementById("calendarTitle").textContent = WEDDING_INFO.weddingDate.replaceAll("-", ".");
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "long" }).format(weddingDate);
  document.getElementById("calendarSub").textContent = `${weekday} ${WEDDING_INFO.weddingTime}`;

  // D-day 문장: "최종윤 ♥ 임세희 결혼식이 232일 남았습니다." (하트/일수는 빨간색)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(year, month, weddingDay);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  let tail;
  if (diffDays > 0) tail = `결혼식이 <span class="dday-highlight">${diffDays}일</span> 남았습니다.`;
  else if (diffDays === 0) tail = `<span class="dday-highlight">결혼식 당일</span>입니다.`;
  else tail = `결혼식이 <span class="dday-highlight">${Math.abs(diffDays)}일</span> 지났습니다.`;

  document.getElementById("ddaySentence").innerHTML =
    `${WEDDING_INFO.groomName} <span class="dday-heart">♥</span> ${WEDDING_INFO.brideName} ${tail}`;
}

/* ---------------------------------------------------------
   05, 06. 지도 / 오는 방법 텍스트 채우기
--------------------------------------------------------- */

/* 티맵 딥링크 생성
   - WEDDING_INFO.tmapUrl을 직접 채웠으면 그대로 사용
   - 위경도(latitude/longitude)를 채웠으면 정확한 길안내 링크 생성
   - 둘 다 없으면 이름만으로 여는 링크 생성 (좌표 없이도 앱은 열립니다) */
function buildTmapUrl() {
  if (WEDDING_INFO.tmapUrl && WEDDING_INFO.tmapUrl.trim()) {
    return WEDDING_INFO.tmapUrl.trim();
  }
  const name = encodeURIComponent(WEDDING_INFO.weddingHall);
  if (WEDDING_INFO.latitude && WEDDING_INFO.longitude) {
    return `tmap://route?goalname=${name}&goalx=${WEDDING_INFO.longitude}&goaly=${WEDDING_INFO.latitude}`;
  }
  return `tmap://route?rGoName=${encodeURIComponent("로프트가든344")}`;
}

function getTmapStoreUrl() {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isIOS
    ? "https://apps.apple.com/kr/app/id431589174"
    : "https://play.google.com/store/apps/details?id=com.skt.tmap.ku";
}

function initMapAndGuide() {
  document.getElementById("mapHall").textContent = WEDDING_INFO.weddingHall;
  document.getElementById("mapAddr").textContent = WEDDING_INFO.address;

  const naverBtn = document.getElementById("btnNaverMap");
  const kakaoBtn = document.getElementById("btnKakaoMap");
  const tmapBtn = document.getElementById("btnTmap");
  naverBtn.href = WEDDING_INFO.naverMapUrl;
  kakaoBtn.href = WEDDING_INFO.kakaoMapUrl;

  const tmapAppUrl = buildTmapUrl();
  tmapBtn.href = tmapAppUrl;
  tmapBtn.addEventListener("click", () => {
    // 티맵 앱이 없으면 커스텀 스킴 이동이 조용히 실패하므로,
    // 잠시 후에도 이 페이지에 그대로 있으면 스토어로 대신 보내줍니다.
    const clickedAt = Date.now();
    setTimeout(() => {
      if (!document.hidden && Date.now() - clickedAt < 2000) {
        window.location.href = getTmapStoreUrl();
      }
    }, 1200);
  });


  document.getElementById("guideSubway").textContent = WEDDING_INFO.subway;
  document.getElementById("guideBus").textContent = WEDDING_INFO.bus;
  document.getElementById("guideParking").textContent = WEDDING_INFO.parking;
}

/* ---------------------------------------------------------
   오시는길 안내 - 접었다 펼치는 패널
--------------------------------------------------------- */
function initGuideToggle() {
  const btn = document.getElementById("btnGuideToggle");
  const panel = document.getElementById("guidePanel");
  if (!btn || !panel) return;
  btn.addEventListener("click", () => {
    const isOpen = btn.classList.toggle("is-open");
    panel.style.maxHeight = isOpen ? panel.scrollHeight + "px" : "0px";
  });
}

/* ---------------------------------------------------------
   복사 버튼 (주소 등 일반 텍스트)
--------------------------------------------------------- */
function initCopyChips() {
  document.querySelectorAll(".copy-chip[data-copy-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy-target");
      const text = document.getElementById(targetId).textContent.trim();
      copyToClipboard(text);
    });
  });
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => showToast("복사되었습니다."));
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast("복사되었습니다.");
    } catch (e) {
      showToast("복사에 실패했습니다.");
    }
    document.body.removeChild(ta);
  }
}

/* ---------------------------------------------------------
   섹션 스크롤 reveal 애니메이션
--------------------------------------------------------- */
function revealSectionsOnScroll() {
  window.__weddingRevealed = true;
  const sections = document.querySelectorAll(".section");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  sections.forEach((s) => io.observe(s));
}

/* ---------------------------------------------------------
   초기 실행
   - 섹션 하나라도 초기화 중 에러가 나도 나머지가 멈추지 않도록
     각 단계를 독립적으로 실행합니다 (try/catch로 감쌈).
   - 화면이 나타나는 효과(revealSectionsOnScroll)는 가장 먼저 실행해서,
     혹시 다른 초기화가 실패하더라도 섹션 자체는 보이도록 합니다.
--------------------------------------------------------- */
function safeRun(fn, label) {
  try {
    fn();
  } catch (err) {
    console.error(`[wedding] ${label} 초기화 중 오류:`, err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  safeRun(revealSectionsOnScroll, "섹션 표시");
  safeRun(initMainPhotoIntro, "메인 사진");
  safeRun(initGreeting, "인사말");
  safeRun(initTexts, "안내 문구");
  safeRun(initCalendar, "달력/D-day");
  safeRun(initMapAndGuide, "지도/오시는 길");
  safeRun(initGuideToggle, "오시는길 안내 아코디언");
  safeRun(initCopyChips, "복사 버튼");
  safeRun(initMusic, "배경음악");
});
