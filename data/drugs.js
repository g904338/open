/*
 * 藥品資料庫
 * ------------------------------------------------------------
 * 資料來源：健保署「健保用藥品項」所附之藥品仿單。
 *
 * ⚠️ 本檔為範例資料，內容依各藥品仿單常見記載整理，
 *    上線前必須由藥師逐筆對照「健保署最新版仿單」核對，
 *    並填入 nhiCode（健保代碼）、license（許可證字號）、insertVersion（仿單版本/日期），
 *    核對完成後將 verified 改為 true。未核對者在衛教單上會標示「資料待核對」。
 *
 * 欄位說明
 *  id            唯一代號
 *  generic       英文學名
 *  zh            中文成分名
 *  brands        商品名 [{ en, zh }]
 *  strength      常見含量
 *  nhiCode       健保代碼（可多個）
 *  license       衛福部許可證字號
 *  insertVersion 仿單版本 / 修訂日期
 *  verified      是否已由藥師對照仿單核對
 *  purpose       小卡上的用途分類（data/card.js PURPOSES）
 *  slots         預設服藥時段（bb 早餐前 ab 早餐後 bl/al 午餐前後 bd/ad 晚餐前後 hs 睡前 prn 需要時），藥師依藥袋修改
 *  use           用途（給病人看的白話文）
 *  howTo         用法（給病人看）
 *  sideEffects   常見副作用（給病人看）
 *  warnings      注意事項（給病人看）
 *  seekHelp      出現哪些狀況要立即就醫（給病人看）
 *  renal         腎功能劑量規則
 *     metric: 'crcl' | 'egfr'  仿單使用的腎功能指標
 *     tiers:  [{ min, max, level, clinician, patient }]   區間為 min <= 值 < max
 *     dialysis: { level, clinician, patient }
 *  level         ok 不需調整 / caution 注意 / adjust 需調整劑量 / avoid 不建議或禁用
 *  rules         其他條件規則（例：Apixaban 年齡/體重/肌酸酐三項符合兩項）
 *  elderly       老年人注意事項 { ageMin, level, clinician, patient }
 */
var DRUG_DB = [
  {
    id: 'metformin',
    generic: 'Metformin',
    zh: '二甲雙胍',
    brands: [{ en: 'Glucophage', zh: '庫魯化' }],
    strength: '500 mg / 850 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '糖尿病',
    purpose: 'dm', slots: ['ab', 'ad'],
    use: '降血糖藥，治療糖尿病。',
    howTo: '吃飯時或飯後馬上吃，比較不會胃不舒服。',
    sideEffects: ['噁心、拉肚子、吃不下（通常幾週後會改善）', '長期吃可能缺少維生素 B12，醫師會定期檢查'],
    warnings: ['要做電腦斷層等「需要打藥水」的檢查，或要開刀前，請先告訴醫師，可能要暫停幾天', '不要喝太多酒'],
    seekHelp: ['一直吐、肚子痛、喘不過氣、全身非常沒力氣或肌肉痠痛'],
    renal: {
      metric: 'egfr',
      tiers: [
        { min: 45, level: 'ok', clinician: '不需調整劑量；至少每年監測腎功能。', patient: '' },
        { min: 30, max: 45, level: 'adjust', clinician: '不建議新開始使用；已使用者評估效益與風險，可考慮減量（仿單建議每日上限約 1000 mg），並每 3–6 個月監測腎功能。', patient: '因為腎臟功能變差，這個藥的量可能要減少，請定期回診抽血檢查。' },
        { max: 30, level: 'avoid', clinician: '禁用（eGFR < 30）。', patient: '因為腎臟功能變差，這個藥可能不適合您，請盡快和醫師討論，不要自己停藥。' }
      ],
      dialysis: { level: 'avoid', clinician: '禁用。', patient: '洗腎的人通常不吃這個藥，請盡快和醫師確認。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人腎功能易下降，應定期監測腎功能並依此調整劑量。', patient: '年紀大了腎臟功能容易變差，請定期回診抽血。' }
  },
  {
    id: 'sitagliptin',
    generic: 'Sitagliptin',
    zh: '西他列汀',
    brands: [{ en: 'Januvia', zh: '佳糖維' }],
    strength: '25 / 50 / 100 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '糖尿病',
    purpose: 'dm', slots: ['ab'],
    use: '降血糖藥，幫助飯後血糖不要升太高。',
    howTo: '每天吃一次，飯前飯後都可以，盡量每天同一個時間吃。',
    sideEffects: ['鼻塞、喉嚨痛', '和其他降血糖藥一起吃時，可能發生低血糖'],
    warnings: ['低血糖時會冒冷汗、發抖、心跳快，請馬上吃糖果或喝含糖飲料'],
    seekHelp: ['肚子一直劇痛、痛到背後', '皮膚起水泡、全身起疹子'],
    renal: {
      metric: 'egfr',
      tiers: [
        { min: 45, level: 'ok', clinician: '100 mg 每日一次，不需調整。', patient: '' },
        { min: 30, max: 45, level: 'adjust', clinician: '調整為 50 mg 每日一次。', patient: '因為腎臟功能變差，這個藥的量要減少，請照藥袋上的量吃。' },
        { max: 30, level: 'adjust', clinician: '調整為 25 mg 每日一次。', patient: '因為腎臟功能變差，這個藥的量要減少，請照藥袋上的量吃。' }
      ],
      dialysis: { level: 'adjust', clinician: '25 mg 每日一次，與透析時間無關。', patient: '洗腎的人這個藥的量要減少，請照藥袋上的量吃。' }
    }
  },
  {
    id: 'dapagliflozin',
    generic: 'Dapagliflozin',
    zh: '達格列淨',
    brands: [{ en: 'Forxiga', zh: '福適佳' }],
    strength: '10 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '糖尿病／心衰竭／慢性腎臟病',
    purpose: 'dm', slots: ['ab'],
    use: '讓多餘的糖從尿液排出來，可以降血糖，也可以保護心臟和腎臟。',
    howTo: '每天早上吃一次，飯前飯後都可以。',
    sideEffects: ['小便變多、容易口渴', '私密處癢、有分泌物，或小便會痛'],
    warnings: ['每天要喝足夠的水', '私密處保持乾淨、乾爽', '生病吃不下、一直吐或拉肚子、要開刀前，請先暫停並問醫師'],
    seekHelp: ['噁心想吐、肚子痛、很喘、非常疲倦（就算血糖不高也要就醫）', '私密處到肛門附近又紅又腫又痛，還發燒'],
    renal: {
      metric: 'egfr',
      tiers: [
        { min: 45, level: 'ok', clinician: '不需調整劑量。', patient: '' },
        { min: 25, max: 45, level: 'caution', clinician: '不需調整劑量；降血糖效果隨腎功能下降而減弱，用於控制血糖時可能需併用其他藥物；心衰竭/CKD 適應症可繼續使用。', patient: '' },
        { max: 25, level: 'avoid', clinician: '不建議新開始使用（eGFR < 25）；已使用者依仿單及臨床判斷是否繼續。', patient: '因為腎臟功能變差，要不要繼續吃這個藥，請和醫師討論。' }
      ],
      dialysis: { level: 'avoid', clinician: '透析病人不建議使用。', patient: '洗腎的人通常不吃這個藥，請和醫師確認。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人較易發生體液不足/低血壓，注意水分與血壓。', patient: '長輩容易缺水，起身時請慢慢來，避免頭暈跌倒。' }
  },
  {
    id: 'amlodipine',
    generic: 'Amlodipine',
    zh: '氨氯地平',
    brands: [{ en: 'Norvasc', zh: '脈優' }],
    strength: '5 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '高血壓',
    purpose: 'bp', slots: ['ab'],
    use: '降血壓藥，也可以預防胸痛。',
    howTo: '每天吃一次，固定時間吃，飯前飯後都可以。',
    sideEffects: ['腳踝腫', '臉紅、頭痛、頭暈'],
    warnings: ['血壓正常了也不要自己停藥', '不要喝太多葡萄柚汁'],
    seekHelp: ['頭暈到快要昏倒、心跳很慢，或胸痛變嚴重'],
    renal: {
      metric: 'crcl',
      tiers: [{ level: 'ok', clinician: '腎功能不全不需調整劑量。', patient: '' }],
      dialysis: { level: 'ok', clinician: '不需調整，透析無法移除本藥。', patient: '' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人可由 2.5 mg 開始，緩慢調整。', patient: '長輩起身時請慢慢來，避免頭暈跌倒。' }
  },
  {
    id: 'losartan',
    generic: 'Losartan',
    zh: '洛沙坦',
    brands: [{ en: 'Cozaar', zh: '可悅您' }],
    strength: '50 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '高血壓／腎臟保護',
    purpose: 'bp', slots: ['ab'],
    use: '降血壓藥，也可以保護腎臟。',
    howTo: '每天吃一次，固定時間吃，飯前飯後都可以。',
    sideEffects: ['頭暈', '血中的鉀可能變高（抽血才會知道）'],
    warnings: ['懷孕或想懷孕的人不能吃，請馬上告訴醫師', '不要自己吃低鈉鹽或含鉀的補品', '請定期回診抽血'],
    seekHelp: ['嘴唇、舌頭或臉腫起來、呼吸困難', '全身沒力氣、心跳亂跳'],
    renal: {
      metric: 'crcl',
      tiers: [{ level: 'caution', clinician: '不需調整起始劑量；腎功能不全者應監測血鉀與血清肌酸酐。', patient: '請定期回診抽血，檢查腎臟和血中的鉀。' }],
      dialysis: { level: 'caution', clinician: '不需調整；注意低血壓與高血鉀，本藥不能被透析移除。', patient: '洗腎後如果頭暈、血壓太低，請告訴醫師。' }
    }
  },
  {
    id: 'gabapentin',
    generic: 'Gabapentin',
    zh: '加巴噴丁',
    brands: [{ en: 'Neurontin', zh: '鎮頑癲' }],
    strength: '300 mg 膠囊',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '神經痛／癲癇',
    purpose: 'nerve', slots: ['ab', 'ad'],
    use: '治療神經痛（例如皮蛇後的疼痛）或癲癇。',
    howTo: '照藥袋上的時間吃，飯前飯後都可以；不要自己突然停藥。',
    sideEffects: ['想睡、頭暈、走路不穩', '腳腫、體重增加'],
    warnings: ['吃藥後不要開車或操作危險機器', '不要喝酒，也不要自己加吃安眠藥', '如果要吃胃乳片，請隔 2 小時以上'],
    seekHelp: ['叫不太醒、頭腦混亂、呼吸變慢', '心情非常低落，或有傷害自己的想法'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 60, level: 'ok', clinician: '一般劑量 900–3600 mg/日，分三次。', patient: '' },
        { min: 30, max: 60, level: 'adjust', clinician: '400–1400 mg/日，分兩次。', patient: '因為腎臟功能變差，這個藥的量要減少，請照藥袋上的量吃，不要自己加量。' },
        { min: 15, max: 30, level: 'adjust', clinician: '200–700 mg/日，每日一次。', patient: '因為腎臟功能變差，這個藥的量要減少，請照藥袋上的量吃，不要自己加量。' },
        { max: 15, level: 'adjust', clinician: '100–300 mg/日，每日一次（依 CrCl 比例再降低）。', patient: '因為腎臟功能很差，這個藥的量要減少很多，請照藥袋上的量吃，不要自己加量。' }
      ],
      dialysis: { level: 'adjust', clinician: '依 CrCl 給予維持劑量，每次血液透析 4 小時後追加 125–350 mg。', patient: '洗腎的人，請在洗完腎後照醫師指示補吃。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人腎功能較差、易嗜睡頭暈跌倒，依 CrCl 調整並從低劑量開始。', patient: '長輩吃了比較容易頭暈，走路請小心。' }
  },
  {
    id: 'apixaban',
    generic: 'Apixaban',
    zh: '阿哌沙班',
    brands: [{ en: 'Eliquis', zh: '艾必克凝' }],
    strength: '2.5 / 5 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '抗凝血',
    purpose: 'clot', slots: ['ab', 'ad'],
    use: '預防血栓（血塊），避免中風。',
    howTo: '每天吃兩次，大約隔 12 小時，飯前飯後都可以。忘記吃時想起來就補吃，但不要一次吃兩倍。',
    sideEffects: ['容易瘀青、刷牙時牙齦流血、流鼻血'],
    warnings: ['不要自己停藥，否則容易中風', '拔牙、開刀、做胃鏡大腸鏡前，請告訴醫師您在吃這個藥', '不要自己買止痛藥或阿斯匹靈來吃'],
    seekHelp: ['大便變黑或有血、吐血、咳血', '小便有血、突然劇烈頭痛、流血止不住'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 30, level: 'ok', clinician: '心房顫動：5 mg 每日兩次（除非符合下方減量條件）。', patient: '' },
        { min: 15, max: 30, level: 'adjust', clinician: '心房顫動：2.5 mg 每日兩次；謹慎使用。', patient: '因為腎臟功能變差，這個藥的量要減少，也要更注意有沒有流血。' },
        { max: 15, level: 'avoid', clinician: 'CrCl < 15 不建議使用。', patient: '因為腎臟功能變差，這個藥可能不適合您，請盡快和醫師討論，不要自己停藥。' }
      ],
      dialysis: { level: 'avoid', clinician: '透析病人不建議使用（依台灣仿單）。', patient: '洗腎的人吃這個藥，請和醫師確認。' }
    },
    rules: [
      {
        type: 'countCriteria', need: 2, level: 'adjust',
        criteria: [
          { field: 'age', op: '>=', value: 80, label: '年齡 ≥ 80 歲' },
          { field: 'weight', op: '<=', value: 60, label: '體重 ≤ 60 kg' },
          { field: 'scr', op: '>=', value: 1.5, label: '血清肌酸酐 ≥ 1.5 mg/dL' }
        ],
        clinician: '心房顫動：符合兩項以上減量條件，劑量應為 2.5 mg 每日兩次',
        patient: '依照您的年紀、體重或腎臟功能，這個藥要吃比較低的量。'
      }
    ]
  },
  {
    id: 'rivaroxaban',
    generic: 'Rivaroxaban',
    zh: '利伐沙班',
    brands: [{ en: 'Xarelto', zh: '拜瑞妥' }],
    strength: '10 / 15 / 20 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '抗凝血',
    purpose: 'clot', slots: ['ad'],
    use: '預防血栓（血塊），避免中風。',
    howTo: '每天固定時間吃。15 毫克和 20 毫克這兩種，一定要「跟著吃飯一起吃」，效果才夠。',
    sideEffects: ['容易瘀青、刷牙時牙齦流血、流鼻血'],
    warnings: ['不要自己停藥，否則容易中風', '拔牙、開刀、做胃鏡大腸鏡前，請告訴醫師您在吃這個藥', '不要自己買止痛藥或阿斯匹靈來吃'],
    seekHelp: ['大便變黑或有血、吐血、咳血', '小便有血、突然劇烈頭痛、流血止不住'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 50, level: 'ok', clinician: '心房顫動：20 mg 每日一次，隨晚餐服用。', patient: '' },
        { min: 15, max: 50, level: 'adjust', clinician: '心房顫動：15 mg 每日一次，隨餐服用；CrCl 15–29 謹慎使用。', patient: '因為腎臟功能變差，這個藥的量要減少，也要更注意有沒有流血。' },
        { max: 15, level: 'avoid', clinician: 'CrCl < 15 不建議使用。', patient: '因為腎臟功能變差，這個藥可能不適合您，請盡快和醫師討論，不要自己停藥。' }
      ],
      dialysis: { level: 'avoid', clinician: '透析病人不建議使用（依台灣仿單）。', patient: '洗腎的人吃這個藥，請和醫師確認。' }
    }
  },
  {
    id: 'dabigatran',
    generic: 'Dabigatran',
    zh: '達比加群',
    brands: [{ en: 'Pradaxa', zh: '普栓達' }],
    strength: '110 / 150 mg 膠囊',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '抗凝血',
    purpose: 'clot', slots: ['ab', 'ad'],
    use: '預防血栓（血塊），避免中風。',
    howTo: '每天吃兩次，整顆配一杯水吞下去，「不要打開、咬碎或磨粉」。請放在原本的包裝裡，避免受潮。',
    sideEffects: ['胃不舒服、消化不良', '容易瘀青、刷牙時牙齦流血'],
    warnings: ['不要自己停藥，否則容易中風', '拔牙、開刀、做胃鏡大腸鏡前，請告訴醫師您在吃這個藥', '不要自己買止痛藥或阿斯匹靈來吃'],
    seekHelp: ['大便變黑或有血、吐血、咳血', '小便有血、突然劇烈頭痛、流血止不住'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 50, level: 'ok', clinician: '心房顫動：150 mg 每日兩次（依年齡與出血風險可用 110 mg 每日兩次）。', patient: '' },
        { min: 30, max: 50, level: 'adjust', clinician: '出血風險高者考慮 110 mg 每日兩次；密切監測腎功能。', patient: '因為腎臟功能變差，這個藥的量可能要減少，請定期回診抽血。' },
        { max: 30, level: 'avoid', clinician: '禁用（CrCl < 30）。', patient: '因為腎臟功能變差，這個藥可能不適合您，請盡快和醫師討論，不要自己停藥。' }
      ],
      dialysis: { level: 'avoid', clinician: '禁用。', patient: '洗腎的人不能吃這個藥，請盡快和醫師確認。' }
    },
    elderly: { ageMin: 80, level: 'adjust', clinician: '≥ 80 歲建議 110 mg 每日兩次（75–80 歲依出血風險評估）。', patient: '依照您的年紀，這個藥要吃比較低的量。' }
  },
  {
    id: 'allopurinol',
    generic: 'Allopurinol',
    zh: '別嘌醇',
    brands: [{ en: 'Zyloprim', zh: '安樂普諾' }],
    strength: '100 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '痛風',
    purpose: 'uric', slots: ['ab'],
    use: '降尿酸藥，預防痛風發作和結石。',
    howTo: '飯後吃，每天固定時間吃；每天多喝水（約 8 杯，醫師要您限水的人除外）。',
    sideEffects: ['剛開始吃的前幾個月，痛風可能比較容易發作', '胃不舒服'],
    warnings: ['剛開始吃的前幾個月，請特別注意皮膚有沒有變化', '痛風發作時也不要自己停藥'],
    seekHelp: ['起疹子、皮膚起水泡或脫皮、嘴巴或眼睛破皮、發燒（可能是嚴重過敏，請馬上停藥並就醫）'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 20, level: 'caution', clinician: '一般劑量；腎功能不全者由低劑量開始並監測。', patient: '' },
        { min: 10, max: 20, level: 'adjust', clinician: '每日 200 mg。', patient: '因為腎臟功能變差，這個藥的量要減少，請照藥袋上的量吃。' },
        { max: 10, level: 'adjust', clinician: '每日不超過 100 mg（CrCl < 3 需延長給藥間隔）。', patient: '因為腎臟功能很差，這個藥的量要減少很多，請照藥袋上的量吃。' }
      ],
      dialysis: { level: 'adjust', clinician: '透析後給藥；劑量依腎功能大幅減少。', patient: '洗腎的人請在洗完腎後吃藥。' }
    }
  },
  {
    id: 'celecoxib',
    generic: 'Celecoxib',
    zh: '希樂葆',
    brands: [{ en: 'Celebrex', zh: '希樂葆' }],
    strength: '200 mg 膠囊',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '止痛消炎（NSAID）',
    purpose: 'pain', slots: ['ab'],
    use: '消炎止痛藥，用在關節炎、筋骨痠痛。',
    howTo: '飯後吃。痛的時候才吃，不痛就不用吃，不要長期吃。',
    sideEffects: ['胃痛、消化不良', '腳腫、血壓變高'],
    warnings: ['不要再另外吃其他止痛藥', '以前吃藥過敏過的人，請告訴醫師', '止痛藥可能傷腎，請多喝水'],
    seekHelp: ['大便變黑、吐血、胃非常痛', '胸痛、一邊手腳沒力、說話不清楚', '小便變很少，或全身腫起來'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 30, level: 'caution', clinician: '可使用，監測腎功能、血壓與水腫。', patient: '止痛藥可能傷腎，請不要自己長期吃。' },
        { max: 30, level: 'avoid', clinician: '重度腎功能不全不建議使用。', patient: '因為腎臟功能變差，這個藥可能讓腎臟更差，請盡快和醫師討論。' }
      ],
      dialysis: { level: 'avoid', clinician: '不建議使用。', patient: '洗腎的人吃這個藥，請和醫師確認。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人腸胃出血、心血管及腎臟不良反應風險較高，使用最低劑量。', patient: '長輩比較容易胃出血，請注意大便有沒有變黑。' }
  },
  {
    id: 'levofloxacin',
    generic: 'Levofloxacin',
    zh: '左氧氟沙星',
    brands: [{ en: 'Cravit', zh: '可樂必妥' }],
    strength: '500 / 750 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '抗生素',
    purpose: 'antibiotic', slots: ['ab'],
    use: '抗生素，治療細菌感染（例如肺炎、尿道發炎）。',
    howTo: '請照醫師說的天數吃完，不要覺得好了就自己停藥。',
    sideEffects: ['噁心、拉肚子', '頭暈、睡不好'],
    warnings: ['和胃乳片、鈣片、鐵劑、綜合維他命至少隔 2 小時吃', '不要長時間曬太陽', '有糖尿病的人，要注意血糖太高或太低'],
    seekHelp: ['腳跟後面的筋或關節突然痛、腫，請停止運動並就醫', '手腳麻、刺痛，心跳很快，嚴重拉肚子或有血'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 50, level: 'ok', clinician: '不需調整劑量。', patient: '' },
        { min: 20, max: 50, level: 'adjust', clinician: '750 mg q24h → 750 mg q48h；500 mg q24h → 首劑 500 mg，之後 250 mg q24h。', patient: '因為腎臟功能變差，這個藥的量或吃藥的間隔要調整，請照藥袋上的說明吃。' },
        { min: 10, max: 20, level: 'adjust', clinician: '750 mg → 首劑 750 mg，之後 500 mg q48h；500 mg → 首劑 500 mg，之後 250 mg q48h。', patient: '因為腎臟功能變差，這個藥的量或吃藥的間隔要調整，請照藥袋上的說明吃。' },
        { max: 10, level: 'adjust', clinician: '依 CrCl 10–19 方案或更低，請諮詢藥師。', patient: '因為腎臟功能變差，這個藥的量或吃藥的間隔要調整，請照藥袋上的說明吃。' }
      ],
      dialysis: { level: 'adjust', clinician: '首劑後 q48h 給藥（同 CrCl 10–19），透析後不需追加。', patient: '洗腎的人這個藥要隔天吃一次，請照藥袋上的說明。' }
    },
    elderly: { ageMin: 60, level: 'caution', clinician: '≥ 60 歲肌腱炎/肌腱斷裂風險增加，尤其併用類固醇者。', patient: '長輩比較容易傷到筋，吃藥期間不要做激烈運動。' }
  },
  {
    id: 'famotidine',
    generic: 'Famotidine',
    zh: '法莫替丁',
    brands: [{ en: 'Gaster', zh: '蓋舒泰' }],
    strength: '20 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '胃藥',
    purpose: 'stomach', slots: ['ab', 'ad'],
    use: '胃藥，減少胃酸，治療胃破洞、胃酸逆流。',
    howTo: '照藥袋上的時間吃，常見是早晚飯後或睡前。',
    sideEffects: ['便秘或拉肚子', '頭痛'],
    warnings: ['胃一直痛或常常痛，請回診'],
    seekHelp: ['頭腦混亂、看到不存在的東西', '大便變黑、吐血'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 50, level: 'ok', clinician: '不需調整劑量。', patient: '' },
        { max: 50, level: 'adjust', clinician: 'CrCl < 50：劑量減半，或將給藥間隔延長至 36–48 小時。', patient: '因為腎臟功能變差，這個藥的量要減少，請照藥袋上的量吃。' }
      ],
      dialysis: { level: 'adjust', clinician: '劑量減半或延長給藥間隔。', patient: '洗腎的人這個藥的量要減少，請照藥袋上的量吃。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人易出現中樞神經副作用（意識混亂），依腎功能調整。', patient: '長輩如果出現頭腦混亂，請告訴醫師。' }
  },
  {
    id: 'acetaminophen',
    generic: 'Acetaminophen',
    zh: '乙醯胺酚',
    brands: [{ en: 'Panadol', zh: '普拿疼' }],
    strength: '500 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '止痛退燒',
    purpose: 'fever', slots: ['prn'],
    use: '止痛、退燒藥。',
    howTo: '痛或發燒時才吃，兩次至少隔 4–6 小時；500 毫克的一天最多 8 顆。',
    sideEffects: ['照正確的量吃，很少有不舒服'],
    warnings: ['很多感冒藥裡也有這個成分，不要重複吃', '吃藥期間不要喝酒', '有肝病的人請先問醫師'],
    seekHelp: ['不小心吃太多（就算沒有不舒服也要馬上就醫）', '皮膚起紅疹、水泡'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 10, level: 'ok', clinician: '不需調整劑量。', patient: '' },
        { max: 10, level: 'adjust', clinician: '重度腎功能不全（CrCl < 10）給藥間隔至少 8 小時（依各廠牌仿單）。', patient: '因為腎臟功能變差，兩次吃藥要隔至少 8 小時。' }
      ],
      dialysis: { level: 'adjust', clinician: '給藥間隔至少 8 小時。', patient: '兩次吃藥要隔至少 8 小時。' }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) module.exports = DRUG_DB;
