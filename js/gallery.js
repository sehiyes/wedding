/* =========================================================
   gallery.js
   사진 섹션 - "인생네컷" 포토부스 스타일 갤러리
   - 프레임 디자인 4종 중 선택 (완전히 다른 레이아웃으로 통째로 교체됨)
   - 4장씩 한 "컷"으로 묶어서 좌우 화살표로 페이지 넘김
   - 사진 클릭 시 라이트박스로 확대 (핀치줌/팬 없음, 그냥 큰 이미지만)

   새 프레임을 추가하려면:
   1) FRAME_STYLES에 key 추가
   2) buildCardInner()의 switch문에 해당 key 케이스 추가
   3) css/style.css에 .photobooth-card--<key> 규칙 추가
   4) index.html의 .frame-selector에 스와치 버튼 추가
   ========================================================= */

const FRAME_STYLES = {
  "minimal": {},
  "pastel-cute": {},
};
const DEFAULT_FRAME = "minimal";
let currentFrame = DEFAULT_FRAME;

/* 실제 보내주신 레퍼런스 이미지를 배경 투명화한 PNG를 그대로 오버레이로 사용합니다
   (images/deco/gallery-frame-*.png). 사진은 그 뒤에 깔리고, 투명해진 "창" 자리로
   사진이 비쳐 보입니다. FRAME_WINDOWS 좌표는 각 PNG에서 투명한 사각형 구멍의
   위치를 퍼센트(이미지 가로/세로 대비 비율)로 분석해서 뽑아낸 값입니다. */
const FRAME_IMAGE = {
  "minimal": "images/deco/gallery-frame-minimal.png",
  "pastel-cute": "images/deco/gallery-frame-pastel-cute.png",
};
const FRAME_ASPECT = {
  "minimal": "700 / 989",
  "pastel-cute": "700 / 1050",
};
/* 각 프레임당 4칸. pastel-cute는 레퍼런스 이미지가 2x2 격자가 아니라
   살짝 어긋난 모자이크 배치라 칸마다 크기가 조금씩 달라요 */
const FRAME_WINDOWS = {
  "minimal": [
    { x: 10.00, y: 9.00, w: 39.57, h: 41.46 },
    { x: 50.14, y: 9.00, w: 39.86, h: 41.46 },
    { x: 10.00, y: 51.06, w: 39.57, h: 43.88 },
    { x: 50.14, y: 51.06, w: 39.86, h: 43.88 },
  ],
  "pastel-cute": [
    { x: 5.37, y: 18.29, w: 41.31, h: 39.0 },
    { x: 53.22, y: 7.29, w: 41.5, h: 33.66 },
    { x: 5.37, y: 59.51, w: 41.31, h: 33.33 },
    { x: 53.22, y: 46.42, w: 41.5, h: 28.71 },
  ],
};

let galleryImages = []; // 라이트박스용 - 실제로 존재하는 사진만 들어있는 1차원 배열
let photoboothSets = []; // 4장씩 묶은 2차원 배열 (컷 단위)
let currentPage = 0;
let lightboxIndex = 0;

function chunkIntoFours(list) {
  const chunks = [];
  for (let i = 0; i < list.length; i += 4) {
    chunks.push(list.slice(i, i + 4));
  }
  return chunks;
}

async function loadGalleryImages() {
  const candidates = [];
  for (let i = 1; i <= GALLERY_IMAGES_COUNT; i++) {
    candidates.push(IMAGE_PATHS.gallery(i));
  }
  const resolved = await Promise.all(candidates.map(resolveImageWithFallback));
  galleryImages = resolved.filter(Boolean);
  // 실제 사진이 아직 없어도 포토부스 틀(플레이스홀더 4칸)은 미리 보여줌
  photoboothSets = galleryImages.length ? chunkIntoFours(galleryImages) : [[]];
}

function buildSlotEl(src, globalIndex) {
  const cell = document.createElement("div");
  cell.className = src ? "photobooth-slot" : "photobooth-slot photobooth-slot--empty";
  if (src) {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src;
    img.alt = `웨딩 사진 ${globalIndex + 1}`;
    img.addEventListener("click", () => openLightbox(globalIndex));
    cell.appendChild(img);
  }
  return cell;
}

/* minimal / doodle-green / pink-sticker: 사진 4장을 투명 PNG 뒤에 깔고
   그 위에 프레임 PNG를 그대로 얹는 방식 */
function buildOverlayCard(photos, globalStartIndex, frameKey) {
  const card = document.createElement("div");
  card.className = `photobooth-card photobooth-card--overlay photobooth-card--${frameKey}`;
  card.style.aspectRatio = FRAME_ASPECT[frameKey];

  FRAME_WINDOWS[frameKey].forEach((win, slot) => {
    const cell = buildSlotEl(photos[slot], globalStartIndex + slot);
    cell.classList.add("overlay-slot");
    cell.style.left = `${win.x}%`;
    cell.style.top = `${win.y}%`;
    cell.style.width = `${win.w}%`;
    cell.style.height = `${win.h}%`;
    card.appendChild(cell);
  });

  const frameImg = document.createElement("img");
  frameImg.className = "overlay-frame-png";
  frameImg.src = FRAME_IMAGE[frameKey];
  frameImg.alt = "";
  frameImg.setAttribute("aria-hidden", "true");
  card.appendChild(frameImg);

  return card;
}

function buildCardEl(photos, globalStartIndex, frameKey) {
  return buildOverlayCard(photos, globalStartIndex, frameKey);
}

function renderPhotobooth() {
  const track = document.getElementById("photoboothTrack");
  if (!track) return;
  track.innerHTML = "";

  photoboothSets.forEach((photos, pageIdx) => {
    const globalStartIndex = pageIdx * 4;
    track.appendChild(buildCardEl(photos, globalStartIndex, currentFrame));
  });

  goToPage(currentPage);
}

function goToPage(idx) {
  const track = document.getElementById("photoboothTrack");
  const prevBtn = document.getElementById("photoboothPrev");
  const nextBtn = document.getElementById("photoboothNext");
  const hint = document.getElementById("photoboothPageHint");
  if (!track) return;

  const total = photoboothSets.length;
  currentPage = Math.max(0, Math.min(idx, total - 1));
  track.style.transform = `translateX(-${currentPage * 100}%)`;

  if (prevBtn) prevBtn.disabled = currentPage === 0;
  if (nextBtn) nextBtn.disabled = currentPage === total - 1;
  if (hint) hint.textContent = total > 1 ? `${currentPage + 1} / ${total}` : "";
}

function initPhotoboothNav() {
  const prevBtn = document.getElementById("photoboothPrev");
  const nextBtn = document.getElementById("photoboothNext");
  if (prevBtn) prevBtn.addEventListener("click", () => goToPage(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goToPage(currentPage + 1));
}

function applyFrame(frameKey) {
  if (!FRAME_STYLES[frameKey]) frameKey = DEFAULT_FRAME;
  currentFrame = frameKey;
  const wrap = document.getElementById("photoboothWrap");
  if (wrap) wrap.dataset.frameType = frameKey;
  renderPhotobooth();
}

function initFrameSelector() {
  const buttons = document.querySelectorAll(".frame-swatch");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      applyFrame(btn.dataset.frame);
    });
  });
}

/* ----- 라이트박스 (클릭해서 사진 크게 보기 - 확대/축소 기능 없음) ----- */
function openLightbox(idx) {
  lightboxIndex = idx;
  updateLightboxImage();
  document.getElementById("lightbox").classList.add("is-open");
}
function closeLightbox() {
  document.getElementById("lightbox").classList.remove("is-open");
}
function updateLightboxImage() {
  const img = document.getElementById("lightboxImg");
  img.src = galleryImages[lightboxIndex];
}
function lightboxPrev() {
  lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
  updateLightboxImage();
}
function lightboxNext() {
  lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
  updateLightboxImage();
}

function initLightboxControls() {
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxPrev").addEventListener("click", lightboxPrev);
  document.getElementById("lightboxNext").addEventListener("click", lightboxNext);
  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });

  // 좌우 스와이프 (라이트박스 안에서만 - 확대/축소는 하지 않음)
  let touchStartX = null;
  const lb = document.getElementById("lightbox");
  lb.addEventListener("touchstart", (e) => (touchStartX = e.touches[0].clientX));
  lb.addEventListener("touchend", (e) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 40) lightboxPrev();
    else if (diff < -40) lightboxNext();
    touchStartX = null;
  });

  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("lightbox").classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lightboxPrev();
    if (e.key === "ArrowRight") lightboxNext();
  });
}

/* ----- 전체보기 (프레임 밑 버튼 - 지금까지 올라온 사진을 전부 나열) ----- */
function renderViewAllGrid() {
  const grid = document.getElementById("viewAllGrid");
  if (!grid) return;
  grid.innerHTML = "";
  if (galleryImages.length === 0) {
    grid.innerHTML = `<p class="view-all-empty">아직 올라온 사진이 없어요</p>`;
    return;
  }
  galleryImages.forEach((src, idx) => {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src;
    img.alt = `웨딩 사진 ${idx + 1}`;
    img.addEventListener("click", () => openLightbox(idx));
    grid.appendChild(img);
  });
}
function openViewAll() {
  renderViewAllGrid();
  document.getElementById("viewAllPanel").classList.add("is-open");
}
function closeViewAll() {
  document.getElementById("viewAllPanel").classList.remove("is-open");
}
function initViewAll() {
  const btn = document.getElementById("viewAllBtn");
  const closeBtn = document.getElementById("viewAllClose");
  const panel = document.getElementById("viewAllPanel");
  if (btn) btn.addEventListener("click", openViewAll);
  if (closeBtn) closeBtn.addEventListener("click", closeViewAll);
  if (panel) {
    panel.addEventListener("click", (e) => {
      if (e.target.id === "viewAllPanel") closeViewAll();
    });
  }
}

async function initGallery() {
  await loadGalleryImages();
  initPhotoboothNav();
  initFrameSelector();
  applyFrame(DEFAULT_FRAME);
  initLightboxControls();
  initViewAll();
}

document.addEventListener("DOMContentLoaded", initGallery);
