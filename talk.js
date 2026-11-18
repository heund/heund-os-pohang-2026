/* ═══════════════════════════════════════════════════════════
   TALK SCRIPT: 한 칸 = 한 번의 클릭(→)
   포항에서 시작된 예술적 실험과 그 이후 · 2026.11.20

   ['open',   id, {from:'#icon'}]     창 열기 (아이콘에서 튀어나옴)
   ['close',  id] / ['closeAll']      창 닫기
   ['focus',  id]                     창을 맨 앞으로
   ['place',  id, {x,y,w,h}]          창 이동/크기 변경
   ['cursor', '#selector' | {x,y}]    커서 이동   ['hideCursor']
   ['click'] / ['dblclick']           클릭 효과
   ['select', '#selector']            아이콘/폴더 선택 표시
   ['press',  '#button']              버튼 누르기
   ['type',   '#selector']            타자 효과 (data-type 요소)
   ['mark',   '.hl 선택자', {stagger}] 형광펜
   ['scroll', id, '#target', offset]  창 안에서 스크롤
   ['camera', '#target' | null, zoom] 화면 줌 인 / 줌 아웃(null)
   ['show' | 'hide', '#selector']     메모, 챕터 등 보이기/숨기기
   ['chapterMap', {no, title, sub, chips}]  관계망 지도에서 챕터 표시 (해당 CV 줄과 연결된 사람 강조)
   ['focusNode', '#node-id' | null]   관계망에서 노드 하나만 강조
   ['wall',   'mint'|'yellow'|'pink'|'blue']  배경색
   ['add' | 'remove', '#selector', 'class']
   ['wait',   ms]
   ═══════════════════════════════════════════════════════════ */

/* 포항 지도 위 장소 (위도, 경도). 지도는 map.js (OpenStreetMap 데이터)
   side: 라벨 위치 r 오른쪽 · l 왼쪽 · t 위 · b 아래
   pal      OSM 'Pohang Accelerator Lab' 건물
   postech  OSM 포항공과대학교 캠퍼스 중심
   posco    OSM 포항제철소 부지 중 육지 한가운데 (부두 수면 제외)
   dongbin  선착로 78 (도로명 번호 기준 추정, 동빈내항 입구)
   space298 중앙로298번길 13 (육거리 · 중앙파출소 옆, 번호 기준 추정) */
window.PLACES = {
  pal:      { lat: 36.02352, lon: 129.31560, side: 't', c: 'var(--lilac)',  label: '포항가속기연구소' },
  postech:  { lat: 36.01808, lon: 129.32086, side: 'b', c: 'var(--blue)',   label: 'POSTECH' },
  river:    { lat: 36.00229, lon: 129.34500, side: 'b', c: 'var(--green)',  label: '형산강' },
  posco:    { lat: 36.00314, lon: 129.39612, side: 't', c: 'var(--coral)',  label: '포스코 포항제철소' },
  dongbin:  { lat: 36.04870, lon: 129.37160, side: 'r', c: 'var(--yellow)', label: '동빈문화창고1969' },
  space298: { lat: 36.03950, lon: 129.36770, side: 'l', c: 'var(--yellow)', label: 'Space298' },
  // 제주 지도 (jeju.js). OSM 'gallery 갤러리레미콘', 산지천 옆 원도심
  remicon:  { lat: 33.51426, lon: 126.52900, side: 'r', c: 'var(--green)',  label: '갤러리 레미콘 · 원도심' },
};

/* 지구 (globe.js): 첫 번째 장소에서 나머지로 선이 그어집니다 */
window.GLOBE_PLACES = [
  { lat: 36.03, lon: 129.37, side: 'r', c: 'var(--coral)', label: '포항', sub: 'Pohang' },
  { lat: 33.514, lon: 126.529, side: 'b', c: 'var(--green)', label: '제주', sub: '제5회 제주비엔날레' },
  { lat: 25.20, lon: 55.27, side: 'l', c: 'var(--lilac)', label: 'ISEA2026 Dubai', sub: '2026.11.13 온라인 발표' },
];
window.GLOBE_VIEW = { lat: 28, lon: 96, r: 390 };   // 줌아웃이 끝났을 때 지구 중심과 반지름

/* 《조우: 서천꽃밭》의 14개 장소 (앱의 data/locations.json · QR 장소 매핑 표)
   type: boundary 사방위 · civic 공공기관 · community 공동체 · venue 비엔날레 베뉴 */
window.ENC_PLACES = [
  { n: 1,  lat: 33.5155, lon: 126.5319, type: 'boundary',  ko: '복신미륵 동자복',     en: 'Bokshin Mireuk Dongjabok', bon: '삼승할망본풀이' },
  { n: 2,  lat: 33.5156, lon: 126.5153, type: 'boundary',  ko: '복신미륵 서자복',     en: 'Bokshin Mireuk Seojabok',  bon: '세경본풀이' },
  { n: 3,  lat: 33.5047, lon: 126.5294, type: 'boundary',  ko: '제주 삼성혈',         en: 'Samseonghyeol',            bon: '삼성신화' },
  { n: 4,  lat: 33.5180, lon: 126.5265, type: 'boundary',  ko: '탑동 방사탑',         en: 'Tapdong Bangsatap',        bon: '멩감본풀이' },
  { n: 5,  lat: 33.5100, lon: 126.5267, type: 'civic',     ko: '제이각',              en: 'Jeigak',                   bon: '초공본풀이' },
  { n: 6,  lat: 33.5133, lon: 126.5215, type: 'civic',     ko: '관덕정',              en: 'Gwandeokjeong',            bon: '마누라본풀이' },
  { n: 7,  lat: 33.5136, lon: 126.5220, type: 'civic',     ko: '제주목관아',          en: 'Jeju Mokgwana',            bon: '차사본풀이' },
  { n: 8,  lat: 33.5115, lon: 126.5263, type: 'community', ko: '동문시장',            en: 'Dongmun Market',           bon: '칠성본풀이' },
  { n: 9,  lat: 33.5114, lon: 126.5180, type: 'community', ko: '서문시장',            en: 'Seomun Market',            bon: '지장본풀이' },
  { n: 10, lat: 33.5143, lon: 126.5289, type: 'venue',     ko: '갤러리 레미콘',       en: 'Gallery Remicon',          bon: '문전본풀이' },
  { n: 11, lat: 33.5116, lon: 126.5225, type: 'venue',     ko: '제주아트플랫폼',      en: 'Jeju Art Platform',        bon: '삼공본풀이' },
  { n: 12, lat: 33.5109, lon: 126.5220, type: 'venue',     ko: '예술공간 이아',       en: 'Art Space IAa',            bon: '천지왕본풀이' },
  { n: 13, lat: 33.4526, lon: 126.4896, type: 'venue',     ko: '제주도립미술관',      en: 'Jeju Museum of Art',       bon: '이공본풀이', far: true },
  { n: 14, lat: 33.4486, lon: 126.6587, type: 'venue',     ko: '돌문화공원 오백장군 갤러리', en: 'Jeju Stone Park',  bon: '설문대할망 설화', far: true },
];
/* 지도 보기: 중심과 화면 가로 폭(km) */
window.ENC_VIEWS = {
  all: { lon: 126.574, lat: 33.481, km: 20 },
  old: { lon: 126.5240, lat: 33.5118, km: 2.6 },
};
window.ENC_CALLOUTS = [
  { lat: 33.5160, lon: 126.5236, text: '원도심 12곳', cls: 'only-all' },
];
/* 휴대폰으로 보여줄 조우 (assets/jeju/encounter/, 실제 앱을 조작해 녹화) — 한국어 / 영어 번갈아 */
window.ENC_NODES = [
  // title / action: the app's data/encounters/manifest.json (encounterTitleKo, coreActionKo)
  // how: the instruction each encounter shows on screen (scripts/encounters/nodes/…, minigames/…)
  { n: 1,  lang: 'ko', video: 'assets/jeju/encounter/node-01-ko.mp4', title: '아직 오지 않은 것을 지탱하는 경계',
    action: '한 손가락의 느린 쓸어올림으로 하나의 가능성이 사라지지 않도록 지킨다.',
    how: '선을 따라 한 손가락을 천천히 올리고 내리며, 마음속으로 소원을 빌어보세요.' },
  { n: 2,  lang: 'en', video: 'assets/jeju/encounter/node-02-en.mp4', title: '예상과 다른 존재를 위한 우회로',
    action: '경계를 반복해서 비껴 건너며 정해진 길 바깥에 다른 통로를 만든다.',
    how: '손끝으로 서자복의 표면을 따라가 보세요.' },
  { n: 4,  lang: 'en', video: 'assets/jeju/encounter/node-04-en.mp4', title: '공동체가 견딜 시간을 쌓기',
    action: '현무암을 하나씩 놓아 방사탑을 한 단씩 세우며, 바깥의 압력을 없애지 않고 그 경로를 돌린다.',
    how: '화면의 돌을 하나씩 올려 방사탑을 완성해보세요.' },
  { n: 5,  lang: 'ko', video: 'assets/jeju/encounter/node-05-ko.mp4', title: '판단하기 전에 여러 자리에서 목격하기',
    action: '하나의 사건을 세 개의 제한된 시점에서 보고 성급한 판정을 보류한다.',
    how: '제이각의 풍경에서 달라진 것을 찾아 눌러보세요.' },
  { n: 6,  lang: 'en', video: 'assets/jeju/encounter/node-06-en.mp4', title: '군중 사이의 간격과 통행을 조율하기',
    action: '서로 다른 권능을 제거하지 않고 지나갈 길과 머물 간격을 조절한다.',
    how: '과녁을 겨냥해 활을 쏴보세요.' },
  { n: 10, lang: 'ko', video: 'assets/jeju/encounter/node-10-ko.mp4', title: '선택적 통과와 좌정',
    action: '문턱을 통과하며 개인 식별성을 밖에 두고 조우만 안으로 들인다.',
    how: '문을 열고 집 안으로 들어가 보세요.' },
  { n: 11, lang: 'ko', video: 'assets/jeju/encounter/node-11-ko.mp4', title: '보이지 않는 위치를 선언하기',
    action: '아직 보이지 않는 곳에 한 점을 두고 그 선택의 결과를 지킨다.',
    how: '흑백 영화의 첫 장면을 구상하듯, 오직 검은색 하나로 지금 그리고 싶은 것을 자유롭게 그려보세요.' },
  { n: 12, lang: 'en', video: 'assets/jeju/encounter/node-12-en.mp4', title: '흩어진 그림을 다시 맞추기',
    action: '예술공간 이아의 두 나무 그림이 흩어진 뒤, 조각을 제자리로 옮겨 한 장면을 다시 세운다.',
    how: '퍼즐을 맞추며, 두 세계가 이루는 공존의 경계를 완성해 보세요.' },
  { n: 13, lang: 'ko', video: 'assets/jeju/encounter/node-13-ko.mp4', title: '꽃을 살림의 관계로 돌려보내기',
    action: '자신의 꽃을 공동의 틈에 내어놓고 끊어진 관계가 다시 움직이도록 지탱한다.',
    how: '제주도립미술관에서 당신만의 서천꽃밭 꽃을 한 송이 만들어보세요.' },
  { n: 14, lang: 'en', video: 'assets/jeju/encounter/node-14-en.mp4', title: '돌을 다듬는 연장을 손에 드는 자리',
    action: '작업대에 놓인 네 개의 연장을 하나씩 손에 들었다가 다시 내려놓으며, 돌을 다듬는 손의 자리를 익힌다.',
    how: '망치와 정을 골라 돌을 원하는 만큼 다듬어 보세요.' },
];

/* 관계망에서 노드를 클릭해 상세 창 열기 */
const visit = (node, win, { prev, reopen } = {}) => [
  ...(prev ? [['close', prev]] : []),
  ...(reopen ? [['open', 'map'], ['wait', 350]] : []),
  ['focusNode', node],
  ['cursor', `#${node} .node-ic`],
  ['click'],
  ['open', win, { from: `#${node}` }],
  ['cursor', { x: 1852, y: 640 }, { ms: 600 }],
];

window.TALK = [

  /* ── 들어가며: CV 한 줄에 담기지 않는 이야기 ── */

  { label: 'boot', do: [
    ['add', '#boot', 'is-booted'],
  ]},

  { label: '제목', do: [
    ['add', '#boot', 'is-off'],
    ['wait', 500],
    ['open', 'hello', { from: '#icon-hello' }],
    ['wait', 200],
    ['type', '#hello-type'],
    ['mark', '#hello-type .hl'],
  ]},

  { label: 'CV 열기', do: [
    ['cursor', { x: 980, y: 900 }, { ms: 0 }],
    ['cursor', '#icon-cv svg'],
    ['select', '#icon-cv'],
    ['dblclick'],
    ['open', 'cv', { from: '#icon-cv' }],
  ]},

  { label: '‘포항’ 검색', do: [
    ['cursor', '#cv-search'],
    ['click'],
    ['add', '[data-win="cv"]', 'is-searching'],
    ['type', '#cv-q'],
    ['add', '[data-win="cv"]', 'is-searched'],
    ['add', '#cv-body', 'is-filtered'],
    ['cursor', { x: 1560, y: 940 }, { ms: 600 }],
    ['scroll', 'cv', '#cv-pohang', 70],
    ['mark', '#cv-body li.match .hl', { stagger: 380 }],
    ['add', '#cv-body', 'is-tagged'],
  ]},

  { label: 'ISEA', do: [
    ['scroll', 'cv', '#cv-isea', 380],
    ['add', '#cv-isea', 'is-found'],
    ['mark', '#cv-isea .hl'],
    ['show', '#note-isea'],
  ]},

  { label: '찾을 수 없음', do: [
    ['open', 'alert'],
    ['cursor', '#alert-ok', { ms: 900 }],
  ]},

  { label: 'CV에 기록된 것', do: [
    ['cursor', '#alert-yes', { ms: 500 }],
    ['press', '#alert-yes'],
    ['hide', '.note'],
    ['open', 'map', { from: '#alert-yes' }],
    ['close', 'alert'],
    ['hideCursor'],
    ['add', '#map', 'is-chips'],
  ]},

  { label: '관계망', do: [
    ['add', '#map', 'is-linked'],
    ['wait', 2200],
  ]},

  { label: '질문', do: [
    ['open', 'question'],
    ['wait', 150],
    ['type', '#q-type'],
    ['mark', '#q-type .hl'],
  ]},

  /* ── 1. 2024 포항융합예술실험실 ── */

  { label: 'CH 01', do: [
    ['close', 'question'],
    ['wall', 'yellow'],
    ['chapterMap', { no: 'CHAPTER 01 · 2024', title: '포항융합예술실험실', sub: '새로운 사람들과 관점의 만남', chips: ['c24'] }],
  ]},

  { label: 'POSTECH',      do: visit('n-postech',  'd-postech') },
  { label: '형산강',        do: visit('n-river',    'd-river',   { prev: 'd-postech' }) },
  { label: '가속기연구소',   do: visit('n-pal',      'd-pal',     { prev: 'd-river' }) },
  { label: '관객 2024',     do: visit('n-citizens', 'd-aud24',   { prev: 'd-pal' }) },

  /* ── 2. 2025 《기술의 미학》 ── */

  { label: 'CH 02', do: [
    ['close', 'd-aud24'],
    ['hideCursor'],
    ['wall', 'pink'],
    ['chapterMap', { no: 'CHAPTER 02 · 2025', title: '《기술의 미학》', sub: '서로 다른 분야의 지식이 하나의 방법론이자 실험으로', chips: ['c25'] }],
  ]},

  { label: '명장님',        do: visit('n-posco',    'd-posco') },
  { label: '시민들 2025',   do: visit('n-citizens', 'd-cit25',   { prev: 'd-posco' }) },

  /* ── 3. 2026 국제적인 담론으로: 포항 → 세계 · ISEA2026 · 제주비엔날레 ── */

  { label: 'CH 03 포항 → 세계', do: [
    ['close', 'd-cit25'],
    ['close', 'hello'],
    ['close', 'cv'],
    ['hideCursor'],
    ['wall', 'blue'],
    ['globeStart', '#globe'],             // 첫 장면(포항 지도 전체)을 미리 그려 둠
    ['open', 'globe', { from: '#c27' }],  // 제주 《문전》 줄에서 지구 창이 열림 (제주 → ISEA 순서)
    ['close', 'map'],
    ['wait', 400],
    ['globe', '#globe'],
  ]},

  /* 제주비엔날레 《문전》: 지구의 '제주'에서 폴더 열기 → 작업 설명(munjeon.info) → 작가와의 대화 영상 */
  { label: '제주 · 폴더', do: [
    ['cursor', '#globe .gtag:nth-child(2) b'],
    ['dblclick'],
    ['open', 'jfolder', { from: '#globe .gtag:nth-child(2)' }],
    ['cursor', { x: 1600, y: 900 }, { ms: 600 }],
  ]},

  { label: '《조우: 서천꽃밭》', do: [
    ['cursor', '#jf-work .jf-thumb'],
    ['select', '#jf-work'],
    ['dblclick'],
    ['open', 'jeju', { from: '#jf-work' }],
    ['cursor', { x: 1852, y: 640 }, { ms: 600 }],
  ]},

  { label: '작가와의 대화', do: [
    ['close', 'jeju'],
    ['cursor', '#jf-video .jf-thumb'],
    ['select', '#jf-video'],
    ['dblclick'],
    ['open', 'jvideo', { from: '#jf-video' }],
    ['wait', 300],
    ['cursor', '[data-win="jvideo"] .vplay', { ms: 700 }],
    ['click'],
    ['hideCursor'],
    ['playVideo', '#jeju-video'],        // 창 안에서 재생 (K: 일시정지 / 재개)
    // 영상이 계속 재생되는 동안 영상 위 팝업:
    //   0:16 열림 · 앱만 강조 (갤러리 레미콘 · 《조우의 목격》 · 《바람, 질서》는 회색)
    //   0:30 섬 《조우의 목격》 강조 · 0:35 구름 《바람, 질서》까지 모두 작동
    //   0:41 모두가 연결된 관계 구조 강조 · 0:46 천천히 사라지며 영상으로 돌아감
    ['videoCues', '#jeju-video', [
      [16, [
        ['open', 'system', { from: '#jf-work' }],
        ['playVideo', '#sys-video'],
        ['playVideo', '#sys-island'],
        ['playVideo', '#sys-weather'],
      ]],
      [30, [['add', '#sys', 'on-a'], ['add', '#sys', 'on-b']]],
      [35, [['add', '#sys', 'on-c']]],
      [41, [['add', '#sys', 'on-d']]],
      [46, [['close', 'system', { fade: 1600 }]]],
    ]],
  ]},

  /* ISEA 논문: 지구의 'ISEA2026 Dubai'에서 열고, 한 클릭씩 해당 부분으로 이동하며 형광펜 */
  { label: 'ISEA 논문', do: [
    ['close', 'system'],
    ['close', 'jvideo'],
    ['close', 'jfolder'],
    ['wait', 300],
    ['cursor', '#globe .gtag:nth-child(3) b'],
    ['dblclick'],
    ['open', 'paper', { from: '#globe .gtag:nth-child(3)' }],
    ['hideCursor'],
  ]},

  // 두 쪽 펼침으로 바꾸고 조금 내려가 작품과 함께한 관객 사진(4–5쪽)을 보여줌. 검색 · 형광펜 없음
  { label: '관객 반응', do: [
    ['pdfMode', 'paper', 'spread'],
    ['scroll', 'paper', '.pdf-pg[data-p="4"]', -110],
  ]},

  { label: 'Acknowledgements', do: [
    ['pdfMode', 'paper', 'page'],
    ['scroll', 'paper', '.ack-area', 260],
    ['camera', '.ack-area', 2.3],       // 화면 확대
    ['mark', '.ack-area'],
    ['mark', '.g-ack-head'],
    ['mark', '.g-ack', { stagger: 380 }],
  ]},

  { label: 'ISEA2026', do: [
    ['camera', null],
    ['open', 'isea'],
  ]},

  // 썸네일로 열린 창 → 전체화면 버튼 클릭 → 전체화면에서 재생 버튼 클릭 → 재생
  { label: '발표 영상', do: [
    ['open', 'video'],
    ['wait', 500],
    ['cursor', '[data-win="video"] .b-max', { ms: 800 }],
    ['click'],
    ['maximize', 'video'],
    ['cursor', '[data-win="video"] .vplay', { ms: 700 }],
    ['click'],
    ['hideCursor'],
    ['playVideo', '#isea-video'],
  ]},

  /* ── 4. 마무리 ── */

  { label: 'CH 04', do: [
    ['closeAll'],
    ['hideCursor'],
    ['wall', 'mint'],
    ['focusNode', null],
    ['open', 'map'],
    ['wait', 300],
    ['chapterMap', { no: 'CHAPTER 04 · 마무리', title: '포항이라는 관계망에서 가능했던 것들', sub: '2024 → 2025 → 2026', chips: [] }],
  ]},

  { label: '관계망, 다시', do: [
    ['add', '#map', 'is-detailed'],
  ]},

  { label: '기획·지원 체계', do: visit('n-support', 'd-support') },

  { label: 'outro', do: [
    ['close', 'd-support'],
    ['focusNode', null],
    ['hideCursor'],
    ['open', 'outro'],
    ['wait', 150],
    ['type', '#o-type'],
    ['mark', '#o-type .hl'],
  ]},

  { label: '감사합니다', do: [
    ['closeAll'],
    ['add', '#end', 'is-on'],
  ]},
];
