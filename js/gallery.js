/* =========================================================
   gallery.js
   사진 섹션 - 존재하는 이미지만 자동으로 그리드에 표시
   클릭 시 라이트박스(전체화면, 좌우 스와이프/이전·다음/닫기)
   ========================================================= */

let galleryImages = [];
let lightboxIndex = 0;

async function renderGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;
  /* 지금은 실제 사진 대신 "촬영 예정입니다" 안내문구(prep-section)로
     대체돼있는 상태(display:none) — 그런데도 12장 × 확장자 8종류를
     전부 하나하나 요청해보고 있어서(최대 96개) 404가 잔뜩 쌓이고
     로딩이 느려지는 원인이 되고 있었음. 숨겨진 동안은 아예 건너뜀 */
  if (grid.style.display === "none") return;

  const candidates = [];
  for (let i = 1; i <= GALLERY_IMAGES_COUNT; i++) {
    candidates.push(IMAGE_PATHS.gallery(i));
  }

  // 확장자가 .jpg로 되어있지 않아도(.jpeg, .png 등) 자동으로 찾아서 사용
  const resolved = await Promise.all(candidates.map(resolveImageWithFallback));
  galleryImages = resolved.filter(Boolean);

  if (galleryImages.length === 0) {
    grid.innerHTML = `<div class="img-missing" style="width:100%;padding:40px 0;">사진 준비 중</div>`;
    return;
  }

  galleryImages.forEach((src, idx) => {
    const card = document.createElement("div");
    card.className = "gallery-card";
    const rotate = (Math.random() * 6 - 3).toFixed(1);
    card.style.setProperty("--gallery-rotate", `${rotate}deg`);

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src;
    img.alt = `웨딩 사진 ${idx + 1}`;
    img.addEventListener("click", () => openLightbox(idx));
    card.appendChild(img);
    grid.appendChild(card);
  });
}

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

  // 좌우 스와이프
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

document.addEventListener("DOMContentLoaded", () => {
  renderGallery();
  initLightboxControls();
});
