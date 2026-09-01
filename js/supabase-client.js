/* =========================================================
   supabase-client.js
   Supabase 클라이언트 초기화 (js/config.js의 URL/KEY 사용)
   이 파일보다 먼저 https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
   스크립트가 로드되어 있어야 합니다. (index.html에 이미 추가되어 있음)
   ========================================================= */

let supabaseClient = null;

(function initSupabaseClient() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("YOUR-PROJECT-ID") ||
    SUPABASE_ANON_KEY.includes("YOUR-ANON-PUBLIC-KEY")
  ) {
    console.warn(
      "[wedding] Supabase 연결 정보가 설정되지 않았습니다. js/config.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 채워주세요."
    );
    return;
  }
  if (typeof window.supabase === "undefined") {
    console.error("[wedding] supabase-js 라이브러리가 로드되지 않았습니다.");
    return;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
