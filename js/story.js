/* =========================================================
   story.js
   우리들의 이야기 섹션 - storyData 배열 기반으로 카드 자동 생성
   ========================================================= */

async function renderStory() {
  const track = document.getElementById("storyTrack");
  if (!track || typeof storyData === "undefined") return;
  /* 이 트랙은 지금 화면에 안 쓰여요(display:none, 손으로 짠 새 타임라인
     UI로 대체됨) — 그런데도 예전 코드가 계속 존재하지도 않는
     placeholder 이미지를 확장자별로(jpg/jpeg/JPG/JPEG/png...) 하나하나
     찔러보고 있어서 404가 수십 개씩 쌓이고 있었음. 숨겨진 상태면
     아예 시도하지 않도록 방어 */
  if (track.style.display === "none") return;

  for (const item of storyData) {
    const card = document.createElement("div");
    card.className = "story-card";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    const img = document.createElement("img");
    img.loading = "lazy";
    thumb.appendChild(img);
    // eslint-disable-next-line no-await-in-loop
    const resolved = await resolveImageWithFallback(item.image);
    if (resolved) setImageSafe(img, resolved, item.title);
    else img.remove();

    const body = document.createElement("div");
    body.className = "body";
    body.innerHTML = `
      <div class="date">${item.date}</div>
      <div class="title">${item.title}</div>
      <div class="desc">${item.description}</div>
    `;

    card.appendChild(thumb);
    card.appendChild(body);
    track.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", renderStory);
