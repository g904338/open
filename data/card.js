/*
 * 用藥小卡：文字、分類與勾選規則
 * ------------------------------------------------------------
 * 小卡只印「看得懂、做得到」的內容：
 *   1. 用藥時間表：時段 → 藥的外觀、顆數、用途
 *   2. 生活提醒：每個主題一句話（飲食、防跌…）
 *   3. 注意（紅字）：需要馬上處理的狀況
 *
 * 多語言：STR.<lang> 內放所有會印出的固定文字。新增語言時複製 en 整段翻譯即可，
 *        tests/card.test.js 會檢查每個語言的 key 是否齊全。
 *        ⚠️ 翻譯稿請由母語人士核對後再上線。
 * 藥師在畫面上改過的句子會「原文照印」，不會翻譯。
 */
var CARD = (function () {

  /* ---------- 時段 ---------- */
  var SLOTS = ['bb', 'ab', 'bl', 'al', 'bd', 'ad', 'hs', 'prn'];

  /* ---------- 外觀 ---------- */
  var COLORS = ['white', 'yellow', 'pink', 'orange', 'red', 'blue', 'green', 'brown', 'purple', 'gray'];
  var SHAPES = ['round', 'oblong', 'oval', 'capsule', 'triangle', 'other'];
  var QTYS = [0.5, 1, 1.5, 2, 3];
  var UNITS = ['tab', 'pack'];

  /* ---------- 用途 ---------- */
  var PURPOSES = ['bp', 'dm', 'lipid', 'clot', 'pain', 'fever', 'stomach', 'gi', 'laxative', 'sleep', 'anxiety', 'mood', 'psych',
    'nerve', 'seizure', 'parkinson', 'dizzy', 'allergy', 'cough', 'asthma', 'uric', 'gout', 'antibiotic', 'diuretic', 'heart',
    'rhythm', 'prostate', 'bladder', 'muscle', 'thyroid', 'appetite', 'other'];

  /** Beers 字典標籤 → 用途；KEY_PURPOSE 可針對單一學名覆寫 */
  var TAG_PURPOSE = {
    fgah: 'allergy', antiparkinson_ac: 'parkinson', antispasmodic: 'gi', bladder_ac: 'bladder',
    aspirin: 'clot', warfarin: 'clot', rivaroxaban: 'clot', dabigatran: 'clot', edoxaban: 'clot', enoxaparin: 'clot', prasugrel: 'clot', dipyridamole: 'clot',
    nitrofurantoin: 'antibiotic', cipro: 'antibiotic', macrolide: 'antibiotic', tmpsmx: 'antibiotic',
    alpha1: 'bp', central_alpha: 'bp', nifedipine: 'bp', ras: 'bp', amiodarone: 'rhythm', dronedarone: 'rhythm', digoxin: 'heart',
    loop: 'diuretic', diuretic: 'diuretic', tca: 'mood', ssri: 'mood', snri: 'mood', mirtazapine: 'mood', antipsychotic: 'psych',
    lithium: 'psych', barbiturate: 'seizure', benzo: 'sleep', zdrug: 'sleep', gabapentinoid: 'nerve', antiepileptic: 'seizure',
    opioid: 'pain', nsaid: 'pain', muscle_relaxant: 'muscle', baclofen: 'muscle', sulfonylurea: 'dm', sglt2: 'dm',
    megestrol: 'appetite', desmopressin: 'bladder', ppi: 'stomach', h2ra: 'stomach', metoclopramide: 'gi', mineral_oil: 'laxative',
    colchicine: 'gout', probenecid: 'uric', theophylline: 'asthma'
  };
  var KEY_PURPOSE = {
    alprazolam: 'anxiety', lorazepam: 'anxiety', diazepam: 'anxiety', bromazepam: 'anxiety', clonazepam: 'anxiety',
    hydroxyzine: 'allergy', meclizine: 'dizzy', scopolamine: 'dizzy', codeine: 'cough', 'sacubitril-valsartan': 'heart',
    doxazosin: 'prostate', terazosin: 'prostate', clopidogrel: 'clot', apixaban: 'clot', levofloxacin: 'antibiotic',
    celecoxib: 'pain', carbamazepine: 'seizure', amitriptyline: 'nerve', nortriptyline: 'nerve', duloxetine: 'mood'
  };
  /** 依用途給預設時段（只是起點，藥師要依藥袋修改） */
  var PURPOSE_SLOTS = { sleep: ['hs'], stomach: ['bb'], fever: ['prn'] };

  /* ---------- 用藥分組（供提醒判斷） ---------- */
  var GROUPS = {
    diabetes:  { keys: ['metformin', 'sitagliptin', 'dapagliflozin', 'empagliflozin', 'canagliflozin'], tags: ['sulfonylurea', 'sglt2'] },
    hypoRisk:  { keys: [], tags: ['sulfonylurea'] },
    bp:        { keys: ['amlodipine', 'losartan', 'nifedipine'], tags: ['ras', 'alpha1', 'central_alpha', 'diuretic'] },
    anticoag:  { keys: ['apixaban', 'rivaroxaban', 'dabigatran', 'edoxaban', 'warfarin', 'aspirin', 'clopidogrel', 'prasugrel'], tags: [] },
    warfarin:  { keys: ['warfarin'], tags: [] },
    sedative:  { keys: [], tags: ['benzo', 'zdrug', 'barbiturate'] },
    cns:       { keys: ['gabapentin'], tags: ['cns', 'muscle_relaxant', 'fgah'] },
    gout:      { keys: ['allopurinol', 'colchicine'], tags: [] },
    rash:      { keys: ['allopurinol', 'carbamazepine', 'oxcarbazepine', 'phenytoin'], tags: [] },
    sickday:   { keys: ['metformin', 'dapagliflozin', 'empagliflozin', 'canagliflozin'], tags: [] },
    painkiller:{ keys: ['celecoxib'], tags: ['nsaid'] },
    nostop:    { keys: ['amlodipine', 'losartan', 'apixaban', 'rivaroxaban', 'dabigatran', 'warfarin'], tags: ['ras', 'benzo', 'antiepileptic'] }
  };

  /*
   * 生活提醒：每個主題一行，badge 為左側標籤。
   * variants 依序檢查 when，符合的句子合併（最多 max 句）；都不符合時用 fallback，且不預設勾選。
   * when: { always, elderly, renal, manyDrugs: n, flagged, groups: [...] }
   */
  var TOPICS = [
    { id: 'diet', badge: 'diet', max: 1, variants: [
      { when: { groups: ['diabetes'] }, text: 'diet_dm' },
      { when: { groups: ['warfarin'] }, text: 'diet_vk' },
      { when: { renal: true }, text: 'diet_kidney' },
      { when: { groups: ['bp'] }, text: 'diet_bp' },
      { when: { groups: ['gout'] }, text: 'diet_gout' }
    ], fallback: 'diet_gen' },
    { id: 'fall', badge: 'fall', max: 1, variants: [
      { when: { elderly: true, groups: ['bp', 'sedative', 'cns'] }, text: 'fall_up' },
      { when: { groups: ['sedative'] }, text: 'fall_night' }
    ], fallback: 'fall_up' },
    { id: 'exercise', badge: 'exercise', max: 1, variants: [
      { when: { groups: ['anticoag'] }, text: 'ex_safe' }
    ], fallback: 'ex_gen' },
    { id: 'sleep', badge: 'sleep', max: 1, variants: [
      { when: { groups: ['sedative'] }, text: 'sleep_bed' }
    ], fallback: 'sleep_gen' },
    { id: 'kidney', badge: 'kidney', max: 1, variants: [
      { when: { renal: true }, text: 'kidney_otc' }
    ], fallback: 'kidney_otc' },
    { id: 'meds', badge: 'meds', max: 1, variants: [
      { when: { manyDrugs: 5 }, text: 'meds_box' },
      { when: { always: true }, text: 'meds_bag' }
    ], fallback: 'meds_bag' },
    { id: 'measure', badge: 'measure', max: 1, variants: [
      { when: { groups: ['bp'] }, text: 'measure_bp' },
      { when: { groups: ['diabetes'] }, text: 'measure_bg' }
    ], fallback: 'measure_bp' },
    { id: 'recheck', badge: 'recheck', max: 1, variants: [
      { when: { flagged: true }, text: 'recheck_drugs' }
    ], fallback: 'recheck_gen' }
  ];

  /* 預設最多勾選幾項（依下列優先順序），避免下方 1/3 太擠；藥師可再自行加勾 */
  var SUGGEST_LIMIT = { topics: 4, alerts: 3 };
  var TOPIC_PRIORITY = ['recheck', 'diet', 'fall', 'kidney', 'meds', 'sleep', 'measure', 'exercise'];

  /* 注意（紅字）：符合 when 才預設勾選；陣列順序即優先順序 */
  var ALERTS = [
    { id: 'hypo', when: { groups: ['hypoRisk'] }, text: 'al_hypo' },
    { id: 'bleed', when: { groups: ['anticoag'] }, text: 'al_bleed' },
    { id: 'rash', when: { groups: ['rash'] }, text: 'al_rash' },
    { id: 'sleepy', when: { groups: ['sedative', 'cns'] }, text: 'al_sleepy' },
    { id: 'sick', when: { groups: ['sickday'] }, text: 'al_sick' },
    { id: 'nostop', when: { groups: ['nostop'] }, text: 'al_nostop' }
  ];

  /* ===================== 文字 ===================== */
  var STR = {
    zh: {
      langName: '中文',
      title: '{n}的用藥小卡',
      titleAnon: '我的用藥小卡',
      asDirected: '照藥袋',
      hon: { M: '先生', F: '女士', GM: '阿公', GF: '阿嬤' },
      honFmt: '{s}{h}',
      date: '日期',
      pharmacy: '有問題請問藥師',
      slot: { bb: '早餐前', ab: '早餐後', bl: '午餐前', al: '午餐後', bd: '晚餐前', ad: '晚餐後', hs: '睡前', prn: '需要時' },
      color: { white: '白色', yellow: '黃色', pink: '粉紅色', orange: '橘色', red: '紅色', blue: '藍色', green: '綠色', brown: '咖啡色', purple: '紫色', gray: '灰色' },
      shape: { round: '圓形', oblong: '長形', oval: '橢圓形', capsule: '膠囊', triangle: '三角形', other: '' },
      unit: { tab: '顆', pack: '包' },
      purpose: {
        bp: '降血壓', dm: '降血糖', lipid: '降血脂', clot: '預防血栓', pain: '止痛', fever: '止痛退燒', stomach: '胃藥', gi: '腸胃',
        laxative: '軟便', sleep: '幫助睡眠', anxiety: '放鬆、減少焦慮', mood: '穩定心情', psych: '精神科用藥', nerve: '神經痛',
        seizure: '預防癲癇', parkinson: '巴金森', dizzy: '頭暈', allergy: '抗過敏', cough: '止咳', asthma: '氣喘', uric: '降尿酸',
        gout: '痛風發作', antibiotic: '抗生素', diuretic: '排水（利尿）', heart: '心臟', rhythm: '控制心跳', prostate: '攝護腺',
        bladder: '頻尿', muscle: '放鬆肌肉', thyroid: '甲狀腺', appetite: '開胃', other: '其他'
      },
      badge: { diet: '飲食', fall: '防跌', exercise: '運動', sleep: '睡眠', kidney: '腎臟', meds: '用藥', measure: '量測', recheck: '回診', alert: '注意' },
      text: {
        diet_dm: '三餐定時吃，不要空腹吃降血糖藥',
        diet_vk: '綠色蔬菜每天吃的量要固定',
        diet_kidney: '不要用低鈉鹽，喝水量照醫師說的',
        diet_bp: '吃清淡，少吃醃漬和加工食品',
        diet_gout: '多喝水，少吃內臟、海鮮，少喝酒',
        diet_gen: '每餐都要有蛋、豆、魚或肉',
        fall_up: '起床先坐一下，再慢慢站起來',
        fall_night: '半夜起床先開燈，慢慢走',
        ex_safe: '可以散步，避免容易碰撞受傷的運動',
        ex_gen: '每天散步或做簡單運動約 30 分鐘',
        sleep_bed: '吃完安眠藥就上床，不要再走動',
        sleep_gen: '固定時間睡覺，下午以後少喝咖啡、茶',
        kidney_otc: '腎臟不好，不要自己買止痛藥、草藥',
        meds_box: '用藥盒分好每天的藥，避免忘記吃',
        meds_bag: '看病時帶著所有的藥袋',
        measure_bp: '每天量血壓，記下來給醫師看',
        measure_bg: '照醫師說的時間量血糖，記下來',
        recheck_drugs: '下次看病請帶這張卡，問醫師：{drugs}',
        recheck_gen: '請照時間回診，不要自己停藥',
        al_hypo: '冒冷汗、手抖、心悸，可能是低血糖，請先吃糖再聯絡藥師。',
        al_bleed: '大便變黑、吐血、流血止不住，請馬上就醫。',
        al_rash: '起疹子、嘴巴破、發燒，請停藥並馬上就醫。',
        al_sleepy: '吃了會想睡、頭暈，不要開車，也不要喝酒。',
        al_sick: '生病吃不下、一直吐或拉肚子時，請先問藥師哪些藥要暫停。',
        al_nostop: '覺得好了也不要自己停藥，有問題先問醫師或藥師。'
      }
    },
    en: {
      langName: 'English',
      title: "{n}'s Medication Card",
      titleAnon: 'My Medication Card',
      asDirected: 'As directed',
      hon: { M: 'Mr.', F: 'Ms.', GM: 'Grandpa', GF: 'Grandma' },
      honFmt: '{h} {s}',
      date: 'Date',
      pharmacy: 'Questions? Ask your pharmacist',
      slot: { bb: 'Before breakfast', ab: 'After breakfast', bl: 'Before lunch', al: 'After lunch', bd: 'Before dinner', ad: 'After dinner', hs: 'Bedtime', prn: 'When needed' },
      color: { white: 'white', yellow: 'yellow', pink: 'pink', orange: 'orange', red: 'red', blue: 'blue', green: 'green', brown: 'brown', purple: 'purple', gray: 'gray' },
      shape: { round: 'round', oblong: 'long', oval: 'oval', capsule: 'capsule', triangle: 'triangle', other: '' },
      unit: { tab: 'tablet', pack: 'pack' },
      purpose: {
        bp: 'Blood pressure', dm: 'Blood sugar', lipid: 'Cholesterol', clot: 'Prevent blood clots', pain: 'Pain', fever: 'Pain and fever', stomach: 'Stomach acid', gi: 'Stomach and bowel',
        laxative: 'Constipation', sleep: 'Sleep', anxiety: 'Anxiety', mood: 'Mood', psych: 'Mental health', nerve: 'Nerve pain',
        seizure: 'Seizures', parkinson: "Parkinson's", dizzy: 'Dizziness', allergy: 'Allergy', cough: 'Cough', asthma: 'Breathing', uric: 'Uric acid',
        gout: 'Gout attacks', antibiotic: 'Infection (antibiotic)', diuretic: 'Water pill', heart: 'Heart', rhythm: 'Heart rate', prostate: 'Prostate',
        bladder: 'Bladder', muscle: 'Muscle relaxant', thyroid: 'Thyroid', appetite: 'Appetite', other: 'Other'
      },
      badge: { diet: 'Food', fall: 'Falls', exercise: 'Exercise', sleep: 'Sleep', kidney: 'Kidneys', meds: 'Medicines', measure: 'Check', recheck: 'Doctor', alert: 'Warning' },
      text: {
        diet_dm: 'Eat 3 meals at regular times. Do not take blood sugar medicine on an empty stomach',
        diet_vk: 'Eat about the same amount of green vegetables every day',
        diet_kidney: 'Do not use low-sodium salt. Drink the amount of water your doctor says',
        diet_bp: 'Eat less salt, pickled and processed food',
        diet_gout: 'Drink plenty of water. Eat less organ meat and seafood. Drink less alcohol',
        diet_gen: 'Have eggs, beans, fish or meat at every meal',
        fall_up: 'When getting up, sit for a moment first, then stand up slowly',
        fall_night: 'At night, turn on the light before getting up and walk slowly',
        ex_safe: 'Walking is fine. Avoid activities where you could bump or get hurt',
        ex_gen: 'Walk or do light exercise for about 30 minutes a day',
        sleep_bed: 'After taking the sleeping pill, go straight to bed',
        sleep_gen: 'Go to bed at the same time. No coffee or tea after noon',
        kidney_otc: 'Weak kidneys: do not buy painkillers or herbal medicine on your own',
        meds_box: 'Use a pill box for each day so no dose is missed',
        meds_bag: 'Bring all medicine bags to every doctor visit',
        measure_bp: 'Check blood pressure every day and write it down for the doctor',
        measure_bg: 'Check blood sugar when the doctor says and write it down',
        recheck_drugs: 'At the next visit, bring this card and ask the doctor about: {drugs}',
        recheck_gen: 'Keep your follow-up visits. Do not stop medicines on your own',
        al_hypo: 'Cold sweat, shaking or a pounding heart may be low blood sugar. Eat sugar first, then call the pharmacist.',
        al_bleed: 'Black stool, vomiting blood, or bleeding that will not stop: see a doctor right away.',
        al_rash: 'Rash, mouth sores or fever: stop the medicine and see a doctor right away.',
        al_sleepy: 'May cause sleepiness or dizziness. Do not drive or drink alcohol.',
        al_sick: 'If too sick to eat, or vomiting or with diarrhea, ask the pharmacist which medicines to pause.',
        al_nostop: 'Do not stop medicines on your own, even if you feel better. Ask first.'
      }
    }
  };

  /** 顆數文字 */
  var QTY_FMT = {
    zh: function (q, unit) { var u = STR.zh.unit[unit]; return q === 0.5 ? '半' + u : q === 1.5 ? '1 ' + u + '半' : q + ' ' + u; },
    en: function (q, unit) { var u = STR.en.unit[unit]; var n = q === 0.5 ? '1/2' : q === 1.5 ? '1 1/2' : String(q); return n + ' ' + u + (q > 1 ? 's' : ''); }
  };
  /** 一行藥：外觀＋顆數 */
  var LOOK_FMT = {
    zh: function (color, shape, qty, unit, name) {
      var look = (color ? STR.zh.color[color] : '') + (shape ? STR.zh.shape[shape] : '');
      return (look || name) + ' ' + QTY_FMT.zh(qty, unit);
    },
    en: function (color, shape, qty, unit, name) {
      var u = unit;
      var look = [color ? STR.en.color[color] : '', shape && shape !== 'capsule' ? STR.en.shape[shape] : ''].filter(Boolean).join(' ');
      var noun = shape === 'capsule' ? 'capsule' : STR.en.unit[u];
      var n = qty === 0.5 ? '1/2' : qty === 1.5 ? '1 1/2' : String(qty);
      if (!look && shape !== 'capsule') return QTY_FMT.en(qty, u) + ' of ' + name;
      return n + ' ' + (look ? look + ' ' : '') + noun + (qty > 1 ? 's' : '');
    }
  };

  return {
    SLOTS: SLOTS, COLORS: COLORS, SHAPES: SHAPES, QTYS: QTYS, UNITS: UNITS, PURPOSES: PURPOSES,
    TAG_PURPOSE: TAG_PURPOSE, KEY_PURPOSE: KEY_PURPOSE, PURPOSE_SLOTS: PURPOSE_SLOTS,
    GROUPS: GROUPS, TOPICS: TOPICS, SUGGEST_LIMIT: SUGGEST_LIMIT, TOPIC_PRIORITY: TOPIC_PRIORITY, ALERTS: ALERTS, STR: STR, QTY_FMT: QTY_FMT, LOOK_FMT: LOOK_FMT,
    LANGS: Object.keys(STR)
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = CARD;
