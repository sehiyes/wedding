/* =========================================================
   story.js
   우리들의 이야기 섹션 - storyData 배열 기반으로 카드 자동 생성
   ========================================================= */

async function renderStory() {
  const track = document.getElementById("storyTrack");
  if (!track || typeof storyData === "undefined") return;

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
