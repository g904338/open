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
    use: '降低血糖，治療第二型糖尿病。',
    howTo: '隨餐或飯後立即服用，可減少腸胃不適。',
    sideEffects: ['噁心、腹瀉、食慾變差（通常幾週內改善）', '長期使用可能維生素 B12 偏低'],
    warnings: ['要做含顯影劑的檢查（如電腦斷層）或手術前，請先告知醫師，可能需暫停', '避免大量飲酒'],
    seekHelp: ['嚴重嘔吐、腹痛、呼吸急促、全身極度無力或肌肉痠痛（可能為乳酸中毒）'],
    renal: {
      metric: 'egfr',
      tiers: [
        { min: 45, level: 'ok', clinician: '不需調整劑量；至少每年監測腎功能。', patient: '' },
        { min: 30, max: 45, level: 'adjust', clinician: '不建議新開始使用；已使用者評估效益與風險，可考慮減量（仿單建議每日上限約 1000 mg），並每 3–6 個月監測腎功能。', patient: '您的腎功能需要特別注意，醫師可能會調整此藥劑量，請定期抽血追蹤腎功能。' },
        { max: 30, level: 'avoid', clinician: '禁用（eGFR < 30）。', patient: '依您目前的腎功能，此藥可能不適合使用，請務必與醫師確認。' }
      ],
      dialysis: { level: 'avoid', clinician: '禁用。', patient: '透析病人通常不使用此藥，請務必與醫師確認。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人腎功能易下降，應定期監測腎功能並依此調整劑量。', patient: '年長者請定期回診抽血檢查腎功能。' }
  },
  {
    id: 'sitagliptin',
    generic: 'Sitagliptin',
    zh: '西他列汀',
    brands: [{ en: 'Januvia', zh: '佳糖維' }],
    strength: '25 / 50 / 100 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '糖尿病',
    use: '幫助身體在飯後分泌胰島素，降低血糖。',
    howTo: '每天一次，飯前飯後皆可，盡量每天固定時間服用。',
    sideEffects: ['鼻塞、喉嚨痛', '單獨使用時較少低血糖；與其他降血糖藥併用時較易發生'],
    warnings: ['若同時使用胰島素或磺醯脲類藥物，請注意低血糖（冒冷汗、發抖、心悸）'],
    seekHelp: ['持續劇烈腹痛並延伸到背部（可能為胰臟炎）', '皮膚起水泡、嚴重皮疹'],
    renal: {
      metric: 'egfr',
      tiers: [
        { min: 45, level: 'ok', clinician: '100 mg 每日一次，不需調整。', patient: '' },
        { min: 30, max: 45, level: 'adjust', clinician: '調整為 50 mg 每日一次。', patient: '因腎功能關係，此藥劑量需要減少，請依醫師處方的劑量服用。' },
        { max: 30, level: 'adjust', clinician: '調整為 25 mg 每日一次。', patient: '因腎功能關係，此藥劑量需要減少，請依醫師處方的劑量服用。' }
      ],
      dialysis: { level: 'adjust', clinician: '25 mg 每日一次，與透析時間無關。', patient: '透析病人此藥劑量需要減少，請依醫師處方服用。' }
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
    use: '讓多餘的糖分從尿液排出以降低血糖；也用於保護心臟與腎臟。',
    howTo: '每天一次，早上服用，飯前飯後皆可。',
    sideEffects: ['尿量增加、口渴', '生殖器或泌尿道感染（搔癢、分泌物、排尿疼痛）'],
    warnings: ['每天適量喝水，避免脫水', '保持私密處清潔乾燥', '生病無法進食、嚴重嘔吐腹瀉或手術前，請先暫停並詢問醫師'],
    seekHelp: ['噁心嘔吐、腹痛、呼吸很喘、異常疲倦（即使血糖不高，也可能是酮酸中毒）', '生殖器至肛門附近紅腫熱痛並發燒'],
    renal: {
      metric: 'egfr',
      tiers: [
        { min: 45, level: 'ok', clinician: '不需調整劑量。', patient: '' },
        { min: 25, max: 45, level: 'caution', clinician: '不需調整劑量；降血糖效果隨腎功能下降而減弱，用於控制血糖時可能需併用其他藥物；心衰竭/CKD 適應症可繼續使用。', patient: '' },
        { max: 25, level: 'avoid', clinician: '不建議新開始使用（eGFR < 25）；已使用者依仿單及臨床判斷是否繼續。', patient: '依您目前的腎功能，是否繼續使用此藥請與醫師確認。' }
      ],
      dialysis: { level: 'avoid', clinician: '透析病人不建議使用。', patient: '透析病人通常不使用此藥，請與醫師確認。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人較易發生體液不足/低血壓，注意水分與血壓。', patient: '年長者容易脫水，起身時請放慢動作，避免頭暈跌倒。' }
  },
  {
    id: 'amlodipine',
    generic: 'Amlodipine',
    zh: '氨氯地平',
    brands: [{ en: 'Norvasc', zh: '脈優' }],
    strength: '5 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '高血壓',
    use: '放鬆血管，降低血壓；也可預防心絞痛。',
    howTo: '每天一次，固定時間服用，飯前飯後皆可。',
    sideEffects: ['腳踝水腫', '臉部潮紅、頭痛、頭暈'],
    warnings: ['請勿自行停藥', '避免大量飲用葡萄柚汁'],
    seekHelp: ['頭暈到快要昏倒、心跳過慢或胸痛加劇'],
    renal: {
      metric: 'crcl',
      tiers: [{ level: 'ok', clinician: '腎功能不全不需調整劑量。', patient: '' }],
      dialysis: { level: 'ok', clinician: '不需調整，透析無法移除本藥。', patient: '' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人可由 2.5 mg 開始，緩慢調整。', patient: '年長者起身時請放慢動作，避免頭暈跌倒。' }
  },
  {
    id: 'losartan',
    generic: 'Losartan',
    zh: '洛沙坦',
    brands: [{ en: 'Cozaar', zh: '可悅您' }],
    strength: '50 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '高血壓／腎臟保護',
    use: '降低血壓，並可減少糖尿病病人的蛋白尿、保護腎臟。',
    howTo: '每天一次，固定時間服用，飯前飯後皆可。',
    sideEffects: ['頭暈', '血中鉀離子升高'],
    warnings: ['懷孕或準備懷孕請立即告知醫師（孕婦禁用）', '不要自行使用含鉀的代鹽或鉀補充劑', '定期抽血檢查腎功能與鉀離子'],
    seekHelp: ['嘴唇、舌頭或臉部腫脹、呼吸困難', '肌肉無力、心跳不規則（可能鉀離子過高）'],
    renal: {
      metric: 'crcl',
      tiers: [{ level: 'caution', clinician: '不需調整起始劑量；腎功能不全者應監測血鉀與血清肌酸酐。', patient: '請定期抽血檢查腎功能與鉀離子。' }],
      dialysis: { level: 'caution', clinician: '不需調整；注意低血壓與高血鉀，本藥不能被透析移除。', patient: '請注意透析後是否頭暈、血壓過低。' }
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
    use: '緩解神經痛（如帶狀疱疹後神經痛）或控制癲癇。',
    howTo: '依醫師指示分次服用，飯前飯後皆可；不可自行突然停藥。',
    sideEffects: ['嗜睡、頭暈、走路不穩', '下肢水腫、體重增加'],
    warnings: ['服藥後避免開車或操作危險機械', '避免與酒精、安眠藥併用', '若需併用含鋁鎂制酸劑，請間隔 2 小時以上'],
    seekHelp: ['極度嗜睡、意識混亂、呼吸變慢', '情緒低落或出現傷害自己的想法'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 60, level: 'ok', clinician: '一般劑量 900–3600 mg/日，分三次。', patient: '' },
        { min: 30, max: 60, level: 'adjust', clinician: '400–1400 mg/日，分兩次。', patient: '因腎功能關係，此藥劑量需要減少，請依醫師處方服用，勿自行加量。' },
        { min: 15, max: 30, level: 'adjust', clinician: '200–700 mg/日，每日一次。', patient: '因腎功能關係，此藥劑量需要減少，請依醫師處方服用，勿自行加量。' },
        { max: 15, level: 'adjust', clinician: '100–300 mg/日，每日一次（依 CrCl 比例再降低）。', patient: '因腎功能關係，此藥劑量需要大幅減少，請依醫師處方服用，勿自行加量。' }
      ],
      dialysis: { level: 'adjust', clinician: '依 CrCl 給予維持劑量，每次血液透析 4 小時後追加 125–350 mg。', patient: '透析病人請依醫師指示，在透析後補充服用。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人腎功能較差、易嗜睡頭暈跌倒，依 CrCl 調整並從低劑量開始。', patient: '年長者服藥後較容易頭暈，請小心跌倒。' }
  },
  {
    id: 'apixaban',
    generic: 'Apixaban',
    zh: '阿哌沙班',
    brands: [{ en: 'Eliquis', zh: '艾必克凝' }],
    strength: '2.5 / 5 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '抗凝血',
    use: '預防心房顫動引起的中風，或治療/預防血栓。',
    howTo: '每天兩次，約每 12 小時一次，飯前飯後皆可。忘記服用時盡快補服，但不可一次吃兩倍劑量。',
    sideEffects: ['容易瘀青、刷牙流血、流鼻血'],
    warnings: ['不可自行停藥，以免增加中風風險', '拔牙、手術或侵入性檢查前，請告知醫師正在使用抗凝血劑', '避免自行服用止痛藥（NSAIDs）或阿斯匹靈'],
    seekHelp: ['黑便、血便、吐血或咳血', '血尿、嚴重頭痛、頭暈或流血不止'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 30, level: 'ok', clinician: '心房顫動：5 mg 每日兩次（除非符合下方減量條件）。', patient: '' },
        { min: 15, max: 30, level: 'adjust', clinician: '心房顫動：2.5 mg 每日兩次；謹慎使用。', patient: '因腎功能關係，此藥劑量需要減少，並且更要注意出血情形。' },
        { max: 15, level: 'avoid', clinician: 'CrCl < 15 不建議使用。', patient: '依您目前的腎功能，此藥可能不適合使用，請務必與醫師確認。' }
      ],
      dialysis: { level: 'avoid', clinician: '透析病人不建議使用（依台灣仿單）。', patient: '透析病人使用此藥請務必與醫師確認。' }
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
        patient: '依您的年齡、體重或腎功能，此藥需使用較低劑量。'
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
    use: '預防心房顫動引起的中風，或治療/預防血栓。',
    howTo: '15 mg、20 mg 劑量必須「隨餐」服用，藥效才足夠。每天固定時間服用。',
    sideEffects: ['容易瘀青、刷牙流血、流鼻血'],
    warnings: ['不可自行停藥', '拔牙、手術或侵入性檢查前，請告知醫師正在使用抗凝血劑', '避免自行服用止痛藥（NSAIDs）或阿斯匹靈'],
    seekHelp: ['黑便、血便、吐血或咳血', '血尿、嚴重頭痛、頭暈或流血不止'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 50, level: 'ok', clinician: '心房顫動：20 mg 每日一次，隨晚餐服用。', patient: '' },
        { min: 15, max: 50, level: 'adjust', clinician: '心房顫動：15 mg 每日一次，隨餐服用；CrCl 15–29 謹慎使用。', patient: '因腎功能關係，此藥劑量需要減少，並且更要注意出血情形。' },
        { max: 15, level: 'avoid', clinician: 'CrCl < 15 不建議使用。', patient: '依您目前的腎功能，此藥可能不適合使用，請務必與醫師確認。' }
      ],
      dialysis: { level: 'avoid', clinician: '透析病人不建議使用（依台灣仿單）。', patient: '透析病人使用此藥請務必與醫師確認。' }
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
    use: '預防心房顫動引起的中風，或治療/預防血栓。',
    howTo: '每天兩次，整顆膠囊配一杯水吞服，「不可打開、咬碎或磨粉」。請保存在原包裝中防潮。',
    sideEffects: ['胃部不適、消化不良', '容易瘀青、刷牙流血'],
    warnings: ['不可自行停藥', '拔牙、手術或侵入性檢查前，請告知醫師正在使用抗凝血劑', '避免自行服用止痛藥（NSAIDs）或阿斯匹靈'],
    seekHelp: ['黑便、血便、吐血或咳血', '血尿、嚴重頭痛、頭暈或流血不止'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 50, level: 'ok', clinician: '心房顫動：150 mg 每日兩次（依年齡與出血風險可用 110 mg 每日兩次）。', patient: '' },
        { min: 30, max: 50, level: 'adjust', clinician: '出血風險高者考慮 110 mg 每日兩次；密切監測腎功能。', patient: '您的腎功能需要特別注意，醫師可能會調整此藥劑量，請定期抽血追蹤。' },
        { max: 30, level: 'avoid', clinician: '禁用（CrCl < 30）。', patient: '依您目前的腎功能，此藥可能不適合使用，請務必與醫師確認。' }
      ],
      dialysis: { level: 'avoid', clinician: '禁用。', patient: '透析病人不可使用此藥，請務必與醫師確認。' }
    },
    elderly: { ageMin: 80, level: 'adjust', clinician: '≥ 80 歲建議 110 mg 每日兩次（75–80 歲依出血風險評估）。', patient: '依您的年齡，此藥需使用較低劑量。' }
  },
  {
    id: 'allopurinol',
    generic: 'Allopurinol',
    zh: '別嘌醇',
    brands: [{ en: 'Zyloprim', zh: '安樂普諾' }],
    strength: '100 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '痛風',
    use: '減少體內尿酸生成，預防痛風發作與尿酸結石。',
    howTo: '飯後服用，每天固定時間；每天多喝水（約 2000 mL，除非醫師限水）。',
    sideEffects: ['剛開始使用時，痛風可能暫時更容易發作', '腸胃不適'],
    warnings: ['開始服藥的前幾個月，請特別留意皮膚變化', '不要因痛風發作就自行停藥'],
    seekHelp: ['出現皮疹、皮膚起水泡或脫皮、嘴巴眼睛潰爛、發燒（可能為嚴重藥物過敏，請立即停藥就醫）'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 20, level: 'caution', clinician: '一般劑量；腎功能不全者由低劑量開始並監測。', patient: '' },
        { min: 10, max: 20, level: 'adjust', clinician: '每日 200 mg。', patient: '因腎功能關係，此藥劑量需要減少，請依醫師處方服用。' },
        { max: 10, level: 'adjust', clinician: '每日不超過 100 mg（CrCl < 3 需延長給藥間隔）。', patient: '因腎功能關係，此藥劑量需要大幅減少，請依醫師處方服用。' }
      ],
      dialysis: { level: 'adjust', clinician: '透析後給藥；劑量依腎功能大幅減少。', patient: '透析病人請依醫師指示在透析後服藥。' }
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
    use: '緩解關節炎、肌肉骨骼疼痛與發炎。',
    howTo: '飯後服用，使用最低有效劑量、最短時間。',
    sideEffects: ['胃痛、消化不良', '水腫、血壓上升'],
    warnings: ['勿同時服用其他止痛消炎藥', '對磺胺類藥物過敏者請告知醫師', '可能影響腎功能，請多喝水並定期追蹤'],
    seekHelp: ['黑便、吐血、劇烈胃痛', '胸痛、單側無力、說話不清', '尿量明顯減少或全身水腫'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 30, level: 'caution', clinician: '可使用，監測腎功能、血壓與水腫。', patient: '止痛藥會影響腎臟，請不要自行長期服用。' },
        { max: 30, level: 'avoid', clinician: '重度腎功能不全不建議使用。', patient: '依您目前的腎功能，此藥可能傷害腎臟，請務必與醫師確認是否繼續使用。' }
      ],
      dialysis: { level: 'avoid', clinician: '不建議使用。', patient: '透析病人使用此藥請務必與醫師確認。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人腸胃出血、心血管及腎臟不良反應風險較高，使用最低劑量。', patient: '年長者較容易胃出血，請注意大便顏色。' }
  },
  {
    id: 'levofloxacin',
    generic: 'Levofloxacin',
    zh: '左氧氟沙星',
    brands: [{ en: 'Cravit', zh: '可樂必妥' }],
    strength: '500 / 750 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '抗生素',
    use: '治療細菌感染，如肺炎、泌尿道感染。',
    howTo: '依醫師指示的天數吃完，不可症狀改善就自行停藥。',
    sideEffects: ['噁心、腹瀉', '頭暈、失眠'],
    warnings: ['與制酸劑、鈣片、鐵劑、鎂、鋅等營養品至少間隔 2 小時', '避免長時間曬太陽', '糖尿病病人注意血糖過高或過低'],
    seekHelp: ['肌腱（尤其腳跟）疼痛或腫脹，請停止運動並就醫', '手腳麻刺痛、心悸、嚴重腹瀉帶血'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 50, level: 'ok', clinician: '不需調整劑量。', patient: '' },
        { min: 20, max: 50, level: 'adjust', clinician: '750 mg q24h → 750 mg q48h；500 mg q24h → 首劑 500 mg，之後 250 mg q24h。', patient: '因腎功能關係，此藥劑量或服藥間隔需要調整，請依醫師處方服用。' },
        { min: 10, max: 20, level: 'adjust', clinician: '750 mg → 首劑 750 mg，之後 500 mg q48h；500 mg → 首劑 500 mg，之後 250 mg q48h。', patient: '因腎功能關係，此藥劑量或服藥間隔需要調整，請依醫師處方服用。' },
        { max: 10, level: 'adjust', clinician: '依 CrCl 10–19 方案或更低，請諮詢藥師。', patient: '因腎功能關係，此藥劑量或服藥間隔需要調整，請依醫師處方服用。' }
      ],
      dialysis: { level: 'adjust', clinician: '首劑後 q48h 給藥（同 CrCl 10–19），透析後不需追加。', patient: '透析病人此藥需隔天服用，請依醫師處方。' }
    },
    elderly: { ageMin: 60, level: 'caution', clinician: '≥ 60 歲肌腱炎/肌腱斷裂風險增加，尤其併用類固醇者。', patient: '年長者較容易發生肌腱受傷，服藥期間避免激烈運動。' }
  },
  {
    id: 'famotidine',
    generic: 'Famotidine',
    zh: '法莫替丁',
    brands: [{ en: 'Gaster', zh: '蓋舒泰' }],
    strength: '20 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '胃藥',
    use: '減少胃酸分泌，治療胃潰瘍、十二指腸潰瘍或胃食道逆流。',
    howTo: '依醫師指示，常見為早晚飯後或睡前服用。',
    sideEffects: ['便秘或腹瀉', '頭痛'],
    warnings: ['若胃痛持續或反覆，請回診'],
    seekHelp: ['意識混亂、幻覺（腎功能差或年長者較易發生）', '黑便、吐血'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 50, level: 'ok', clinician: '不需調整劑量。', patient: '' },
        { max: 50, level: 'adjust', clinician: 'CrCl < 50：劑量減半，或將給藥間隔延長至 36–48 小時。', patient: '因腎功能關係，此藥劑量需要減少，請依醫師處方服用。' }
      ],
      dialysis: { level: 'adjust', clinician: '劑量減半或延長給藥間隔。', patient: '透析病人此藥劑量需要減少，請依醫師處方服用。' }
    },
    elderly: { ageMin: 65, level: 'caution', clinician: '老年人易出現中樞神經副作用（意識混亂），依腎功能調整。', patient: '年長者若出現精神混亂，請告知醫師。' }
  },
  {
    id: 'acetaminophen',
    generic: 'Acetaminophen',
    zh: '乙醯胺酚',
    brands: [{ en: 'Panadol', zh: '普拿疼' }],
    strength: '500 mg 錠',
    nhiCode: [], license: '', insertVersion: '', verified: false,
    category: '止痛退燒',
    use: '緩解疼痛與退燒。',
    howTo: '需要時服用，兩次間隔至少 4–6 小時，每日不超過 4000 mg（8 顆 500 mg）。',
    sideEffects: ['依正確劑量使用時副作用少'],
    warnings: ['許多感冒藥也含有乙醯胺酚，避免重複服用', '服藥期間避免喝酒', '肝病病人請先詢問醫師'],
    seekHelp: ['不小心吃過量（即使沒有症狀也要立即就醫）', '皮膚起紅疹、水泡'],
    renal: {
      metric: 'crcl',
      tiers: [
        { min: 10, level: 'ok', clinician: '不需調整劑量。', patient: '' },
        { max: 10, level: 'adjust', clinician: '重度腎功能不全（CrCl < 10）給藥間隔至少 8 小時（依各廠牌仿單）。', patient: '因腎功能關係，兩次服藥需間隔至少 8 小時。' }
      ],
      dialysis: { level: 'adjust', clinician: '給藥間隔至少 8 小時。', patient: '兩次服藥需間隔至少 8 小時。' }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) module.exports = DRUG_DB;
