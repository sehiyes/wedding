/* =========================================================
   invitation.js
   ---------------------------------------------------------
   축하메시지 / 참석여부는 Supabase(Postgres)에 저장됩니다.
   - 방명록(guestbook_messages): 누구나 읽고 쓸 수 있음 (공개 방명록)
   - 참석여부(rsvps): 누구나 "쓰기"만 가능, "조회"는 관리자 코드로
     서버(Postgres 함수 get_rsvps_with_code) 검증을 거쳐야만 가능
   테이블/보안정책은 supabase/schema.sql 참고. 연결 정보는
   js/config.js의 SUPABASE_URL / SUPABASE_ANON_KEY.
   ========================================================= */

/* ---------------------------------------------------------
   계좌 아코디언 - WEDDING_INFO.accounts 배열을 group(신랑측/신부측) 단위로 묶어서
   토글 2개(신랑측/신부측)만 만들고, 펼치면 그 안에 속한 사람이 전부 보입니다.
   사람 한 명당 2줄: ① 이름  ② 은행 계좌번호 + 복사하기 버튼
--------------------------------------------------------- */
function initAccountAccordion() {
  const container = document.getElementById("accountsContainer");
  if (!container || !WEDDING_INFO.accounts) return;

  // account 값이 비어있는(계좌번호를 아직 안 넣은) 항목은 목록에서 제외
  const filledAccounts = WEDDING_INFO.accounts.filter(
    (acc) => acc.account && acc.account.trim() !== ""
  );
  if (filledAccounts.length === 0) {
    container.innerHTML = "";
    return;
  }

  const groups = [];
  filledAccounts.forEach((acc) => {
    let g = groups.find((g) => g.name === acc.group);
    if (!g) {
      g = { name: acc.group, items: [] };
      groups.push(g);
    }
    g.items.push(acc);
  });

  container.innerHTML = groups
    .map((g, gi) => {
      const key = `g${gi}`;
      return `
        <button class="account-toggle" data-account="${key}">
          <span>${escapeHtml(g.name)} 계좌번호 보기</span>
          <span class="chevron">⌄</span>
        </button>
        <div class="account-panel" data-panel="${key}">
          <div class="account-panel-inner">
            ${g.items
              .map(
                (acc, ii) => `
              <div class="account-person">
                <div class="account-person-name">${escapeHtml(acc.label)}</div>
                <div class="account-person-row">
                  <span class="account-line">${escapeHtml(acc.bank)} ${escapeHtml(acc.account)}</span>
                  <button class="copy-chip" data-copy-account="${key}-${ii}" data-account-number="${escapeHtml(acc.account)}">복사하기</button>
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
    })
    .join("");

  container.querySelectorAll(".account-toggle").forEach((btn) => {
    const key = btn.getAttribute("data-account");
    const panel = container.querySelector(`.account-panel[data-panel="${key}"]`);
    btn.addEventListener("click", () => {
      const isOpen = btn.classList.toggle("is-open");
      panel.style.maxHeight = isOpen ? panel.scrollHeight + "px" : "0px";
    });
  });

  container.querySelectorAll("[data-copy-account]").forEach((btn) => {
    btn.addEventListener("click", () => {
      copyToClipboard(btn.getAttribute("data-account-number"));
    });
  });
}

/* ---------------------------------------------------------
   라디오 pill 시각 상태
--------------------------------------------------------- */
function initRadioPills() {
  document.querySelectorAll(".radio-group").forEach((group) => {
    group.addEventListener("change", () => {
      group.querySelectorAll(".radio-pill").forEach((pill) => {
        const input = pill.querySelector("input");
        pill.classList.toggle("is-checked", input.checked);
      });
    });
  });
}

/* ---------------------------------------------------------
   Supabase 연결 여부 확인 헬퍼
--------------------------------------------------------- */
function requireSupabase() {
  if (!supabaseClient) {
    showToast("Supabase 연결 정보가 설정되지 않았습니다.");
    return false;
  }
  return true;
}

/* ---------------------------------------------------------
   08. 축하 메시지 (guestbook_messages 테이블 - 공개 읽기/쓰기)
   Guest Garden 컨셉: 메시지 하나하나가 나무가 되어 정원에 심어집니다.
   나무를 클릭하면 팝업으로 메시지를 볼 수 있습니다.
--------------------------------------------------------- */
async function renderMessages() {
  const wrap = document.getElementById("messageList");
  if (!requireSupabase()) {
    wrap.innerHTML = `<div class="message-empty">Supabase 연결 후 이용할 수 있습니다.</div>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("guestbook_messages")
    .select("name, message, created_at, tree_shape")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    wrap.innerHTML = `<div class="message-empty">메시지를 불러오지 못했습니다.</div>`;
    return;
  }

  if (!data || data.length === 0) {
    wrap.innerHTML = `<div class="message-empty">아직 심어진 나무가 없어요.<br/>첫 번째 나무를 심어주세요 🌱</div>`;
    return;
  }

  wrap.innerHTML = "";
  data.forEach((m) => {
    const shape = Number.isInteger(m.tree_shape) ? m.tree_shape % 6 : 0;
    const tree = document.createElement("div");
    tree.className = "tree";
    tree.innerHTML = `
      <div class="tree-visual">
        <div class="tree-arrow">▼</div>
        <img src="images/deco/trees/${shape}.png" alt="" />
        <div class="tree-name-overlay">
          <svg class="tree-envelope" viewBox="0 0 24 18" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="22" height="16" rx="2" fill="#ffffff"/>
            <path d="M2 2 L12 10 L22 2 Z" fill="#d0453f"/>
          </svg>
          <div class="tree-from-label">FROM</div>
          <div class="tree-from-name">${escapeHtml(m.name)}</div>
        </div>
      </div>
    `;
    tree.addEventListener("click", () => openTreeModal(m));
    wrap.appendChild(tree);
  });

  // 가운데로 온 나무를 강조 표시(화살표 + 확대)하는 캐러셀 효과 갱신
  updateGardenActiveTree();
  // 이미지가 로드되며 레이아웃이 살짝 바뀔 수 있어 한 번 더 갱신
  setTimeout(updateGardenActiveTree, 250);
}

/* ---------------------------------------------------------
   정원 캐러셀 - 가로 스크롤 중 가운데에 가장 가까운 나무를 강조 표시
--------------------------------------------------------- */
function updateGardenActiveTree() {
  const track = document.getElementById("messageList");
  if (!track) return;
  const trees = track.querySelectorAll(".tree");
  if (trees.length === 0) return;

  const trackRect = track.getBoundingClientRect();
  const centerX = trackRect.left + trackRect.width / 2;

  let closest = null;
  let minDist = Infinity;
  trees.forEach((el) => {
    const r = el.getBoundingClientRect();
    const elCenterX = r.left + r.width / 2;
    const dist = Math.abs(elCenterX - centerX);
    if (dist < minDist) {
      minDist = dist;
      closest = el;
    }
  });

  trees.forEach((el) => el.classList.remove("is-active"));
  if (closest) closest.classList.add("is-active");
}

function initGardenCarousel() {
  const track = document.getElementById("messageList");
  if (!track) return;
  let ticking = false;
  track.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateGardenActiveTree();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", updateGardenActiveTree);
}

function openTreeModal(m) {
  const backdrop = document.getElementById("treeModalBackdrop");
  const body = document.getElementById("treeModalBody");
  body.innerHTML = `
    <div class="tm-from">from. ${escapeHtml(m.name)}</div>
    <div class="tm-message">${escapeHtml(m.message)}</div>
    <div class="tm-date">${formatDate(m.created_at)}</div>
  `;
  backdrop.classList.add("is-open");
}

function initTreeModal() {
  const backdrop = document.getElementById("treeModalBackdrop");
  const closeBtn = document.getElementById("treeModalClose");
  closeBtn.addEventListener("click", () => backdrop.classList.remove("is-open"));
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.remove("is-open");
  });
}

/* ---------------------------------------------------------
   나무 심기 팝업 - "나무 심기" 버튼을 누르면 먼저 나무 모양을 고르고,
   고른 다음에 이름/축하 메시지를 입력하는 2단계 흐름입니다.
--------------------------------------------------------- */
let selectedTreeShape = null;

function showTreePickStep() {
  document.getElementById("treePickStep").style.display = "block";
  document.getElementById("treeMessageStep").classList.remove("is-visible");
}
function showTreeMessageStep() {
  document.getElementById("treePickStep").style.display = "none";
  document.getElementById("treeMessageStep").classList.add("is-visible");
  setTimeout(() => document.getElementById("msgName").focus(), 150);
}

function openTreePickModal() {
  selectedTreeShape = null;
  document.getElementById("treePickGrid")
    .querySelectorAll(".tree-pick-option")
    .forEach((o) => o.classList.remove("is-selected"));
  document.getElementById("messageForm").reset();
  showTreePickStep();
  document.getElementById("treePickModalBackdrop").classList.add("is-open");
}
function closeTreePickModal() {
  document.getElementById("treePickModalBackdrop").classList.remove("is-open");
}

function initTreePickModal() {
  const backdrop = document.getElementById("treePickModalBackdrop");
  const closeBtn = document.getElementById("treePickModalClose");
  const grid = document.getElementById("treePickGrid");
  const openBtn = document.getElementById("btnOpenTreePick");

  openBtn.addEventListener("click", () => {
    if (!requireSupabase()) return;
    openTreePickModal();
  });

  closeBtn.addEventListener("click", closeTreePickModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeTreePickModal();
  });

  grid.querySelectorAll(".tree-pick-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      grid.querySelectorAll(".tree-pick-option").forEach((o) => o.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      selectedTreeShape = parseInt(btn.getAttribute("data-shape"), 10) || 0;
      showTreeMessageStep();
    });
  });
}

function initMessageForm() {
  const form = document.getElementById("messageForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!requireSupabase() || selectedTreeShape === null) return;

    const name = document.getElementById("msgName").value.trim();
    const message = document.getElementById("msgText").value.trim();
    if (!name || !message) return;

    const submitBtn = form.querySelector(".btn-submit");
    submitBtn.disabled = true;

    const { error } = await supabaseClient
      .from("guestbook_messages")
      .insert({ name, message, tree_shape: selectedTreeShape });

    submitBtn.disabled = false;

    if (error) {
      console.error(error);
      showToast(`메시지 등록 실패: ${error.message || "알 수 없는 오류"}`);
      return;
    }

    closeTreePickModal();
    await renderMessages();
    showToast("정원에 나무를 심었습니다 🌳");
  });
  renderMessages();
}

/* ---------------------------------------------------------
   09. 참석 여부 - 버튼을 누르면 팝업으로 뜸
--------------------------------------------------------- */
function initRsvpToggle() {
  const btn = document.getElementById("btnRsvpToggle");
  const backdrop = document.getElementById("rsvpModalBackdrop");
  btn.addEventListener("click", () => {
    backdrop.classList.add("is-open");
    setTimeout(() => document.getElementById("rsvpName").focus(), 200);
  });
}

function initRsvpModal() {
  const backdrop = document.getElementById("rsvpModalBackdrop");
  const closeBtn = document.getElementById("rsvpModalClose");
  closeBtn.addEventListener("click", () => backdrop.classList.remove("is-open"));
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.remove("is-open");
  });
}

function initRsvpForm() {
  const form = document.getElementById("rsvpForm");
  const backdrop = document.getElementById("rsvpModalBackdrop");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!requireSupabase()) return;

    const name = document.getElementById("rsvpName").value.trim();
    const phone = document.getElementById("rsvpPhone").value.trim();
    const side = form.querySelector('input[name="rsvpSide"]:checked');
    const attend = form.querySelector('input[name="rsvpAttend"]:checked');
    const message = document.getElementById("rsvpMessage").value.trim();

    if (!name || !phone || !side || !attend) return;

    const submitBtn = form.querySelector(".btn-submit");
    submitBtn.disabled = true;

    const { error } = await supabaseClient.from("rsvps").insert({
      name,
      phone,
      side: side.value, // groom | bride
      attend: attend.value, // yes | no
      message: message || null,
    });

    submitBtn.disabled = false;

    if (error) {
      console.error(error);
      showToast(`참석 여부 전달 실패: ${error.message || "알 수 없는 오류"}`);
      return;
    }

    form.reset();
    form.querySelectorAll(".radio-pill").forEach((p) => p.classList.remove("is-checked"));
    showToast("참석 여부가 전달되었습니다.");
    backdrop.classList.remove("is-open");
  });
}

/* ---------------------------------------------------------
   관리자 확인 - Postgres 함수 get_rsvps_with_code 로 코드 검증 + 조회를
   서버에서 한 번에 처리 (코드/데이터가 프론트엔드에 노출되지 않음)
--------------------------------------------------------- */
function initAdmin() {
  const backdrop = document.getElementById("adminModalBackdrop");
  const input = document.getElementById("adminCodeInput");
  const error = document.getElementById("adminError");
  const panel = document.getElementById("adminPanel");

  document.getElementById("btnAdminOpen").addEventListener("click", () => {
    backdrop.classList.add("is-open");
    input.value = "";
    error.classList.remove("is-visible");
    panel.innerHTML = "";
    setTimeout(() => input.focus(), 50);
  });

  document.getElementById("btnAdminCancel").addEventListener("click", () => {
    backdrop.classList.remove("is-open");
  });

  document.getElementById("btnAdminConfirm").addEventListener("click", async () => {
    if (!requireSupabase()) return;

    const confirmBtn = document.getElementById("btnAdminConfirm");
    confirmBtn.disabled = true;

    const { data, error: rpcError } = await supabaseClient.rpc("get_rsvps_with_code", {
      input_code: input.value,
    });

    confirmBtn.disabled = false;

    if (rpcError) {
      error.classList.add("is-visible");
      panel.innerHTML = "";
      return;
    }

    error.classList.remove("is-visible");
    renderAdminPanel(panel, data || []);
  });
}

function renderAdminPanel(panel, list) {
  const total = list.length;
  const attendCount = list.filter((r) => r.attend === "yes").length;
  const absentCount = list.filter((r) => r.attend === "no").length;
  const groomCount = list.filter((r) => r.side === "groom" && r.attend === "yes").length;
  const brideCount = list.filter((r) => r.side === "bride" && r.attend === "yes").length;

  const rows = list
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.phone || "-")}</td>
        <td>${r.side === "groom" ? "신랑측" : "신부측"}</td>
        <td>${r.attend === "yes" ? "참석" : "불참"}</td>
        <td>${escapeHtml(r.message || "-")}</td>
        <td>${formatDate(r.created_at)}</td>
      </tr>`
    )
    .join("");

  panel.innerHTML = `
    <div class="admin-panel">
      <div class="admin-stats">
        <div class="stat"><div class="n">${total}</div><div class="l">전체 응답</div></div>
        <div class="stat"><div class="n">${attendCount}</div><div class="l">참석</div></div>
        <div class="stat"><div class="n">${absentCount}</div><div class="l">불참</div></div>
        <div class="stat"><div class="n">${groomCount}</div><div class="l">신랑측 참석</div></div>
        <div class="stat"><div class="n">${brideCount}</div><div class="l">신부측 참석</div></div>
      </div>
      <div style="max-height:220px; overflow:auto;">
        <table class="admin-table">
          <thead><tr><th>이름</th><th>전화번호</th><th>측</th><th>참석</th><th>메시지</th><th>작성일</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:var(--ink-faint)">응답 없음</td></tr>`}</tbody>
        </table>
      </div>
      <p class="admin-note">
        ※ 코드 검증과 조회는 Supabase의 get_rsvps_with_code 함수 안에서
        서버 측으로 처리됩니다. 코드가 맞지 않으면 데이터가 전혀 반환되지 않습니다.
      </p>
    </div>
  `;
}

/* ---------------------------------------------------------
   오시는 길 안내 정보
   config.js의 subway / bus / parking 내용을 HTML에 표시
--------------------------------------------------------- */
function initLocationInfo() {
  const subway = document.getElementById("guideSubway");
  const bus = document.getElementById("guideBus");
  const parking = document.getElementById("guideParking");

  if (subway) {
    subway.textContent = WEDDING_INFO.subway || "";
  }

  if (bus) {
    bus.textContent = WEDDING_INFO.bus || "";
  }

  if (parking) {
    parking.textContent = WEDDING_INFO.parking || "";
  }
}

/* ---------------------------------------------------------
   10. 스냅 작가 업로드 - Google Apps Script 웹앱으로 실제 전송
--------------------------------------------------------- */
function initSnapUpload() {
  const selectBtn = document.getElementById("btnSnapSelect");
  const input = document.getElementById("snapInput");
  const progressWrap = document.getElementById("uploadProgress");
  const fill = document.getElementById("uploadFill");
  const label = document.getElementById("uploadLabel");

  if (!selectBtn || !input) return;

  selectBtn.addEventListener("click", () => input.click());

  input.addEventListener("change", async () => {
    const files = Array.from(input.files || []);
    if (files.length === 0) return;

    if (!PHOTO_UPLOAD.appsScriptUrl || PHOTO_UPLOAD.appsScriptUrl.includes("YOUR-DEPLOYMENT-ID")) {
      showToast("사진 업로드 서버가 아직 설정되지 않았습니다.");
      input.value = "";
      return;
    }

    if (files.length > PHOTO_UPLOAD.maxFiles) {
      showToast(`한 번에 최대 ${PHOTO_UPLOAD.maxFiles}장까지 업로드할 수 있어요.`);
      input.value = "";
      return;
    }

    const tooBig = files.find((f) => f.size > PHOTO_UPLOAD.maxFileSizeMB * 1024 * 1024);
    if (tooBig) {
      showToast(`한 장당 최대 ${PHOTO_UPLOAD.maxFileSizeMB}MB까지 업로드할 수 있어요.`);
      input.value = "";
      return;
    }

    progressWrap.classList.add("is-visible");
    fill.style.width = "0%";
    label.textContent = `업로드 준비 중... (0/${files.length})`;
    selectBtn.disabled = true;

    const fileToDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        // 파일 읽기 구간은 전체 진행률의 0~50% 정도로 반영
        const p = evt.loaded / evt.total;
        fill.style.width = Math.round(p * 50) + "%";
      };
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("file_read_error"));
      reader.readAsDataURL(file);
    });

    try {
      // Apps Script는 multipart XHR에서 CORS preflight가 발생하기 때문에,
      // 파일 1장씩 base64 + application/x-www-form-urlencoded로 전송합니다.
      // 이 방식은 simple POST라서 preflight를 피할 수 있습니다.
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        label.textContent = `사진 읽는 중... (${i + 1}/${files.length})`;
        const dataUrl = await fileToDataUrl(file);
        const base64 = dataUrl.split(",")[1] || "";

        const body = new URLSearchParams();
        body.set("token", PHOTO_UPLOAD.uploadToken);
        body.set("fileName", file.name);
        body.set("mimeType", file.type || "application/octet-stream");
        body.set("fileData", base64);
        body.set("guestName", "guest");

        label.textContent = `업로드 중... (${i + 1}/${files.length})`;
        fill.style.width = Math.round((i / files.length) * 50 + 50) + "%";

        // no-cors + simple POST: 응답 본문은 읽지 않지만 preflight 없이
        // Apps Script doPost까지 요청을 전달할 수 있습니다.
        await fetch(PHOTO_UPLOAD.appsScriptUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body,
        });

        fill.style.width = Math.round(((i + 1) / files.length) * 100) + "%";
      }

      label.textContent = "업로드 완료";
      showToast("사진이 전달되었습니다. 감사합니다!");
    } catch (err) {
      console.error("photo upload error", err);
      label.textContent = "업로드 실패";
      showToast("사진 업로드 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      selectBtn.disabled = false;
      setTimeout(() => {
        progressWrap.classList.remove("is-visible");
        input.value = "";
      }, 1400);
    }
  });
}

/* ---------------------------------------------------------
   유틸
--------------------------------------------------------- */
function formatDate(isoString) {
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
/* ---------------------------------------------------------
   11. 우리들의 이야기 - "우리의 이야기가 궁금하다면" 토글 (오시는 길과 동일한 방식)
--------------------------------------------------------- */
function initStoryToggle() {
  const btn = document.getElementById("btnStoryToggle");
  const panel = document.getElementById("storyPanel");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const isOpen = btn.classList.toggle("is-open");
    // 이미지가 많고 지연 로딩(loading="lazy")되는 콘텐츠라 scrollHeight가
    // 열 때마다 달라질 수 있어, 실제 높이 대신 충분히 큰 고정값을 사용
    panel.style.maxHeight = isOpen ? "20000px" : "0px";
  });
}

/* ---------------------------------------------------------
   00. 메인 이미지 - 스케치->색칠 크로스페이드, 잎사귀 순차 등장, 타이핑 효과
--------------------------------------------------------- */
function initIntroStage() {
  const stage = document.getElementById("introStage");
  if (!stage) return;

  // 1) 프레임 크로스페이드: 1초마다 다음 이미지로, 마지막 프레임에서 정지
  const frames = Array.from(stage.querySelectorAll(".intro-frame-img"));
  let frameIdx = 0;
  if (frames.length > 1) {
    const frameTimer = setInterval(() => {
      frameIdx++;
      if (frameIdx >= frames.length) {
        clearInterval(frameTimer);
        return;
      }
      frames.forEach((f) => f.classList.remove("is-active"));
      frames[frameIdx].classList.add("is-active");
    }, 1000);
  }

  // 2) 잎사귀 순차 등장 - 스크롤해서 화면에 들어올 때마다 하나씩 나타나며 흔들리기 시작
  //    (메인 이미지 구간은 로드 즉시 화면에 보이므로 바로 등장하고,
  //     가족 이름 문구 옆 잎사귀는 그 지점까지 스크롤했을 때 등장한 뒤 더는 늘어나지 않음)
  const leaves = Array.from(document.querySelectorAll(".intro-leaf")).sort((a, b) => {
    return (Number(a.dataset.seq) || 0) - (Number(b.dataset.seq) || 0);
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry, idx) => {
          if (!entry.isIntersecting) return;
          const leaf = entry.target;
          observer.unobserve(leaf);
          setTimeout(() => {
            leaf.classList.add("is-visible");
          }, idx * 130);
        });
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );
    leaves.forEach((leaf) => revealObserver.observe(leaf));
  } else {
    // IntersectionObserver를 지원하지 않는 아주 오래된 브라우저를 위한 대체 동작
    leaves.forEach((leaf, i) => {
      setTimeout(() => leaf.classList.add("is-visible"), 250 + i * 420);
    });
  }

  // 3) 메인 이미지 아래 예식 정보 타이핑 효과
  const infoEl = document.getElementById("introCeremonyInfo");
  if (infoEl) {
    const lines = ["2027.04.18(일) 오전 11시", "로프트가든344"];
    const sequence = [];
    lines.forEach((line, li) => {
      if (li > 0) sequence.push("\n");
      Array.from(line).forEach((ch) => sequence.push(ch));
    });
    infoEl.textContent = "";
    let i = 0;
    const typeNext = () => {
      if (i >= sequence.length) return;
      const token = sequence[i];
      if (token === "\n") {
        infoEl.appendChild(document.createElement("br"));
      } else {
        infoEl.appendChild(document.createTextNode(token));
      }
      i++;
      setTimeout(typeNext, 105);
    };
    setTimeout(typeNext, 500);
  }
}

/* ---------------------------------------------------------
   12. 청첩장 공유하기 - 링크 복사
--------------------------------------------------------- */
function initShareButtons() {
  const copyBtn = document.getElementById("btnCopyLink");

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const url = window.location.href;
      if (typeof copyToClipboard === "function") {
        copyToClipboard(url);
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
      }
      if (typeof showToast === "function") {
        showToast("청첩장 링크가 복사되었습니다.");
      }
    });
  }
}

/* ---------------------------------------------------------
   13. 우리들의 이야기 - 각 장면은 스크롤로 들어오면 시작되고,
       장면 안에서는 정해진 시간차로 순서대로 나타남
--------------------------------------------------------- */
function initStoryTimeline() {
  const scroll = document.getElementById("storyScroll");
  const btn = document.getElementById("btnStoryToggle");
  if (!scroll || !btn) return;

  const bubbleHello = document.getElementById("bubbleHello");
  const storyCrossfade = document.getElementById("storyCrossfade");
  const bubbleBest = document.getElementById("bubbleBest");
  const bubbleBestLine1 = document.getElementById("bubbleBestSvgLine1");
  const bubbleBestLine2 = document.getElementById("bubbleBestSvgText");
  const BUBBLE_BEST_LINE1 = "내 생애 최고의";
  const BUBBLE_BEST_LINE2 = "여자!\u00A0\u00A0\u00A0남자!";

  const show = (el) => {
    if (el) el.classList.add("is-visible");
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* 요소가 스크롤로 화면에 들어오면 한 번만 콜백 실행
     (IntersectionObserver 미지원 브라우저는 그냥 바로 실행) */
  function revealOnScroll(el, onEnter, opts) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      onEnter();
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);
          onEnter();
        });
      },
      opts || { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.2 }
    );
    io.observe(el);
  }

  /* 타임라인 한 줄(연도 뱃지 + 좌우 사진): 화면에 들어오면
     뱃지가 뜸을 들였다가, 그 뒤 좌/우 사진이 나타남.
     2024(마지막) 줄은 사진이 다 뜬 뒤 "안녕!" 말풍선 →
     그 다음 만남 문장(#storyMeetLine) 순서로 이어짐 */
  function revealTimelineRow(row, isLast) {
    show(row);
    setTimeout(() => {
      show(row.querySelector(".timeline-badge-img"));
    }, 450);
    setTimeout(() => {
      show(row.querySelector(".timeline-img--l"));
      show(row.querySelector(".timeline-img--r"));

      if (isLast) {
        setTimeout(() => {
          show(bubbleHello);
          setTimeout(() => {
            show(document.getElementById("storyMeetLine"));
          }, 850);
        }, 900);
      }
    }, 950);
  }

  /* 스크롤을 빨리 내려서 여러 줄이 한꺼번에 뷰포트에 걸려도,
     한 줄씩 최소 간격을 두고 순서대로 나타나게 줄을 세움 */
  let rowRevealQueue = Promise.resolve();
  function queueTimelineRow(row, isLast) {
    rowRevealQueue = rowRevealQueue.then(
      () =>
        new Promise((resolve) => {
          revealTimelineRow(row, isLast);
          setTimeout(resolve, 900);
        })
    );
  }

  /* 밤 공원 4컷: 화면 중간쯤 들어오면 시작, 이후엔 스크롤과 상관없이
     시간에 따라 1 → 2 → 3 → 4로 넘어감. 다 끝나야 다음 문장이 나타남 */
  async function playNightSequence() {
    if (!storyCrossfade) return;
    const frames = Array.from(
      storyCrossfade.querySelectorAll(".crossfade-img")
    );
    const sparkleEls = Array.from(
      storyCrossfade.querySelectorAll(".story-sparkle")
    );

    const preciousLine = document.getElementById("storyPreciousLine");

    if (frames.length < 4) {
      show(storyCrossfade);
      show(preciousLine);
      return;
    }

    show(storyCrossfade);
    frames.forEach((frame, i) => frame.classList.toggle("is-active", i === 0));

    await wait(2100);

    for (let i = 1; i < 4; i++) {
      sparkleEls.forEach((el) => el.classList.remove("is-visible"));
      frames[i].classList.add("is-active");
      const sparkle = sparkleEls[i - 1];
      if (sparkle) {
        requestAnimationFrame(() => sparkle.classList.add("is-visible"));
      }
      await wait(i === 3 ? 2300 : 1600);
      frames[i - 1].classList.remove("is-active");
    }

    /* 4컷 전환이 완전히 끝난 뒤에 "서로의 가장 소중한 사람이..." 등장 */
    await wait(600);
    show(preciousLine);
  }

  /* 텍스트를 한 글자씩 타이핑하듯 채움 (다 채워질 때까지 대기 가능) */
  function typeText(el, full, speed) {
    return new Promise((resolve) => {
      if (!el) {
        resolve();
        return;
      }
      el.textContent = "";
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        el.textContent = full.slice(0, i);
        if (i >= full.length) {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  /* 말풍선 두 줄("내 생애 최고의" → "여자!   남자!") 모두 순서대로 타이핑 */
  async function typeBubbleBestAll() {
    await typeText(bubbleBestLine1, BUBBLE_BEST_LINE1, 100);
    await wait(200);
    await typeText(bubbleBestLine2, BUBBLE_BEST_LINE2, 110);
  }

  /* 갤러리 체인: 사진 → 자막이 다 뜨면 → 다음 사진 → ...
     마지막엔 자막 → 텐트 사진 → 말풍선(전부 타이핑) → "이제는..." 순서로
     시간차를 두고 나타남 */
  async function playGalleryChain(gallery) {
    const children = Array.from(gallery.children);

    for (const child of children) {
      if (
        child.classList.contains("story-panel") &&
        child.classList.contains("reveal")
      ) {
        show(child);
        await wait(500);
        continue;
      }

      if (child.classList.contains("story-line")) {
        show(child);
        await wait(1700);
        continue;
      }

      if (child.classList.contains("story-panel-wrap")) {
        const tentImg = child.querySelector(".story-panel.reveal");
        show(tentImg);
        await wait(1600);

        if (bubbleBest) {
          show(bubbleBest);
          await wait(300);
          await typeBubbleBestAll();
          await wait(1100);
        }
        continue;
      }
    }

    /* 말풍선까지 다 뜬 뒤에 마지막으로 "이제는 같은 길을..." 등장 */
    show(document.getElementById("storyFinalLine"));
  }

  function setupScrollReveal() {
    const rows = scroll.querySelectorAll(".story-timeline .timeline-row");
    rows.forEach((row, idx) =>
      revealOnScroll(row, () => queueTimelineRow(row, idx === rows.length - 1), {
        root: null,
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.25,
      })
    );

    /* .story-scroll 바로 아래 문장 중 첫 문장만 독립적으로 스크롤 트리거.
       - "서로의 가장 소중한..."(#storyPreciousLine)은 밤 공원 시퀀스 뒤
       - "운동하는 곳에서..."(#storyMeetLine)는 2024 줄 → 안녕! 말풍선 뒤
       - "이제는 같은 길을..."(#storyFinalLine)은 갤러리 체인의 맨 마지막
       각각 별도 타이밍에서 직접 띄우므로 여기서는 제외 */
    const topLevelLines = scroll.querySelectorAll(
      ".story-scroll > .story-line:not(#storyPreciousLine):not(#storyMeetLine):not(#storyFinalLine)"
    );
    topLevelLines.forEach((line) => revealOnScroll(line, () => show(line)));

    /* 밤 공원 구간이 화면 중간쯤 들어오면 시작.
       다음 문장("서로의 가장 소중한 사람이...")은 이 시퀀스가
       다 끝난 뒤 playNightSequence 안에서 직접 띄움 */
    revealOnScroll(storyCrossfade, () => playNightSequence(), {
      root: null,
      rootMargin: "-45% 0px -45% 0px",
      threshold: 0,
    });

    const gallery = scroll.querySelector(".story-gallery");
    revealOnScroll(gallery, () => playGalleryChain(gallery), {
      root: null,
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.1,
    });
  }

  /* 패널을 여는 순간 한 번만: 펼쳐지는 애니메이션이 끝난 뒤
     (실제 레이아웃이 자리 잡은 뒤) 스크롤 감지를 시작 */
  let started = false;
  btn.addEventListener("click", () => {
    if (!btn.classList.contains("is-open")) return;
    if (started) return;
    started = true;
    setTimeout(setupScrollReveal, 400);
  });
}


/* ---------------------------------------------------------
   14. 오른쪽 아래 고정된 배경음악 버튼이, 스크롤 중 다른 버튼과
       화면상 겹쳐서 그 버튼의 클릭을 가로채는 것을 방지
--------------------------------------------------------- */
function initMusicButtonOverlapGuard() {
  const musicBtn = document.getElementById("btnMusicToggle");
  if (!musicBtn) return;

  const targets = Array.from(
    document.querySelectorAll(
      "#btnStoryToggle, #btnRsvpToggle, #btnGuideToggle, .map-btn, .copy-chip"
    )
  );
  if (!targets.length) return;

  function overlaps(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  function update() {
    const musicRect = musicBtn.getBoundingClientRect();
    const hit = targets.some((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && overlaps(musicRect, r);
    });
    /* 겹칠 때만 음악 버튼의 클릭을 잠시 꺼서, 밑에 있는 버튼이 눌리게 함 */
    musicBtn.style.pointerEvents = hit ? "none" : "";
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  });
  window.addEventListener("resize", update);
  update();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  initIntroStage();
  initAccountAccordion();
  initRadioPills();
  initTreeModal();
  initTreePickModal();
  initMessageForm();
  initGardenCarousel();
  initRsvpToggle();
  initRsvpModal();
  initRsvpForm();
  initAdmin();
  initSnapUpload();
  initLocationInfo();
  initStoryToggle();
  initStoryTimeline();
  initMusicButtonOverlapGuard();
  initShareButtons();
});
