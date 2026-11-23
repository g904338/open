/*
 * 衛教單「生活小叮嚀」項目
 * ------------------------------------------------------------
 * 系統依病人的年齡、腎功能與用藥「建議勾選」，藥師確認後才會印在衛教單上。
 *
 * GROUPS：用藥分組，keys = 藥品學名小寫，tags = Beers 字典標籤（data/beers2023.js）
 * TIPS：  { id, cat 分類, text 給民眾看的文字, when 建議條件 }
 *   when 條件（任一成立即建議勾選）：
 *     always: true          一律建議
 *     elderly: true         年齡 ≥ 65
 *     renal: true           腎功能 G3a 以下或洗腎
 *     manyDrugs: n          藥品數 ≥ n
 *     groups: ['bp', ...]   有使用該分組的藥
 *   不寫 when 的項目預設不勾選，由藥師自行決定。
 */
var TIP_GROUPS = {
  diabetes:  { keys: ['metformin', 'sitagliptin', 'dapagliflozin', 'empagliflozin', 'canagliflozin'], tags: ['sulfonylurea', 'sglt2'] },
  bp:        { keys: ['amlodipine', 'losartan', 'nifedipine'], tags: ['ras', 'alpha1', 'central_alpha', 'diuretic'] },
  anticoag:  { keys: ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin', 'aspirin', 'clopidogrel', 'prasugrel'], tags: [] },
  warfarin:  { keys: ['warfarin'], tags: [] },
  sedative:  { keys: [], tags: ['benzo', 'zdrug', 'barbiturate'] },
  cns:       { keys: ['gabapentin'], tags: ['cns', 'muscle_relaxant'] },
  painkiller:{ keys: ['celecoxib'], tags: ['nsaid'] },
  gout:      { keys: ['allopurinol', 'colchicine'], tags: [] },
  chelate:   { keys: ['levofloxacin', 'ciprofloxacin'], tags: [] },
  grapefruit:{ keys: ['amlodipine', 'nifedipine'], tags: [] },
  alcohol:   { keys: ['metformin', 'acetaminophen', 'gabapentin'], tags: ['benzo', 'zdrug', 'opioid'] }
};

var TIP_CATS = ['用藥習慣', '飲食', '運動與活動', '睡眠', '自我照顧'];

var TIPS = [
  // 用藥習慣
  { id: 'bag', cat: '用藥習慣', text: '看病時，請帶著所有的藥袋（包含保健食品、自己買的藥）', when: { always: true } },
  { id: 'pillbox', cat: '用藥習慣', text: '用藥盒把每天的藥分裝好，避免忘記吃或重複吃', when: { elderly: true, manyDrugs: 5 } },
  { id: 'missed', cat: '用藥習慣', text: '忘記吃藥時，不要一次吃兩倍的量；不確定怎麼補吃，請問藥師' },
  { id: 'otc', cat: '用藥習慣', text: '不要自己買止痛藥、感冒藥、中草藥或偏方，買藥前先問藥師', when: { renal: true, elderly: true } },
  { id: 'tellkidney', cat: '用藥習慣', text: '去其他科看病或到藥局買藥時，主動說「我的腎臟不好」', when: { renal: true } },
  { id: 'chelate', cat: '用藥習慣', text: '鈣片、鐵劑、胃乳片要和其他藥隔開 2 小時吃', when: { groups: ['chelate'] } },
  { id: 'storage', cat: '用藥習慣', text: '藥品放在陰涼乾燥的地方，不要讓小孩拿到' },
  { id: 'nostop', cat: '用藥習慣', text: '覺得身體變好了，也不要自己停藥或減藥，請先問醫師', when: { groups: ['bp', 'anticoag', 'diabetes'] } },

  // 飲食
  { id: 'lowsalt', cat: '飲食', text: '吃清淡一點：少吃醃漬、加工食品和湯汁，一天的鹽不超過一茶匙', when: { groups: ['bp'] } },
  { id: 'sugar', cat: '飲食', text: '少喝含糖飲料、少吃甜食；白飯、麵等主食適量', when: { groups: ['diabetes'] } },
  { id: 'meals', cat: '飲食', text: '三餐定時吃，不要餓一餐；身上隨時帶幾顆糖果，以防血糖太低', when: { groups: ['diabetes'] } },
  { id: 'greens', cat: '飲食', text: '綠色蔬菜每天吃的量盡量固定，不要突然吃很多或完全不吃', when: { groups: ['warfarin'] } },
  { id: 'kidneydiet', cat: '飲食', text: '腎臟不好：少吃加工食品，不要自己吃低鈉鹽；每天喝多少水請依醫師建議', when: { renal: true } },
  { id: 'gout', cat: '飲食', text: '多喝水；少吃內臟、海鮮、濃湯，少喝酒', when: { groups: ['gout'] } },
  { id: 'grapefruit', cat: '飲食', text: '不要喝太多葡萄柚汁', when: { groups: ['grapefruit'] } },
  { id: 'alcohol', cat: '飲食', text: '吃藥期間不要喝酒', when: { groups: ['alcohol'] } },
  { id: 'protein', cat: '飲食', text: '每餐都要有蛋、豆、魚、肉，維持肌肉力量' },

  // 運動與活動
  { id: 'exercise', cat: '運動與活動', text: '依自己的體力規律活動，例如散步、簡單的肌力訓練，每週累積 150 分鐘', when: { groups: ['bp', 'diabetes'] } },
  { id: 'slowup', cat: '運動與活動', text: '起床、站起來時動作放慢：先坐一下，不頭暈再站起來', when: { groups: ['bp', 'sedative', 'cns'] } },
  { id: 'home', cat: '運動與活動', text: '家裡保持明亮、地上不放雜物，浴室鋪止滑墊，預防跌倒', when: { elderly: true } },
  { id: 'bleedsafe', cat: '運動與活動', text: '避免容易碰撞受傷的活動；刷牙用軟毛牙刷' },

  // 睡眠
  { id: 'sleeptime', cat: '睡眠', text: '每天固定時間睡覺、起床；下午以後少喝咖啡、濃茶', when: { groups: ['sedative'] } },
  { id: 'sleepbed', cat: '睡眠', text: '吃完安眠藥就直接上床；半夜起床先開燈，慢慢走', when: { groups: ['sedative'] } },
  { id: 'nap', cat: '睡眠', text: '白天午睡不要超過 30 分鐘' },

  // 自我照顧
  { id: 'bprecord', cat: '自我照顧', text: '每天量血壓並記錄下來，回診時給醫師看', when: { groups: ['bp'] } },
  { id: 'bgrecord', cat: '自我照顧', text: '依醫師建議量血糖並記錄下來', when: { groups: ['diabetes'] } },
  { id: 'blood', cat: '自我照顧', text: '依醫師安排定期回診抽血、驗尿', when: { renal: true, groups: ['warfarin'] } },
  { id: 'stool', cat: '自我照顧', text: '注意大便顏色，變黑或有血請馬上就醫', when: { groups: ['anticoag', 'painkiller'] } },
  { id: 'smoke', cat: '自我照顧', text: '戒菸；需要協助可以問藥師戒菸門診' },
  { id: 'vaccine', cat: '自我照顧', text: '長輩記得每年打流感疫苗，也可詢問肺炎鏈球菌疫苗' }
];

if (typeof module !== 'undefined' && module.exports) module.exports = { TIP_GROUPS: TIP_GROUPS, TIP_CATS: TIP_CATS, TIPS: TIPS };
