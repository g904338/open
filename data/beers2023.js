/*
 * 2023 AGS Beers Criteria®（美國老年醫學會 老年人潛在不適當用藥準則 2023 年版）
 * ------------------------------------------------------------
 * 適用：65 歲以上。
 * 收錄範圍：
 *   表 2  老年人應避免的藥物
 *   表 4  老年人應謹慎使用的藥物
 *   表 5  應避免的藥物交互作用（依整份用藥清單判斷）
 *   表 6  依腎功能（CrCl）應避免或減量的藥物
 *   表 7  強抗膽鹼藥物（用於「兩種以上抗膽鹼藥併用」判斷）
 * 未收錄：表 3（藥物與疾病交互作用，需要診斷資料），列為後續擴充。
 *
 * ⚠️ 內容依 Beers 2023 原文重點整理為中文，上線前請藥師對照原文核對。
 *    中文商品名僅列常見者，請依院內品項補充。
 *
 * 結構
 *   LEXICON  藥名字典：key = 英文學名小寫
 *            { zh 中文名, brand 常見商品名, use 給民眾看的「這是什麼藥」, tags 分類標籤 }
 *   ITEMS    單一藥物規則：{ id, table, tags|drugs, minAge?, crcl?{min,max}, level, rec, clinician, patient }
 *   INTERACTIONS 交互作用規則（表 5）
 *
 *   patient 欄位會印在衛教單上，請使用白話、避免專業術語（tests/plain-language.test.js 會檢查）。
 */
var BEERS_2023 = (function () {
  var L = {};
  function add(keys, zh, brand, use, tags) {
    var o = { zh: zh, brand: brand, use: use, tags: tags };
    keys.split('|').forEach(function (k) { L[k] = o; });
  }

  /* ---------- 抗組織胺（第一代） ---------- */
  add('chlorpheniramine', '氯苯那敏', '', '抗過敏藥（常見於感冒藥、鼻炎藥）', ['fgah', 'anticholinergic']);
  add('dexchlorpheniramine', '右旋氯苯那敏', '', '抗過敏藥（常見於感冒藥、鼻炎藥）', ['fgah', 'anticholinergic']);
  add('diphenhydramine', '苯海拉明', '', '抗過敏藥，也用在部分助眠藥', ['fgah', 'anticholinergic']);
  add('hydroxyzine', '羥嗪', '安泰樂 Atarax', '止癢、抗過敏藥', ['fgah', 'anticholinergic']);
  add('cyproheptadine', '賽庚啶', '', '抗過敏藥，也用來開胃', ['fgah', 'anticholinergic']);
  add('promethazine', '異丙嗪', '', '抗過敏、止吐藥', ['fgah', 'anticholinergic']);
  add('meclizine', '美克利嗪', '', '頭暈、暈車用藥', ['fgah', 'anticholinergic']);

  /* ---------- 其他強抗膽鹼藥 ---------- */
  add('trihexyphenidyl', '苯海索', '', '巴金森氏症、手抖用藥', ['antiparkinson_ac', 'anticholinergic']);
  add('benztropine', '苯扎托品', '', '巴金森氏症、手抖用藥', ['antiparkinson_ac', 'anticholinergic']);
  add('dicyclomine', '雙環維林', '', '腸胃絞痛用藥', ['antispasmodic', 'anticholinergic']);
  add('hyoscyamine', '莨菪鹼', '', '腸胃絞痛用藥', ['antispasmodic', 'anticholinergic']);
  add('scopolamine', '東莨菪鹼', '', '暈車、腸胃絞痛用藥', ['antispasmodic', 'anticholinergic']);
  add('oxybutynin', '奧昔布寧', '', '頻尿、漏尿用藥', ['bladder_ac', 'anticholinergic']);
  add('tolterodine', '托特羅定', '得舒妥 Detrusitol', '頻尿、漏尿用藥', ['bladder_ac', 'anticholinergic']);
  add('solifenacin', '索利那新', '衛喜康 Vesicare', '頻尿、漏尿用藥', ['bladder_ac', 'anticholinergic']);

  /* ---------- 抗血栓 ---------- */
  add('aspirin', '阿斯匹靈', '', '預防血栓（血塊）的藥', ['aspirin']);
  add('warfarin', '華法林', '可化凝 Coumadin', '預防血栓（血塊）的藥', ['warfarin']);
  add('rivaroxaban', '利伐沙班', '拜瑞妥 Xarelto', '預防血栓（血塊）的藥', ['rivaroxaban']);
  add('dabigatran', '達比加群', '普栓達 Pradaxa', '預防血栓（血塊）的藥', ['dabigatran']);
  add('apixaban', '阿哌沙班', '艾必克凝 Eliquis', '預防血栓（血塊）的藥', []);
  add('edoxaban', '艾多沙班', '里先安 Lixiana', '預防血栓（血塊）的藥', ['edoxaban']);
  add('enoxaparin', '依諾肝素', '', '預防血栓的針劑', ['enoxaparin']);
  add('clopidogrel', '氯吡格雷', '保栓通 Plavix', '預防血栓（血塊）的藥', []);
  add('prasugrel', '普拉格雷', '', '預防血栓（血塊）的藥', ['prasugrel']);
  add('dipyridamole', '雙嘧達莫', '', '預防血栓的藥', ['dipyridamole']);

  /* ---------- 抗感染 ---------- */
  add('nitrofurantoin', '呋喃妥因', '', '治療尿道發炎的抗生素', ['nitrofurantoin']);
  add('ciprofloxacin', '環丙沙星', '速博新 Ciproxin', '抗生素', ['cipro']);
  add('levofloxacin', '左氧氟沙星', '可樂必妥 Cravit', '抗生素', []);
  add('trimethoprim-sulfamethoxazole|sulfamethoxazole-trimethoprim|smx-tmp|tmp-smx', '磺胺甲噁唑/甲氧苄啶', '撲菌特 Baktar', '抗生素', ['tmpsmx']);
  add('clarithromycin', '克拉黴素', '', '抗生素', ['macrolide']);
  add('erythromycin', '紅黴素', '', '抗生素', ['macrolide']);

  /* ---------- 心血管 ---------- */
  add('doxazosin', '多沙唑嗪', '可迅 Doxaben', '降血壓、改善攝護腺肥大排尿', ['alpha1']);
  add('terazosin', '特拉唑嗪', '', '降血壓、改善攝護腺肥大排尿', ['alpha1']);
  add('prazosin', '哌唑嗪', '', '降血壓藥', ['alpha1']);
  add('clonidine', '可樂定', '', '降血壓藥', ['central_alpha']);
  add('methyldopa', '甲基多巴', '', '降血壓藥', ['central_alpha']);
  add('nifedipine', '硝苯地平', '冠達悅 Adalat', '降血壓藥', ['nifedipine']);
  add('amiodarone', '胺碘酮', '臟得樂 Cordarone', '治療心律不整的藥', ['amiodarone']);
  add('dronedarone', '決奈達隆', '脈泰克 Multaq', '治療心律不整的藥', ['dronedarone']);
  add('digoxin', '地高辛', '', '強心、控制心跳的藥', ['digoxin']);
  add('furosemide', '呋塞米', '來適泄 Lasix', '利尿劑（排水的藥）', ['loop', 'diuretic']);
  add('hydrochlorothiazide', '氫氯噻嗪', '', '利尿劑（排水、降血壓的藥）', ['diuretic']);
  add('spironolactone', '螺內酯', '安達通 Aldactone', '利尿劑（排水的藥）', ['diuretic', 'spironolactone']);
  add('amiloride', '阿米洛利', '', '利尿劑（排水的藥）', ['diuretic', 'k_sparing']);
  add('triamterene', '胺苯蝶啶', '', '利尿劑（排水的藥）', ['diuretic', 'k_sparing', 'triamterene']);
  add('losartan', '洛沙坦', '可悅您 Cozaar', '降血壓、保護腎臟的藥', ['ras']);
  add('valsartan', '纈沙坦', '得安穩 Diovan', '降血壓藥', ['ras']);
  add('olmesartan', '奧美沙坦', '雅脈 Olmetec', '降血壓藥', ['ras']);
  add('irbesartan', '厄貝沙坦', '安普諾維 Aprovel', '降血壓藥', ['ras']);
  add('candesartan', '坎地沙坦', '博脈舒 Blopress', '降血壓藥', ['ras']);
  add('telmisartan', '替米沙坦', '', '降血壓藥', ['ras']);
  add('enalapril', '依那普利', '', '降血壓藥', ['ras']);
  add('ramipril', '雷米普利', '', '降血壓藥', ['ras']);
  add('captopril', '卡托普利', '', '降血壓藥', ['ras']);
  add('sacubitril-valsartan', '沙庫巴曲/纈沙坦', '健安心 Entresto', '治療心臟衰竭的藥', ['ras']);

  /* ---------- 精神、神經 ---------- */
  add('amitriptyline', '阿米替林', '', '抗憂鬱藥，也用於神經痛', ['tca', 'anticholinergic']);
  add('imipramine', '丙咪嗪', '', '抗憂鬱藥', ['tca', 'anticholinergic']);
  add('nortriptyline', '去甲替林', '', '抗憂鬱藥，也用於神經痛', ['tca', 'anticholinergic']);
  add('clomipramine', '氯米帕明', '', '抗憂鬱藥', ['tca', 'anticholinergic']);
  add('doxepin', '多慮平', '', '抗憂鬱藥、助眠藥', ['tca', 'anticholinergic']);
  add('paroxetine', '帕羅西汀', '克憂果 Seroxat', '抗憂鬱、抗焦慮藥', ['ssri', 'ac_antidep', 'anticholinergic']);
  add('sertraline', '舍曲林', '樂復得 Zoloft', '抗憂鬱、抗焦慮藥', ['ssri']);
  add('escitalopram', '艾司西酞普蘭', '立普能 Lexapro', '抗憂鬱、抗焦慮藥', ['ssri']);
  add('fluoxetine', '氟西汀', '百憂解 Prozac', '抗憂鬱藥', ['ssri']);
  add('duloxetine', '度洛西汀', '千憂解 Cymbalta', '抗憂鬱藥，也用於慢性疼痛', ['snri', 'duloxetine']);
  add('venlafaxine', '文拉法辛', '速悅 Efexor', '抗憂鬱、抗焦慮藥', ['snri']);
  add('mirtazapine', '米氮平', '樂活優 Remeron', '抗憂鬱藥', ['mirtazapine']);
  add('haloperidol', '氟哌啶醇', '', '精神科用藥', ['antipsychotic']);
  add('quetiapine', '喹硫平', '思樂康 Seroquel', '精神科用藥', ['antipsychotic', 'anticholinergic']);
  add('olanzapine', '奧氮平', '金普薩 Zyprexa', '精神科用藥', ['antipsychotic', 'anticholinergic']);
  add('risperidone', '利培酮', '理思必妥 Risperdal', '精神科用藥', ['antipsychotic']);
  add('aripiprazole', '阿立哌唑', '安立復 Abilify', '精神科用藥', ['antipsychotic']);
  add('phenobarbital', '苯巴比妥', '', '抗癲癇、鎮定藥', ['barbiturate', 'antiepileptic']);
  add('alprazolam', '阿普唑侖', '贊安諾 Xanax', '安眠、抗焦慮藥', ['benzo']);
  add('lorazepam', '勞拉西泮', '安定文 Ativan', '安眠、抗焦慮藥', ['benzo']);
  add('diazepam', '地西泮', '煩寧 Valium', '安眠、抗焦慮藥', ['benzo']);
  add('clonazepam', '氯硝西泮', '利福全 Rivotril', '安眠、抗焦慮、抗癲癇藥', ['benzo']);
  add('estazolam', '艾司唑侖', '悠樂丁 Eurodin', '安眠藥', ['benzo']);
  add('triazolam', '三唑侖', '酣樂欣 Halcion', '安眠藥', ['benzo']);
  add('flunitrazepam', '氟硝西泮', '', '安眠藥', ['benzo']);
  add('bromazepam', '溴西泮', '', '抗焦慮藥', ['benzo']);
  add('zolpidem', '唑吡坦', '使蒂諾斯 Stilnox', '安眠藥', ['zdrug']);
  add('zopiclone', '佐匹克隆', '宜眠安 Imovane', '安眠藥', ['zdrug']);
  add('eszopiclone', '右佐匹克隆', '', '安眠藥', ['zdrug']);
  add('lithium', '鋰鹽', '', '穩定情緒的藥', ['lithium']);
  add('carbamazepine', '卡馬西平', '癲通 Tegretol', '抗癲癇藥，也用於神經痛', ['antiepileptic', 'carbamazepine']);
  add('oxcarbazepine', '奧卡西平', '除癲達 Trileptal', '抗癲癇藥', ['antiepileptic', 'carbamazepine']);
  add('valproate|valproic acid', '丙戊酸', '帝拔癲 Depakine', '抗癲癇、穩定情緒的藥', ['antiepileptic']);
  add('phenytoin', '苯妥英', '癲能停 Dilantin', '抗癲癇藥', ['antiepileptic', 'phenytoin']);
  add('levetiracetam', '左乙拉西坦', '優閒 Keppra', '抗癲癇藥', ['antiepileptic', 'levetiracetam']);
  add('gabapentin', '加巴噴丁', '鎮頑癲 Neurontin', '神經痛、抗癲癇藥', ['antiepileptic', 'gabapentinoid']);
  add('pregabalin', '普瑞巴林', '利瑞卡 Lyrica', '神經痛藥', ['antiepileptic', 'gabapentinoid', 'pregabalin']);

  /* ---------- 止痛 ---------- */
  add('tramadol', '曲馬多', '', '止痛藥（較強效）', ['opioid', 'tramadol']);
  add('codeine', '可待因', '', '止咳、止痛藥', ['opioid']);
  add('morphine', '嗎啡', '', '強效止痛藥', ['opioid']);
  add('oxycodone', '羥考酮', '', '強效止痛藥', ['opioid']);
  add('fentanyl', '芬太尼', '', '強效止痛藥（貼片）', ['opioid']);
  add('meperidine|pethidine', '哌替啶', '', '強效止痛藥', ['opioid', 'meperidine']);
  add('ibuprofen', '布洛芬', '', '消炎止痛藥', ['nsaid']);
  add('naproxen', '萘普生', '', '消炎止痛藥', ['nsaid']);
  add('diclofenac', '雙氯芬酸', '', '消炎止痛藥', ['nsaid']);
  add('meloxicam', '美洛昔康', '骨敏捷 Mobic', '消炎止痛藥', ['nsaid']);
  add('mefenamic acid', '甲芬那酸', '', '消炎止痛藥', ['nsaid']);
  add('ketoprofen', '酮洛芬', '', '消炎止痛藥', ['nsaid']);
  add('piroxicam', '吡羅昔康', '', '消炎止痛藥', ['nsaid']);
  add('etodolac', '依托度酸', '', '消炎止痛藥', ['nsaid']);
  add('aceclofenac', '醋氯芬酸', '', '消炎止痛藥', ['nsaid']);
  add('indomethacin', '吲哚美辛', '', '消炎止痛藥', ['nsaid', 'nsaid_high']);
  add('ketorolac', '酮咯酸', '', '消炎止痛藥', ['nsaid', 'nsaid_high']);
  add('celecoxib', '塞來昔布', '希樂葆 Celebrex', '消炎止痛藥', []);
  add('cyclobenzaprine', '環苯扎林', '', '肌肉鬆弛劑', ['muscle_relaxant', 'anticholinergic']);
  add('carisoprodol', '卡立普多', '', '肌肉鬆弛劑', ['muscle_relaxant']);
  add('chlorzoxazone', '氯唑沙宗', '', '肌肉鬆弛劑', ['muscle_relaxant']);
  add('methocarbamol', '美索巴莫', '', '肌肉鬆弛劑', ['muscle_relaxant']);
  add('orphenadrine', '奧芬那君', '', '肌肉鬆弛劑', ['muscle_relaxant', 'anticholinergic']);
  add('baclofen', '巴氯芬', '', '肌肉鬆弛劑', ['baclofen']);

  /* ---------- 內分泌 ---------- */
  add('glimepiride', '格列美脲', '瑪爾胰 Amaryl', '降血糖藥', ['sulfonylurea']);
  add('gliclazide', '格列齊特', '岱蜜克龍 Diamicron', '降血糖藥', ['sulfonylurea']);
  add('glipizide', '格列吡嗪', '', '降血糖藥', ['sulfonylurea']);
  add('glibenclamide|glyburide', '格列本脲', '', '降血糖藥', ['sulfonylurea']);
  add('dapagliflozin', '達格列淨', '福適佳 Forxiga', '降血糖、保護心臟腎臟的藥', ['sglt2']);
  add('empagliflozin', '恩格列淨', '恩排糖 Jardiance', '降血糖、保護心臟腎臟的藥', ['sglt2']);
  add('canagliflozin', '卡格列淨', '', '降血糖藥', ['sglt2']);
  add('megestrol', '甲地孕酮', '', '增加食慾的藥', ['megestrol']);
  add('desmopressin', '去氨加壓素', '', '減少夜尿的藥', ['desmopressin']);

  /* ---------- 腸胃 ---------- */
  add('omeprazole', '奧美拉唑', '樂酸克 Losec', '胃藥（減少胃酸）', ['ppi']);
  add('esomeprazole', '埃索美拉唑', '耐適恩 Nexium', '胃藥（減少胃酸）', ['ppi']);
  add('lansoprazole', '蘭索拉唑', '泰克胃通 Takepron', '胃藥（減少胃酸）', ['ppi']);
  add('dexlansoprazole', '右蘭索拉唑', '', '胃藥（減少胃酸）', ['ppi']);
  add('pantoprazole', '泮托拉唑', '保衛康治潰樂 Pantoloc', '胃藥（減少胃酸）', ['ppi']);
  add('rabeprazole', '雷貝拉唑', '百抑潰 Pariet', '胃藥（減少胃酸）', ['ppi']);
  add('famotidine', '法莫替丁', '蓋舒泰 Gaster', '胃藥（減少胃酸）', ['h2ra']);
  add('cimetidine', '西咪替丁', '', '胃藥（減少胃酸）', ['h2ra', 'cimetidine']);
  add('metoclopramide', '甲氧氯普胺', '', '止吐、幫助腸胃蠕動的藥', ['metoclopramide']);
  add('mineral oil', '礦物油', '', '軟便藥', ['mineral_oil']);

  /* ---------- 其他 ---------- */
  add('colchicine', '秋水仙素', '', '痛風發作用藥', ['colchicine']);
  add('probenecid', '丙磺舒', '', '降尿酸藥', ['probenecid']);
  add('theophylline', '茶鹼', '', '氣喘、慢性肺病用藥', ['theophylline']);

  /* ======================================================
   * 單一藥物規則
   * level: avoid（避免）/ caution（謹慎）/ adjust（依腎功能調整）
   * ====================================================== */
  var SED_FALL = '長輩吃了容易頭暈、站不穩而跌倒，也可能記憶變差、白天昏沉。';
  var AC_PT = '這類藥可能讓長輩口乾、便秘、小便解不出來，甚至頭腦混亂、記憶變差。';
  var NA_PT = '這個藥可能讓血中的鈉變低。剛開始吃或換藥量時，如果頭痛、噁心、走路不穩、精神變差，請告訴醫師。';
  var RENAL_REDUCE = '因為腎臟功能變差，這個藥的量需要減少，請和醫師確認您的藥量。';
  var RENAL_AVOID = '因為腎臟功能變差，這個藥可能不適合您，請盡快和醫師討論，不要自己停藥。';

  var ITEMS = [
    // ----- 表 2 -----
    { id: 't2-fgah', table: 2, tags: ['fgah'], level: 'avoid', rec: '避免',
      clinician: '第一代抗組織胺：強抗膽鹼作用，老年人清除率下降，易混亂、口乾、便秘；建議避免（急性嚴重過敏短期使用除外）。',
      patient: '長輩吃這類抗過敏藥，容易嗜睡、口乾、便秘、小便不順，甚至頭腦混亂。自己買感冒藥或鼻炎藥前，請先問藥師。' },
    { id: 't2-antiparkinson', table: 2, tags: ['antiparkinson_ac'], level: 'avoid', rec: '避免',
      clinician: '抗巴金森抗膽鹼藥：不建議用於預防抗精神病藥的錐體外症狀，巴金森治療有更有效藥物。', patient: AC_PT },
    { id: 't2-antispasmodic', table: 2, tags: ['antispasmodic'], level: 'avoid', rec: '避免',
      clinician: '腸胃道解痙藥：強抗膽鹼、療效不確定；安寧緩和減少分泌時除外。', patient: AC_PT },
    { id: 't2-aspirin', table: 2, tags: ['aspirin'], level: 'caution', rec: '避免用於初級預防',
      clinician: 'Aspirin 用於心血管疾病「初級預防」：避免開始使用；已使用者考慮減藥。用於次級預防（已有中風/冠心病）則有適應症。',
      patient: '如果您「沒有」中風或心臟病，只是想預防，長輩不建議自己開始吃阿斯匹靈，可能增加出血。已經在吃的人請不要自己停藥，回診時問醫師。' },
    { id: 't2-warfarin', table: 2, tags: ['warfarin'], level: 'caution', rec: '避免作為首選',
      clinician: 'Warfarin：心房顫動/靜脈栓塞避免作為新開始的首選，除非 DOAC 禁忌或有困難；長期穩定者可繼續，尤其 INR 控制良好者。',
      patient: '請每天固定時間吃藥，並定期回診抽血。綠色蔬菜每天吃的量盡量固定，不要忽多忽少；吃任何新藥或保健食品前，請先問藥師。' },
    { id: 't2-rivaroxaban', table: 2, tags: ['rivaroxaban'], level: 'avoid', rec: '避免作為長期治療首選',
      clinician: 'Rivaroxaban：長期治療心房顫動/靜脈栓塞時，老年人大出血與腸胃道出血風險高於其他 DOAC（如 apixaban），建議避免作為首選；短期 VTE 預防可用。',
      patient: '長輩吃這個藥，出血的機會可能比同類的藥稍高。請不要自己停藥，下次回診可以拿這張單子問醫師。' },
    { id: 't2-dipyridamole', table: 2, tags: ['dipyridamole'], level: 'avoid', rec: '避免（短效口服劑型）',
      clinician: '短效口服 dipyridamole：可能造成姿勢性低血壓，且有更有效的替代藥物。', patient: '這個藥可能讓您起身時頭暈，請慢慢起身。' },
    { id: 't2-nitrofurantoin', table: 2, tags: ['nitrofurantoin'], level: 'avoid', rec: '避免長期使用',
      clinician: 'Nitrofurantoin：避免長期預防性使用（肺毒性、肝毒性、周邊神經病變）；CrCl < 30 避免。',
      patient: '這個藥不適合長期吃。如果出現咳嗽、喘、手腳麻，請告訴醫師。' },
    { id: 't2-alpha1', table: 2, tags: ['alpha1'], level: 'avoid', rec: '避免用於治療高血壓',
      clinician: '周邊 α1 阻斷劑：避免作為降血壓用途（姿勢性低血壓風險高）；用於攝護腺肥大可使用。',
      patient: '這類藥容易讓血壓在起身時突然變低，起床、站起來時請慢慢來，避免跌倒。' },
    { id: 't2-central-alpha', table: 2, tags: ['central_alpha'], level: 'avoid', rec: '避免作為首選降血壓藥',
      clinician: '中樞 α 促效劑（clonidine 等）：避免作為第一線降血壓藥；中樞神經副作用、心搏過慢、姿勢性低血壓。',
      patient: '這個藥可能讓您頭暈、想睡、心跳變慢。請不要自己突然停藥，以免血壓突然升高。' },
    { id: 't2-nifedipine', table: 2, tags: ['nifedipine'], level: 'caution', rec: '避免立即釋放型',
      clinician: 'Nifedipine 立即釋放型（IR）：避免（低血壓、心肌缺血風險）。長效劑型（如 OROS）不在此限，請確認劑型。',
      patient: '請照藥袋上的說明吃，不要自己咬碎或剝半。起身時請慢慢來。' },
    { id: 't2-amiodarone', table: 2, tags: ['amiodarone'], level: 'caution', rec: '避免作為心房顫動首選',
      clinician: 'Amiodarone：避免作為心房顫動第一線治療，除非合併心衰竭或明顯左心室肥厚；甲狀腺、肺、QT 延長毒性。',
      patient: '這個藥可能影響甲狀腺、肺和肝臟，請定期回診抽血。出門要防曬；如果一直咳嗽或喘，請告訴醫師。' },
    { id: 't2-dronedarone', table: 2, tags: ['dronedarone'], level: 'avoid', rec: '避免（特定族群）',
      clinician: 'Dronedarone：永久性心房顫動、或嚴重/近期失代償心衰竭者避免使用。', patient: '如果您有心臟衰竭，或腳腫、喘變嚴重，請馬上告訴醫師。' },
    { id: 't2-digoxin', table: 2, tags: ['digoxin'], level: 'caution', rec: '避免作為首選；劑量勿超過 0.125 mg/日',
      clinician: 'Digoxin：避免作為心房顫動或心衰竭第一線；若使用，避免每日 > 0.125 mg（腎功能下降時毒性風險高）。',
      patient: '請定期抽血檢查。如果食慾變差、噁心、看東西顏色怪怪的、心跳很慢，請馬上就醫。' },
    { id: 't2-tca', table: 2, tags: ['tca', 'ac_antidep'], level: 'avoid', rec: '避免',
      clinician: '強抗膽鹼抗憂鬱藥（TCA、paroxetine）：抗膽鹼、鎮靜、姿勢性低血壓。Doxepin ≤ 6 mg/日不在此限。',
      patient: AC_PT + '起身時請慢慢來。' },
    { id: 't2-antipsychotic', table: 2, tags: ['antipsychotic'], level: 'avoid', rec: '避免（特定適應症除外）',
      clinician: '抗精神病藥：避免用於失智症行為問題或譫妄，除非非藥物治療無效且病人可能傷害自己或他人；增加失智者中風、認知退化與死亡風險。思覺失調、雙極性疾患、重鬱症輔助、化療止吐短期使用除外。',
      patient: '這個藥可能讓長輩嗜睡、走路不穩。請照藥袋上的說明吃，不要自己加量；如果出現手抖、動作變慢，請告訴醫師。' },
    { id: 't2-barbiturate', table: 2, tags: ['barbiturate'], level: 'avoid', rec: '避免',
      clinician: 'Barbiturates：高依賴性、低劑量即有過量風險。', patient: SED_FALL + '請不要自己加量或突然停藥。' },
    { id: 't2-benzo', table: 2, tags: ['benzo'], level: 'avoid', rec: '避免',
      clinician: 'Benzodiazepines：老年人敏感度增加、代謝變慢，增加認知障礙、譫妄、跌倒、骨折與車禍風險；併用鴉片類可能致命。癲癇、快速動眼期睡眠障礙、酒精/BZD 戒斷、嚴重廣泛性焦慮等可考慮。',
      patient: '長輩吃這類安眠、鎮定藥，' + SED_FALL + '請不要自己加量；想減藥請和醫師討論，不要突然停藥。' },
    { id: 't2-zdrug', table: 2, tags: ['zdrug'], level: 'avoid', rec: '避免',
      clinician: '非苯二氮平類安眠藥（Z-drugs）：不良事件與 BZD 相似（譫妄、跌倒、骨折、車禍），對睡眠改善有限。',
      patient: '長輩吃安眠藥，半夜起床時容易跌倒，也可能出現夢遊等行為。吃完藥請直接上床；不要自己加量，想減藥請和醫師討論。' },
    { id: 't2-sulfonylurea', table: 2, tags: ['sulfonylurea'], level: 'avoid', rec: '避免作為第一或第二線',
      clinician: 'Sulfonylureas：避免作為第一線或第二線單方或加成治療（低血糖、心血管事件與死亡風險）；若必須使用，優先短效（glipizide），避免長效（glyburide、glimepiride）。',
      patient: '長輩吃這類降血糖藥容易發生低血糖（冒冷汗、發抖、心跳快、頭暈）。請三餐定時吃，身上隨時帶糖果；發生低血糖請先吃糖，再告訴醫師。' },
    { id: 't2-megestrol', table: 2, tags: ['megestrol'], level: 'avoid', rec: '避免',
      clinician: 'Megestrol：增加血栓與死亡風險，對體重效果有限。', patient: '這個藥可能增加血管長血塊的機會。如果小腿突然腫痛、胸痛或很喘，請馬上就醫。' },
    { id: 't2-desmopressin', table: 2, tags: ['desmopressin'], level: 'avoid', rec: '避免用於夜尿',
      clinician: 'Desmopressin：避免用於治療夜尿或夜間多尿（低血鈉風險高）。',
      patient: '這個藥可能讓血中的鈉太低。如果頭痛、噁心、精神變差，請馬上就醫；睡前不要喝太多水。' },
    { id: 't2-ppi', table: 2, tags: ['ppi'], level: 'caution', rec: '避免規律使用超過 8 週',
      clinician: 'PPI：避免規則使用超過 8 週，除非高風險族群（口服類固醇或長期 NSAID）、糜爛性食道炎、Barrett 食道、病理性分泌過多，或停藥失敗需維持治療（C. difficile、骨折、骨質流失風險）。',
      patient: '胃藥長期吃（超過 2 個月）可能影響骨頭和腸道健康。胃不痛了，請回診問醫師可不可以減量或停藥。' },
    { id: 't2-metoclopramide', table: 2, tags: ['metoclopramide'], level: 'avoid', rec: '避免（胃輕癱短期除外）',
      clinician: 'Metoclopramide：錐體外症狀、遲發性運動異常；除胃輕癱且使用 ≤ 12 週外應避免。',
      patient: '這個藥不適合長期吃。如果出現手抖、嘴巴或舌頭不自主亂動，請告訴醫師。' },
    { id: 't2-mineral-oil', table: 2, tags: ['mineral_oil'], level: 'avoid', rec: '避免口服',
      clinician: '口服礦物油：吸入性肺炎風險。', patient: '躺著吃容易嗆到，請坐直時吃，吃完不要馬上躺下。' },
    { id: 't2-nsaid', table: 2, tags: ['nsaid'], level: 'avoid', rec: '避免長期使用',
      clinician: '非選擇性 NSAID：避免長期使用，除非其他藥物無效且可併用胃保護劑；增加腸胃出血、潰瘍、腎損傷、血壓上升與心衰竭風險。',
      patient: '長輩長期吃止痛藥，容易胃出血、傷腎、血壓升高。請飯後吃，痛的時候才吃，不要自己長期吃；大便變黑請馬上就醫。' },
    { id: 't2-nsaid-high', table: 2, tags: ['nsaid_high'], level: 'avoid', rec: '避免',
      clinician: 'Indomethacin、ketorolac：在 NSAID 中不良反應風險最高（腸胃出血、腎損傷；indomethacin 有中樞副作用），應避免。',
      patient: '這個止痛藥對長輩的胃和腎臟比較傷，請和醫師討論是否有更適合的止痛藥。' },
    { id: 't2-meperidine', table: 2, tags: ['meperidine'], level: 'avoid', rec: '避免',
      clinician: 'Meperidine：一般劑量止痛效果有限，代謝物易蓄積導致神經毒性（譫妄、癲癇），有更安全的替代藥。',
      patient: '這個止痛藥容易讓長輩頭腦混亂，請和醫師討論是否有更適合的止痛藥。' },
    { id: 't2-muscle-relaxant', table: 2, tags: ['muscle_relaxant'], level: 'avoid', rec: '避免',
      clinician: '骨骼肌鬆弛劑：老年人耐受差（抗膽鹼、鎮靜、骨折風險），且有效劑量下療效有限。',
      patient: '長輩吃肌肉鬆弛劑容易想睡、頭暈、跌倒，而且效果有限。請和醫師討論是否需要繼續吃。' },

    // ----- 表 4 -----
    { id: 't4-dabigatran', table: 4, tags: ['dabigatran'], minAge: 75, level: 'caution', rec: '謹慎使用',
      clinician: 'Dabigatran：≥ 75 歲長期治療時，腸胃道出血風險高於 warfarin 及其他 DOAC，謹慎使用並監測腎功能。',
      patient: '75 歲以上吃這個藥，胃腸出血的機會比較高，請注意大便顏色有沒有變黑。' },
    { id: 't4-prasugrel', table: 4, tags: ['prasugrel'], minAge: 75, level: 'caution', rec: '謹慎使用',
      clinician: 'Prasugrel：≥ 75 歲出血風險增加；若使用，考慮較低劑量（5 mg）。', patient: '請注意有沒有不正常出血，例如黑便、血尿、瘀青變多。' },
    { id: 't4-sglt2', table: 4, tags: ['sglt2'], level: 'caution', rec: '謹慎使用',
      clinician: 'SGLT2 抑制劑：老年人泌尿生殖道感染（尤其女性、首月）與正常血糖酮酸中毒風險增加，需監測。', patient: '' },
    { id: 't4-hyponatremia', table: 4, tags: ['antipsychotic', 'carbamazepine', 'diuretic', 'mirtazapine', 'snri', 'ssri', 'tca', 'tramadol'], level: 'caution', rec: '謹慎使用',
      clinician: '可能造成或加重 SIADH／低血鈉：開始使用或調整劑量時應密切監測血鈉。', patient: NA_PT },

    // ----- 表 6：依 CrCl -----
    { id: 't6-baclofen', table: 6, tags: ['baclofen'], crcl: { max: 60 }, level: 'avoid', rec: 'CrCl < 60 避免',
      clinician: 'Baclofen：CrCl < 60 有腦病變風險，避免使用。', patient: RENAL_AVOID },
    { id: 't6-cipro', table: 6, tags: ['cipro'], crcl: { max: 30 }, level: 'adjust', rec: 'CrCl < 30 減量',
      clinician: 'Ciprofloxacin：CrCl < 30 常見感染劑量需減量（中樞副作用、肌腱斷裂風險）。', patient: RENAL_REDUCE },
    { id: 't6-colchicine', table: 6, tags: ['colchicine'], crcl: { max: 30 }, level: 'adjust', rec: 'CrCl < 30 減量並監測',
      clinician: 'Colchicine：CrCl < 30 減量，監測腸胃、神經肌肉與骨髓毒性。', patient: RENAL_REDUCE + '如果一直拉肚子、肌肉無力，請馬上就醫。' },
    { id: 't6-duloxetine', table: 6, tags: ['duloxetine'], crcl: { max: 30 }, level: 'avoid', rec: 'CrCl < 30 避免',
      clinician: 'Duloxetine：CrCl < 30 避免（腸胃副作用增加）。', patient: RENAL_AVOID },
    { id: 't6-edoxaban-low', table: 6, tags: ['edoxaban'], crcl: { max: 15 }, level: 'avoid', rec: 'CrCl < 15 避免',
      clinician: 'Edoxaban：CrCl < 15 避免。', patient: RENAL_AVOID },
    { id: 't6-edoxaban-mid', table: 6, tags: ['edoxaban'], crcl: { min: 15, max: 50 }, level: 'adjust', rec: 'CrCl 15–50 減量',
      clinician: 'Edoxaban：CrCl 15–50 減量。', patient: RENAL_REDUCE },
    { id: 't6-edoxaban-high', table: 6, tags: ['edoxaban'], crcl: { min: 95 }, level: 'avoid', rec: 'CrCl > 95 避免（心房顫動）',
      clinician: 'Edoxaban：心房顫動且 CrCl > 95 療效較差，避免使用。', patient: '' },
    { id: 't6-enoxaparin', table: 6, tags: ['enoxaparin'], crcl: { max: 30 }, level: 'adjust', rec: 'CrCl < 30 減量',
      clinician: 'Enoxaparin：CrCl < 30 減量（出血風險）。', patient: RENAL_REDUCE },
    { id: 't6-levetiracetam', table: 6, tags: ['levetiracetam'], crcl: { max: 80 }, level: 'adjust', rec: 'CrCl ≤ 80 減量',
      clinician: 'Levetiracetam：CrCl ≤ 80 依仿單減量（中樞副作用）。', patient: RENAL_REDUCE },
    { id: 't6-pregabalin', table: 6, tags: ['pregabalin'], crcl: { max: 60 }, level: 'adjust', rec: 'CrCl < 60 減量',
      clinician: 'Pregabalin：CrCl < 60 減量（中樞副作用）。', patient: RENAL_REDUCE },
    { id: 't6-probenecid', table: 6, tags: ['probenecid'], crcl: { max: 30 }, level: 'avoid', rec: 'CrCl < 30 避免',
      clinician: 'Probenecid：CrCl < 30 避免（失去療效）。', patient: RENAL_AVOID },
    { id: 't6-spironolactone', table: 6, tags: ['spironolactone'], crcl: { max: 30 }, level: 'avoid', rec: 'CrCl < 30 避免',
      clinician: 'Spironolactone：CrCl < 30 避免（高血鉀）。', patient: RENAL_AVOID },
    { id: 't6-triamterene', table: 6, tags: ['triamterene'], crcl: { max: 30 }, level: 'avoid', rec: 'CrCl < 30 避免',
      clinician: 'Triamterene：CrCl < 30 避免（高血鉀、低血鈉）。', patient: RENAL_AVOID },
    { id: 't6-tramadol', table: 6, tags: ['tramadol'], crcl: { max: 30 }, level: 'adjust', rec: 'CrCl < 30 減量／避免長效',
      clinician: 'Tramadol：CrCl < 30 速效劑型減量；長效劑型避免（中樞副作用）。', patient: RENAL_REDUCE },
    { id: 't6-tmpsmx-low', table: 6, tags: ['tmpsmx'], crcl: { max: 15 }, level: 'avoid', rec: 'CrCl < 15 避免',
      clinician: 'TMP-SMX：CrCl < 15 避免（腎功能惡化、高血鉀）。', patient: RENAL_AVOID },
    { id: 't6-tmpsmx-mid', table: 6, tags: ['tmpsmx'], crcl: { min: 15, max: 30 }, level: 'adjust', rec: 'CrCl 15–29 減量',
      clinician: 'TMP-SMX：CrCl 15–29 減量並監測腎功能與血鉀。', patient: RENAL_REDUCE },
    { id: 't6-nitrofurantoin', table: 6, tags: ['nitrofurantoin'], crcl: { max: 30 }, level: 'avoid', rec: 'CrCl < 30 避免',
      clinician: 'Nitrofurantoin：CrCl < 30 避免（療效不足、毒性增加）。', patient: RENAL_AVOID },
    { id: 't6-h2ra', table: 6, tags: ['h2ra'], crcl: { max: 50 }, level: 'adjust', rec: 'CrCl < 50 減量',
      clinician: 'H2 阻斷劑：CrCl < 50 減量（意識改變風險）。', patient: RENAL_REDUCE },
    { id: 't6-digoxin', table: 6, tags: ['digoxin'], crcl: { max: 30 }, level: 'adjust', rec: 'CrCl < 30 減量',
      clinician: 'Digoxin：CrCl < 30 減量並監測血中濃度。', patient: RENAL_REDUCE }
  ];

  /* ======================================================
   * 表 5：交互作用（依整份用藥清單判斷）
   *   pair : a 類與 b 類同時存在
   *   count: 同一類別藥品數 ≥ min
   *   when : 額外條件 { renalBelow, sex }
   * ====================================================== */
  var INTERACTIONS = [
    { id: 't5-ras-ksparing', type: 'pair', a: ['ras'], b: ['k_sparing'], when: { renalBelow: 60 }, level: 'avoid', rec: '避免',
      clinician: 'RAS 抑制劑 + 保鉀利尿劑（amiloride、triamterene），且 CKD ≥ 3a：高血鉀風險，避免併用。',
      patient: '這兩種藥一起吃，加上腎臟功能較差，血中的鉀可能太高，會讓心跳不規則。請定期抽血，不要自己吃低鈉鹽或含鉀的補品。' },
    { id: 't5-opioid-benzo', type: 'pair', a: ['opioid'], b: ['benzo'], level: 'avoid', rec: '避免',
      clinician: '鴉片類 + Benzodiazepines：過量與呼吸抑制風險，避免併用。',
      patient: '止痛藥和安眠鎮定藥一起吃，可能讓人睡得太沉、呼吸變慢。服藥期間不要喝酒，家人也要多留意。' },
    { id: 't5-opioid-gaba', type: 'pair', a: ['opioid'], b: ['gabapentinoid'], level: 'avoid', rec: '避免（轉換期或減少鴉片類用量時除外）',
      clinician: '鴉片類 + gabapentinoids：嚴重鎮靜與呼吸抑制風險；除非由鴉片類轉換為 gabapentinoid，或用以減少鴉片類劑量，否則避免，並謹慎使用。',
      patient: '這兩種藥一起吃，容易睡得太沉、呼吸變慢。請不要喝酒，不要自己加量。' },
    { id: 't5-cns3', type: 'count', tag: 'cns', min: 3, level: 'avoid', rec: '避免 ≥ 3 種',
      clinician: '≥ 3 種中樞神經作用藥物（抗癲癇、抗憂鬱、抗精神病、BZD、Z-drugs、鴉片類、肌肉鬆弛劑）：跌倒與骨折風險增加，應減少中樞作用藥數量。',
      patient: '您有 3 種以上會影響頭腦和精神的藥（例如安眠藥、止痛藥、神經痛藥）。一起吃容易頭暈、跌倒，走路請小心，必要時使用扶手或助行器。' },
    { id: 't5-ac2', type: 'count', tag: 'anticholinergic', min: 2, level: 'avoid', rec: '避免、盡量減少',
      clinician: '≥ 2 種強抗膽鹼藥物併用：認知功能下降風險增加，應盡量減少抗膽鹼藥數量。',
      patient: '您有兩種以上的藥都可能造成口乾、便秘、小便解不出來、記憶變差，請和醫師討論能不能減少。' },
    { id: 't5-lithium', type: 'pair', a: ['lithium'], b: ['ras', 'loop'], level: 'avoid', rec: '避免；監測鋰濃度',
      clinician: 'Lithium + ACEI／ARB／ARNI／環利尿劑：鋰中毒風險，避免併用；若必須使用需監測鋰濃度。',
      patient: '這些藥一起吃，可能讓鋰鹽在身體累積。請定期抽血；如果手抖變嚴重、拉肚子、走路不穩，請馬上就醫。' },
    { id: 't5-warfarin', type: 'pair', a: ['warfarin'], b: ['amiodarone', 'cipro', 'macrolide', 'tmpsmx', 'ssri'], level: 'avoid', rec: '盡量避免；需併用時密切監測 INR',
      clinician: 'Warfarin + amiodarone／ciprofloxacin／macrolides（azithromycin 除外）／TMP-SMX／SSRIs：出血風險增加；盡量避免，必要時密切監測 INR。',
      patient: '這些藥會讓預防血栓的藥效果變強，比較容易流血。請注意有沒有瘀青、牙齦流血、黑便，並依醫師安排抽血。' },
    { id: 't5-alpha1-loop', type: 'pair', a: ['alpha1'], b: ['loop'], when: { sex: 'F' }, level: 'avoid', rec: '避免（女性長者）',
      clinician: '周邊 α1 阻斷劑 + 環利尿劑（老年女性）：尿失禁風險增加，除非病情需要否則避免。',
      patient: '這兩種藥一起吃，可能比較容易漏尿或頭暈。有這些情形請告訴醫師。' },
    { id: 't5-phenytoin-tmpsmx', type: 'pair', a: ['phenytoin'], b: ['tmpsmx'], level: 'avoid', rec: '避免',
      clinician: 'Phenytoin + TMP-SMX：phenytoin 毒性風險增加，避免併用。',
      patient: '這兩種藥一起吃，可能讓抗癲癇藥在身體裡太多。如果頭暈、走路不穩、眼睛看東西晃動，請馬上就醫。' },
    { id: 't5-theophylline', type: 'pair', a: ['theophylline'], b: ['cimetidine', 'cipro'], level: 'avoid', rec: '避免',
      clinician: 'Theophylline + cimetidine／ciprofloxacin：theophylline 毒性風險增加，避免併用。',
      patient: '這兩種藥一起吃，可能讓氣喘藥在身體裡太多。如果心跳很快、噁心嘔吐、手抖，請馬上就醫。' },
    { id: 't5-tmpsmx-ras', type: 'pair', a: ['tmpsmx'], b: ['ras'], when: { renalBelow: 60 }, level: 'caution', rec: '謹慎使用',
      clinician: 'TMP-SMX + ACEI／ARB／ARNI 且腎功能下降：高血鉀風險，謹慎使用並監測血鉀。',
      patient: '這兩種藥一起吃，加上腎臟功能較差，血中的鉀可能變高。請依醫師安排抽血檢查。' }
  ];

  var CNS_TAGS = ['antiepileptic', 'tca', 'ssri', 'snri', 'antipsychotic', 'benzo', 'zdrug', 'opioid', 'muscle_relaxant', 'barbiturate'];

  return { version: '2023 AGS Beers Criteria®', ageMin: 65, LEXICON: L, ITEMS: ITEMS, INTERACTIONS: INTERACTIONS, CNS_TAGS: CNS_TAGS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BEERS_2023;
