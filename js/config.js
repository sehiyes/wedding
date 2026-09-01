/* =========================================================
   config.js
   ---------------------------------------------------------
   청첩장의 모든 텍스트/정보/이미지 경로/링크를 여기서만 관리합니다.
   코드 전체를 뒤질 필요 없이 이 파일만 수정하면 청첩장 내용이 바뀝니다.
   ========================================================= */

// ---------------------------------------------------------
// 1. 기본 정보
// ---------------------------------------------------------
const WEDDING_INFO = {
  groomName: "최종윤",
  brideName: "임세희",

  // 맨 위 히어로 영역에 크게 표시할 애칭/영문 이름 (예: JJONGPA, SAY)
  groomNickname: "JJONGPA",
  brideNickname: "SAY",

  groomFather: "최진원",
  groomMother: "함옥경",
  groomOrder: "장남", // 장남 / 차남 / 삼남 등

  brideFather: "임호진",
  brideMother: "이정혜",
  brideOrder: "장녀", // 장녀 / 차녀 / 삼녀 등

  // YYYY-MM-DD, 시간 문자열은 표시용
  weddingDate: "2027-04-18",
  weddingDateDisplay: "2027년 4월 18일 일요일 오전 11시",
  weddingTime: "오전 11시",

  weddingHall: "로프트가든 344",
  address: "서울 양천구 오목로 344 청학빌딩",
  addressDetail: "건물 주차 2시간 무료, 공영주차장 3시간 무료",

  subway: "5호선 오목교역 7번 출구 앞",
  bus:
    "오목교역 4번 출구 / 5012, 5616, 6211, 640, 650, 6625, 6628, 6629, 6630, N64\n" +
    "오목교역 5번 출구 / 5012, 6211, 640, 650, 6628, 6629, 6630, 6640A, N64\n" +
    "오목교역 6번 출구 / 6640A\n" +
    "오목교역 7번 출구 / 6624, 6640B",
  parking:
    "전용주차장 / 서울 양천구 오목로 344 청학빌딩 (2시간 무료)\n" +
    "공영주차장 / 서울 양천구 목동동로 298 (3시간 무료｜동시 800대 주차가능)",
  tel: "02-2644-7823",

  // 지도 - 실제 좌표/장소로 교체해서 사용하세요
  naverMapUrl: "https://naver.me/xyTG8t3T",
  // 카카오맵 "바로가기" 버튼 + 지도 이미지 클릭 시 이동할 정확한 위치 링크
  kakaoMapUrl: "https://kko.to/5Asc9FFPZc",

  // 티맵 "바로가기" - 아래 latitude/longitude를 채우면 정확한 길안내 링크가
  // 자동으로 만들어집니다. (둘 다 비워두면 이름만으로 열리는 링크를 사용합니다)
  // tmapUrl에 직접 링크를 넣으면 그 값이 최우선으로 사용됩니다.
  latitude: "37.524225996587",
  longitude: "126.87549984005",
  tmapUrl: "",

  // 카카오맵 정적 지도 이미지 (실제 지도 화면을 이미지로 보여줌)
  // 카카오맵(map.kakao.com, PC 웹)에서 웨딩홀 검색 → 지도 위 공유/내보내기 아이콘 →
  // "HTML 태그 복사" → 나오는 소스코드 안의 <img src="https://staticmap.kakao.com/..."> 주소를
  // 그대로 붙여넣으세요. (지도가 클릭되면 위 kakaoMapUrl로 이동합니다)
  kakaoStaticMapImageUrl:
    "https://staticmap.kakao.com/map/mapservice?FORMAT=PNG&SCALE=2.5&MX=472475&MY=1117967&S=0&IW=504&IH=310&LANG=0&COORDSTM=WCONGNAMUL&logo=kakao_logo",

  // 마음 전하실 곳 - 신랑/신부 본인 + 양가 부모님까지 원하는 만큼 추가/삭제 가능
  // group: 아코디언을 묶어서 보여줄 그룹 이름 ("신랑측" / "신부측")
  // label: 토글 버튼에 표시될 이름
  accounts: [
    { group: "신랑측", label: "신랑 최종윤", bank: "신한은행", account: "110-357-302158", holder: "최종윤" },
    { group: "신랑측", label: "신랑 아버지 최진원", bank: "국민은행", account: "", holder: "최진원" },
    { group: "신랑측", label: "신랑 어머니 함옥경", bank: "국민은행", account: "", holder: "함옥경" },
    { group: "신부측", label: "신부 임세희", bank: "카카오뱅크", account: "3333-03-0127045", holder: "임세희" },
    { group: "신부측", label: "신부 아버지 임호진", bank: "국민은행", account: "", holder: "임호진" },
    { group: "신부측", label: "신부 어머니 이정혜", bank: "국민은행", account: "", holder: "이정혜" },
  ],
};

// ---------------------------------------------------------
// 1-1. Supabase 연결 정보
//   - Supabase 대시보드 → Project Settings → API 에서 확인
//   - URL과 anon public key는 공개되어도 되는 값입니다.
//     (실제 데이터 보호는 supabase/schema.sql의 RLS 정책이 담당합니다)
//   - 관리자 코드는 여기가 아니라 supabase/schema.sql에서 설정합니다.
// ---------------------------------------------------------
const SUPABASE_URL = "https://iqyifctnlpisejuekohx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxeWlmY3RubHBpc2VqdWVrb2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTEzOTYsImV4cCI6MjEwMzUyNzM5Nn0.mJ5YO8kVfKU2K2Dq-asdm-9TL65gd1wJ0thANSqLS3k";

// ---------------------------------------------------------
// 1-2. 스냅 작가 사진 업로드 - Google Apps Script 웹앱 연결 정보
//   - apps-script/Code.gs를 배포한 뒤 나오는 웹앱 URL을 붙여넣으세요.
//   - uploadToken은 Code.gs 안의 UPLOAD_TOKEN과 반드시 동일해야 합니다.
//     (민감한 비밀번호가 아니라, 무작위 스팸 업로드를 막기 위한 가벼운 장치입니다)
// ---------------------------------------------------------
const PHOTO_UPLOAD = {
  appsScriptUrl: "https://script.google.com/macros/s/YOUR-DEPLOYMENT-ID/exec",
  uploadToken: "wedding0418",
  maxFileSizeMB: 50,
  maxFiles: 100,
};

// ---------------------------------------------------------
// 2. 초대 문구 (마음대로 수정 가능)
// ---------------------------------------------------------
const INVITATION_TEXT = {
  greetingLines: [
    "따스한 햇살과 바람이 좋은 날,",
    "저희 두 사람이 사랑과 신뢰로",
    "하나의 결실을 맺고자 합니다.",
    "",
    "소박하지만 진실된 마음으로",
    "서로를 아끼며 살아가겠습니다.",
    "",
    "귀한 걸음 하시어 축복해주시면",
    "큰 기쁨으로 간직하겠습니다.",
  ],

  rsvpIntro: "부담 없이 편하게 알려주세요.\n소중한 걸음, 미리 알려주시면\n준비하는 데 큰 도움이 됩니다.",

  snapTitle: "하객 스냅",
  snapDescription: "앞만 보고 걷느라 저희는 미처 보지 못했던\n그날의 순간을 공유해주세요.",
};

// ---------------------------------------------------------
// 3. 이미지 경로 - 파일만 넣으면 자동으로 반영됩니다.
//    (없는 파일은 자동으로 걸러지고 깨진 이미지가 보이지 않습니다)
// ---------------------------------------------------------
const MAIN_IMAGES = ["images/main/1.jpg", "images/main/2.jpg", "images/main/3.jpg"];

const STORY_IMAGES_COUNT = 6; // story 폴더에 넣을 예정 개수(넉넉히). 실제 없는 파일은 자동 제외.

const storyData = [
  {
    image: "images/story/1.jpg",
    date: "2023.05",
    title: "우리의 첫 만남",
    description: "우연히 시작된 인연이 계속 이어졌어요.",
  },
  {
    image: "images/story/2.jpg",
    date: "2023.09",
    title: "함께한 첫 여행",
    description: "낯선 곳에서도 편안했던 우리.",
  },
  {
    image: "images/story/3.jpg",
    date: "2024.12",
    title: "프러포즈",
    description: "떨리는 마음으로 건넨 반지.",
  },
  {
    image: "images/story/4.jpg",
    date: "2025.03",
    title: "상견례",
    description: "두 가족이 처음 만난 날.",
  },
  {
    image: "images/story/5.jpg",
    date: "2027.04",
    title: "우리의 결혼식",
    description: "이제 하나가 되는 날.",
  },
];

const GALLERY_IMAGES_COUNT = 12; // gallery 폴더에 넣을 예정 개수(넉넉히). 없는 파일은 자동 제외.

// ---------------------------------------------------------
// 4. 이미지 폴더 경로 prefix (파일명은 1.jpg, 2.jpg ... 순서로)
// ---------------------------------------------------------
const IMAGE_PATHS = {
  main: (n) => `images/main/${n}.jpg`,
  story: (n) => `images/story/${n}.jpg`,
  gallery: (n) => `images/gallery/${n}.jpg`,
};
