// Monster図鑑の仕様書をゲーム内表示用にまとめたデータ。
export const MONSTER_BOOK = [
  {
    no: 1, id: 'hollowBeast', name: '虚ろな獣', category: 'ノーマルエネミー',
    areas: 'はじまりの村、深緑の森', hp: '16（暫定）', attack: 3, defense: 2, speed: 4, accuracy: 1,
    behavior: '特記事項なし', gold: '3 G', drop: 'なし', condition: 'エンカウント率 4%',
    description: '黒露牢（クローロ）に侵食された獣。集合体として存在し、個としての意識を持たない。'
  },
  {
    no: 2, id: 'oniScout', name: '鬼の斥候', category: 'ノーマルエネミー',
    areas: '忘却の洞窟、深緑の森', hp: '24（暫定）', attack: 5, defense: 3, speed: 2, accuracy: 1,
    behavior: '斧による攻撃。会心の一撃を狙う場合、2ターンかかることがある。波紋が有効。',
    gold: '5 G', drop: '古びた斧（7%／攻撃力 +3）', condition: 'エンカウント率 3%',
    description: '鬼族の斥候。鬼族の中では最弱とされる種族で、陽光を苦手とする。'
  },
  {
    no: 3, id: 'gaki', name: '餓鬼', category: 'ノーマルエネミー',
    areas: '深緑の森', hp: '未指定', attack: 1, defense: 1, speed: 3, accuracy: 1,
    behavior: '特記事項なし', gold: '2 G', drop: '餓鬼の腐肉（18%）',
    condition: 'エンカウント率 20%',
    description: '餓鬼の腐肉を所持すると、大半の敵とのエンカウント率が1.2倍になる。入手後3回の戦闘まではインベントリに残る。'
  },
  {
    no: 4, id: 'zombie', name: '虚ろな屍死人（ゾンビ）', category: 'ノーマルエネミー',
    areas: '忘却の洞窟', hp: '未指定', attack: 3, defense: 2, speed: 1, accuracy: 1,
    behavior: '防御力2だが、1戦で倒しきれないことがある。日光に弱く、海に入ると浸透圧で弾け飛ぶ。',
    gold: '8 G', drop: 'なし', condition: '仕様書にエンカウント率の指定なし',
    description: '多少の知識を持つ屍死人。一部の個体は進化する。'
  },
  {
    no: 5, id: 'lionne', name: 'リオーネ・シーマン', title: '泡沫の天使', category: '特殊エネミー',
    areas: '外洋', hp: '未指定', attack: 68, defense: 21, speed: 54, accuracy: 21,
    behavior: '復讐への執着。右手のバッカルコーンで3回噛まれると即死するという噂がある。',
    gold: 'なし', drop: 'リオーネのロケットペンダント',
    condition: 'S5後、切り札の前にシープ・シーマンを討伐する',
    description: '海賊団ゴーストルール団長の娘。ロケットペンダントには母と思われる人物の写真がある。'
  },
  {
    no: 6, id: 'atone', name: 'アトネ', title: '色慾の大罪人', category: 'ユニークエネミー',
    areas: '神域の入江', hp: 4800, attack: 1, defense: 1, speed: 1, accuracy: 54,
    behavior: '魅了：25%で行動不能、12%で戦闘から強制退出。アシスタント「Rabbit hall」：アニマル、モニタリング、バニーガール。',
    gold: '600 G', drop: '色慾の権能（モニタリング、アニマルを習得）',
    condition: '虚ろな獣を累計20体討伐する',
    description: '崩壊前世界ではトップアイドル。黒露牢に適応し、色慾の権能を得た。'
  },
  {
    no: 7, id: 'bug', name: 'バグ', title: '暴食の大罪人', category: '特殊エネミー',
    areas: '食慾大罪人の謁見の間', hp: '未指定', attack: 21, defense: 43, speed: 78, accuracy: '??',
    behavior: 'アシスタント「ラグトレイン」：ヴァンパイア、リインカーネーションアップル、チェリーポップ。',
    gold: '680 G', drop: '暴食の権能', condition: '練られた肉塊と布団に入った穀物を討伐する',
    description: 'これまで食べてきた栄養素すべてが、その身に宿っている。'
  },
  {
    no: 8, id: 'kneadedMeat', name: '練られた肉塊', category: 'レアエネミー',
    areas: '食慾大罪人の謁見の間', hp: '未指定', attack: 12, defense: '??', speed: 1, accuracy: 46,
    behavior: '捕食しようとする。「粘着質な血液」を使用すると逃走する。',
    gold: '72 G', drop: '腐りかけの練られた肉塊', condition: 'エンカウント率 2%',
    description: 'ハンバーグのような姿をしている。'
  },
  {
    no: 9, id: 'stickyFruit', name: '粘着質な果実', category: 'エピックエネミー',
    areas: '食慾大罪人の謁見の間', hp: '未指定', attack: 108, defense: 0, speed: 0, accuracy: 2,
    behavior: '自爆する', gold: '0 G', drop: '粘着質な血液', condition: 'エンカウント率 0.18%',
    description: 'トマトのような姿をしている。'
  },
  {
    no: 10, id: 'grainBed', name: '布団に入った穀物', category: 'レアエネミー',
    areas: '食慾大罪人の謁見の間', hp: '未指定', attack: 0, defense: 30, speed: 0, accuracy: 0,
    behavior: '眠っている。攻撃するには気が引ける相手。', gold: '1780 G', drop: '黄色の布団',
    condition: '蹲る穀物に「ふかふかの布団」を渡す',
    description: '蹲る穀物がふかふかの布団に入って眠っている。オムライスのような姿。'
  },
  {
    no: 11, id: 'crouchingGrain', name: '蹲る穀物', category: 'エピックエネミー',
    areas: '食慾大罪人の謁見の間', hp: '未指定', attack: 0, defense: 0, speed: 0, accuracy: 0,
    behavior: '戦闘する気も起きないほど寒がっている。', gold: '-53 G（53 G減少）', drop: 'なし',
    condition: 'エンカウント率 0.021%',
    description: '謁見の間が冷え込んでおり、寒さに震えて蹲っている。'
  },
  {
    no: 12, id: 'trainTrain', name: 'トレイン・トレイン・トランセンデンス', category: '???',
    areas: 'イグジット・エイトループ線3番ホーム', hp: '未指定', attack: 498, defense: 1098, speed: 40946, accuracy: '??',
    behavior: '新幹線で突進。浮遊していなければ即死する。', gold: '540000 G', drop: 'なし',
    condition: '3番ホームに入る',
    description: '「臨時新幹線 Train Train transcendence が3番ホームに停車いたします」'
  },
  {
    no: 13, id: 'lagTrain', name: 'ラグトレイン・トランセンデンス', category: '???',
    areas: 'イグジット・エイトループ線4番ホーム', hp: 120, attack: '???????', defense: 99999, speed: 1203400, accuracy: 2,
    behavior: '仕様書では、倒すにはプログラム改ざんが必要とされている。', gold: '0 G', drop: 'なし',
    condition: '4番ホームに入る',
    description: '次の駅は「きさらぎ駅」。防御力を超越する攻撃が必要とされる。'
  },
  {
    no: 14, id: 'cinderella', name: 'シンデレラ・イングリッド・アークマン', category: '???',
    areas: '氷柱上の尖塔', hp: '未指定', attack: 190, defense: 210, speed: 7432400, accuracy: '必中',
    behavior: '純度の高い氷柱が音を割くように肉を裂く。', gold: '2800000 G',
    drop: '悪名：賞金首280万のシンデレラ殺し', condition: '氷柱上の尖塔に入る',
    description: '不変の呪いにより、精神も昔のまま。黄金のカバンを所持する。'
  },
  {
    no: 15, id: 'riskyJoker', name: 'ジョストリスキィ・ジョーカー／潮花 貘兎', category: '特殊エネミー',
    areas: '未指定', hp: '未指定', attack: '???', defense: '???', speed: '???', accuracy: '必中',
    behavior: 'アシスタント「トリック・フェイス・ジャック・ロウワー」：ジャックポット、ライフ・イリュージョナー・ゲーム。',
    gold: '768000 G', drop: 'なし',
    condition: '所持GOLDが4087万に達した状態で灰燼の火山を訪れる',
    description: '本人はリスキーなことが嫌いらしい。アシスタントの能力でステータスが変化する。'
  },
  {
    no: 16, id: 'blackOniReplica', name: '黒鬼の写身', category: 'ノーマルエネミー',
    areas: '忘却の洞窟、灰燼の火山', hp: '未指定', attack: 6, defense: 2, speed: 8, accuracy: 2,
    behavior: '太刀を持つ。黒鬼の分裂体なので本体ほど強くない。', gold: '16 G',
    drop: '黒鬼の欠片（12個で黒鬼戦）', condition: 'エンカウント率 46%',
    description: '黒鬼の分裂体。'
  }
];
