<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import ChartFrame from '$lib/components/ChartFrame.svelte';
  import DataTable from '$lib/components/DataTable.svelte';
  import DivergingBars from '$lib/components/DivergingBars.svelte';
  import DotStrip, { type StripRow } from '$lib/components/DotStrip.svelte';
  import LineChart, { type LineBand } from '$lib/components/LineChart.svelte';
  import { formatMonth, formatMonthShort, pct } from '$lib/format.ts';
  import { TOPICS, TOPIC_LABELS, scopeName } from '$lib/labels.ts';

  let { data } = $props();

  const pct1 = (v: number | null) => pct(v, 1);
  /** 分析 JSON のポイント値（例 −2.8）を符号付きで表す */
  const fmtPt = (v: number | null | undefined) => {
    if (v === null || v === undefined) return '—';
    const r = Number(v.toFixed(1));
    if (r === 0) return '±0.0pt';
    return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(1)}pt`;
  };
  const ym = (m: string) => m.slice(0, 7);
  const toPeriod = (m: string) => `${m}-01`;
  const monthLabel = (m: string) => formatMonth(toPeriod(m));

  const range = $derived(`${formatMonth(data.months[0] ?? '')}〜${formatMonth(data.months.at(-1) ?? '')}`);

  // ---- 1. 18-24歳と学期暦 ----
  const AGE_CHOICES = ['KR', 'TW', 'US', 'GB', 'DE', 'FR', 'AU', 'BR'];
  const SLOT_COLORS = ['var(--series-2)', 'var(--series-3)'];
  let picks = $state(['US', 'AU']);

  const ageSeries = $derived(
    [
      { id: 'JP', label: '日本', color: 'var(--series-jp)' },
      ...picks.map((c, i) => ({ id: c, label: scopeName(c), color: SLOT_COLORS[i] ?? 'var(--series-ref)' })),
    ].map((s) => ({
      ...s,
      values: data.months.map((m) => {
        const v = data.academic.age1824Levels[s.id]?.[ym(m)];
        return v === null || v === undefined ? null : v / 100;
      }),
    })),
  );

  const academicBands: LineBand[] = $derived(
    data.academic.windows
      .map((w) => ({ from: toPeriod(w.inside[0] ?? ''), to: toPeriod(w.inside.at(-1) ?? ''), label: w.window.includes('春') ? '春休み' : '夏休み' }))
      // 2026年夏は前後の月がそろわず効果の計算には使わないが、帯としては示す
      .concat([{ from: '2026-08-01', to: '2026-09-01', label: '夏休み' }]),
  );

  const academicRows: StripRow[] = $derived(
    data.academic.windows.map((w) => ({
      key: w.window,
      label: w.window,
      sub: `${w.countries}か国`,
      points: w.all.map((c) => ({ id: c.country, value: c.effectPt })),
    })),
  );
  const academicWindow = (key: string) => data.academic.windows.find((w) => w.window === key);

  // 各年齢層の「前後の月」→「休みの時期」の構成比と、その差（4期間の平均）
  type CompositionRow = { age: string; outsidePct: number | null; insidePct: number | null };
  const diffOf = (r: CompositionRow) => (r.outsidePct === null || r.insidePct === null ? null : r.insidePct - r.outsidePct);
  const toAgeRows = (rows: CompositionRow[]) =>
    rows.map((r) => ({
      key: r.age,
      label: `${r.age}歳`,
      sub: r.outsidePct === null || r.insidePct === null ? undefined : `${r.outsidePct.toFixed(1)}% → ${r.insidePct.toFixed(1)}%`,
      value: diffOf(r),
      highlight: r.age === '18-24',
    }));
  const pctText = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)}%`);
  const ageRows = $derived(toAgeRows(data.academic.ageComposition.rows));
  const windowNames = $derived(data.academic.windows.map((w) => w.window));

  // トピックを選んで、そのトピックの中の年齢構成を見る。選択肢には 18-24歳の変化を添えて、トピック間も比べられるようにする
  const topicOptions = $derived(
    TOPICS.filter((t) => data.academic.ageCompositionByTopic.byTopic[t]).map((t) => {
      const r = data.academic.ageCompositionByTopic.byTopic[t]?.find((x) => x.age === '18-24');
      return { key: t, label: `${TOPIC_LABELS[t] ?? t}（18-24歳 ${fmtPt(r ? diffOf(r) : null)}）` };
    }),
  );
  let topic = $state('Writing');
  const topicComposition = $derived(data.academic.ageCompositionByTopic.byTopic[topic] ?? []);

  // ---- 2. 仕事関連比率と休暇 ----
  const workBands: LineBand[] = [
    { from: '2024-08-01', to: '2024-08-01', label: '8月' },
    { from: '2024-12-01', to: '2025-01-01', label: '年末年始' },
    { from: '2025-05-01', to: '2025-05-01', label: 'GW' },
    { from: '2025-08-01', to: '2025-08-01', label: '8月' },
    { from: '2025-12-01', to: '2026-01-01', label: '年末年始' },
    { from: '2026-05-01', to: '2026-05-01', label: 'GW' },
    { from: '2026-08-01', to: '2026-08-01', label: '8月' },
  ];

  const workSeries = $derived([
    { id: 'JP', label: '日本', color: 'var(--series-jp)', values: data.months.map((m) => data.jp[m] ?? null) },
    { id: 'global', label: scopeName('global'), color: 'var(--series-ref)', values: data.months.map((m) => data.global[m] ?? null) },
  ]);

  const SEASON: Record<string, string> = { '08': '夏・お盆', '05': 'GW', '12': '年末', '01': '年始' };
  const workRows: StripRow[] = $derived(
    data.crossCountry.map((c) => ({
      key: c.month,
      label: monthLabel(c.month),
      sub: `${SEASON[c.month.slice(5)] ?? ''}・${c.countries}か国`,
      points: c.all.map((x) => ({ id: x.country, value: x.dipPt })),
    })),
  );
  const crossOf = (key: string) => data.crossCountry.find((c) => c.month === key);
  const GROUPS = ['東アジア', '欧州', '北米', '南半球温帯'];

  const PLACEBO = ['JP', 'FR', 'IT', 'ES', 'DE', 'KR', 'US'];
</script>

<Seo
  title="ChatGPT の使われ方に、日本の学期暦が見えてくる？"
  description="OpenAI Signals の国別月次データと内閣府の祝日データを組み合わせ、日本の休暇・学期の暦が ChatGPT メッセージの構成に表れるかを調べた独自分析。"
/>

<header class="page-head">
  <p class="eyebrow">独自分析 · OpenAI Signals {data.sources.signals.release} × 内閣府 祝日 CSV · {range}</p>
  <h1>ChatGPT の使われ方に、<br class="wide-only" />日本の学期暦が見えてくる？</h1>
  <p class="lead">
    日本の ChatGPT メッセージに占める 18-24歳の割合は、春休みと夏休みの時期に下がる傾向が見られました。
    その下がり方は、同じ時期で比べると120〜139か国の上位1割以内です。一方、仕事関連メッセージの割合は、日本だけでなく北半球の多くの国で夏に下がっています。
    OpenAI Signals と日本の暦を組み合わせ、使われ方に表れる季節の違いを探りました。
  </p>
</header>

<aside class="notice" aria-label="このページについて">
  <p>
    このページの値は、公式 CSV の構成比をもとに本プロジェクトが計算したもの（前後の月との差、国別の順位など）を含みます。
    公式の集計値そのものではありません。すべてメッセージの構成比で、利用者数・件数・利用率ではありません。
  </p>
</aside>

<section class="prose" aria-labelledby="summary">
  <h2 id="summary" class="section-title">要点</h2>
  <ul class="points">
    <li>
      <strong>18-24歳のメッセージの構成比は、日本の大学の休みに近い2〜3月と8〜9月に下がります。</strong>
      日本の暦に合わせた4つの期間すべてで、日本の下がり方は120〜139か国の上位1割以内でした。
      同じ時期に下がるのは18-24歳だけで、トピック別に見ても Self-expression 以外のすべてで下がっています。
    </li>
    <li>
      <strong>仕事関連メッセージの割合は8月に下がりますが、日本だけではありません。</strong>
      北半球の多くの国で8月に下がり、南半球ではほとんど下がりません。
    </li>
    <li>
      <strong>年末年始は月次の構成比に表れません。</strong>欧米や南半球が12月に下がるのに対し、日本は上がりました。
      ただし、日本の年末年始は12月と1月にまたがるため、月単位の集計では見えにくい点に注意が必要です。
    </li>
  </ul>
</section>

<section aria-labelledby="academic">
  <h2 id="academic" class="section-title">1. 18-24歳の構成比と学期暦</h2>
  <p class="muted section-lead">
    18-24歳の構成比は期間全体で下がり続けていますが、日本では毎年2〜3月と8〜9月に一段と下がり、4月と10月に戻ります。
    比較国を選ぶと、その国の休みの時期に下がる様子と比べられます。
  </p>

  <div class="filters">
    {#each [0, 1] as i (i)}
      <label class="pill">
        <span class="swatch" style:background={SLOT_COLORS[i]} aria-hidden="true"></span>比較国 {i + 1}
        <select bind:value={picks[i]}>
          {#each AGE_CHOICES as code (code)}
            <option value={code} disabled={picks[1 - i] === code}>{scopeName(code)}</option>
          {/each}
        </select>
      </label>
    {/each}
  </div>

  <ChartFrame
    title="18-24歳のメッセージの構成比"
    meta="指標: age_group=18-24 の構成比・分母: 各国・各月の全メッセージ・月次（{range}）。網かけは日本の大学の長期休暇に近い時期"
    legend={ageSeries.map((s) => ({ label: s.label, color: s.color }))}
  >
    <LineChart
      periods={data.months}
      series={ageSeries}
      bands={academicBands}
      height={300}
      axisLabel={formatMonthShort}
      periodLabel={formatMonth}
      format={pct1}
      ariaLabel="日本と比較国の 18-24 歳のメッセージ構成比の月次推移。日本の大学の長期休暇に近い時期を網かけで表示"
    />
    {#snippet notes()}
      <p>年齢は利用者が申告したもので、18-24歳は学生と同じではありません。網かけの時期は一般的な大学の休みに合わせた本分析の設定です。</p>
    {/snippet}
    {#snippet table()}
      <DataTable
        caption="18-24歳のメッセージの構成比"
        columns={[{ key: 'm', label: '月' }, ...ageSeries.map((s) => ({ key: s.id, label: s.label, numeric: true }))]}
        rows={data.months.map((m, i) => ({ m: formatMonth(m), ...Object.fromEntries(ageSeries.map((s) => [s.id, pct1(s.values[i] ?? null)])) }))}
      />
    {/snippet}
  </ChartFrame>

  <ChartFrame
    title="日本の休みの時期に、18-24歳の構成比はどれだけ下がったか"
    meta="指標: 休みの2か月の平均 − 前後1か月の平均（ポイント）・分母: 各国・各月の全メッセージ・1点が1か国"
    legend={[
      { label: '日本', color: 'var(--series-jp)', kind: 'rect' },
      { label: 'その他の国', color: 'var(--series-ref)', kind: 'rect' },
    ]}
  >
    <DotStrip
      rows={academicRows}
      highlight="JP"
      highlightLabel="日本"
      nameOf={scopeName}
      format={fmtPt}
      ariaLabel="日本の大学の休みに近い時期の、18-24歳の構成比の変化の国別分布"
      describe={(r) => {
        const w = academicWindow(r.key);
        return `${r.label}: 日本 ${fmtPt(w?.jpEffectPt)}、${w?.countries}か国中 ${w?.jpRank}位（下がった順）、全か国の中央値 ${fmtPt(w?.medianPt)}`;
      }}
    />
    {#snippet notes()}
      <p>横の位置が値で、左ほど大きく下がった国です。縦の積み上がりは、値が近い国の点が重ならないように下から積んだもので、高い所ほどその値の近くに国が多いことを示します。▲は全か国の中央値です。</p>
      <p>
        日本より左にあるのは主に小さな国で、標本が少なく差分プライバシーのノイズの影響を受けやすいと考えられます（国別の標本数は公開されていません）。
      </p>
    {/snippet}
    {#snippet table()}
      <DataTable
        caption="18-24歳の構成比の変化"
        columns={[
          { key: 'w', label: '期間' },
          { key: 'jp', label: '日本', numeric: true },
          { key: 'rank', label: '日本の順位', numeric: true },
          { key: 'med', label: '全か国の中央値', numeric: true },
          { key: 'US', label: 'アメリカ合衆国', numeric: true },
          { key: 'DE', label: 'ドイツ', numeric: true },
          { key: 'AU', label: 'オーストラリア', numeric: true },
        ]}
        rows={data.academic.windows.map((w) => ({
          w: w.window,
          jp: fmtPt(w.jpEffectPt),
          rank: `${w.jpRank} / ${w.countries}`,
          med: fmtPt(w.medianPt),
          US: fmtPt(w.all.find((c) => c.country === 'US')?.effectPt),
          DE: fmtPt(w.all.find((c) => c.country === 'DE')?.effectPt),
          AU: fmtPt(w.all.find((c) => c.country === 'AU')?.effectPt),
        }))}
      />
    {/snippet}
  </ChartFrame>

  <ChartFrame
    title="休みの時期に割合が下がるのは、18-24歳だけ"
    meta="指標: 年齢層の構成比の「休みの時期 − 前後の月」（ポイント）・分母: 日本・各月の全メッセージ。4つの休み期間の平均。年齢層の下の数字は前後の月 → 休みの時期の構成比"
  >
    <DivergingBars
      rows={ageRows}
      format={fmtPt}
      negLabel="休みの時期に割合が下がった"
      posLabel="上がった"
      ariaLabel="日本の休みの時期の、年齢層別の構成比の変化"
    />
    {#snippet notes()}
      <p>
        年齢構成は合計が100%なので、18-24歳の割合が下がった分、他の年齢層の割合が上がります。上がり方は特定の年齢層に偏っていません。
        構成比の比較なので、18-24歳のメッセージ数が減ったのか、他の年齢層が増えたのかは区別できません。
      </p>
    {/snippet}
    {#snippet table()}
      <DataTable
        caption="年齢層別の構成比"
        columns={[
          { key: 'age', label: '年齢層' },
          { key: 'out', label: '前後の月', numeric: true },
          { key: 'in', label: '休みの時期', numeric: true },
          { key: 'diff', label: '差', numeric: true },
          ...windowNames.map((w) => ({ key: w, label: `差: ${w}`, numeric: true })),
        ]}
        rows={data.academic.ageComposition.rows.map((r) => ({
          age: `${r.age}歳`,
          out: pctText(r.outsidePct),
          in: pctText(r.insidePct),
          diff: fmtPt(diffOf(r)),
          ...Object.fromEntries((data.academic.ageGroupWindows.byAge[r.age] ?? []).map((w) => [w.window, fmtPt(w.effectPt)])),
        }))}
      />
    {/snippet}
  </ChartFrame>

  <div class="filters">
    <label class="pill">
      トピック
      <select bind:value={topic}>
        {#each topicOptions as o (o.key)}
          <option value={o.key}>{o.label}</option>
        {/each}
      </select>
    </label>
  </div>

  <ChartFrame
    title="トピック別の年齢構成: {TOPIC_LABELS[topic] ?? topic}（{topic}）"
    meta="指標: 年齢層の構成比の「休みの時期 − 前後の月」（ポイント）・分母: 日本・各月の、このトピックのメッセージ。4つの休み期間の平均。年齢層の下の数字は前後の月 → 休みの時期の構成比"
  >
    <DivergingBars
      rows={toAgeRows(topicComposition)}
      format={fmtPt}
      negLabel="休みの時期に割合が下がった"
      posLabel="上がった"
      ariaLabel="{TOPIC_LABELS[topic] ?? topic}のメッセージの、休みの時期の年齢層別の構成比の変化"
    />
    {#snippet notes()}
      <p>
        Self-expression（自己表現）以外のすべてのトピックで、休みの時期に 18-24歳の割合が下がりました（選択肢の括弧内を参照）。Self-expression だけはほぼ変わりません。
        文章作成や技術的な相談など、学業にも使われやすい用途で下がっている点は、学生の休みと整合します。ただし、メッセージが学業に関するものかどうかは、このデータからはわかりません。
      </p>
    {/snippet}
    {#snippet table()}
      <DataTable
        caption="{TOPIC_LABELS[topic] ?? topic}の年齢構成"
        columns={[
          { key: 'age', label: '年齢層' },
          { key: 'out', label: '前後の月', numeric: true },
          { key: 'in', label: '休みの時期', numeric: true },
          { key: 'diff', label: '差', numeric: true },
          ...windowNames.map((w) => ({ key: w, label: `差: ${w}`, numeric: true })),
        ]}
        rows={topicComposition.map((r) => ({
          age: `${r.age}歳`,
          out: pctText(r.outsidePct),
          in: pctText(r.insidePct),
          diff: fmtPt(diffOf(r)),
          ...Object.fromEntries(r.windows.map((w) => [w.window, fmtPt(w.effectPt)])),
        }))}
      />
    {/snippet}
  </ChartFrame>
</section>

<section aria-labelledby="work">
  <h2 id="work" class="section-title">2. 仕事関連メッセージの割合と休暇</h2>
  <p class="muted section-lead">
    日本の仕事関連の割合は全体として下がり続けているため、前月と比べると休暇の影響を大きく見誤ります。ここでは各月を前後の月の平均と比べます。
  </p>

  <ChartFrame
    title="仕事関連メッセージの割合"
    meta="指標: work_related=1 の構成比・分母: 各地域の全メッセージ・月次（{range}）。網かけは8月・GW・年末年始"
    legend={workSeries.map((s) => ({ label: s.label, color: s.color }))}
  >
    <LineChart
      periods={data.months}
      series={workSeries}
      bands={workBands}
      axisLabel={formatMonthShort}
      periodLabel={formatMonth}
      format={pct1}
      ariaLabel="日本と世界の仕事関連メッセージの割合の月次推移。8月・GW・年末年始を網かけで表示"
    />
    {#snippet table()}
      <DataTable
        caption="日本の仕事関連の割合と暦"
        columns={[
          { key: 'm', label: '月' },
          { key: 'jp', label: '日本', numeric: true },
          { key: 'dip', label: '前後月との差', numeric: true },
          { key: 'wd', label: '営業日', numeric: true },
          { key: 'hol', label: '平日の祝日', numeric: true },
          { key: 'custom', label: 'お盆・年末年始の平日', numeric: true },
        ]}
        rows={data.calendar.map((c) => ({
          m: monthLabel(c.month),
          jp: pct1(data.jp[toPeriod(c.month)] ?? null),
          dip: fmtPt(c.dipPt),
          wd: c.workdays,
          hol: c.holidaysOnWeekdays,
          custom: c.obonWeekdays + c.nenmatsuWeekdays,
        }))}
      />
    {/snippet}
  </ChartFrame>

  <ChartFrame
    title="休暇の月に、仕事関連の割合はどれだけ下がったか"
    meta="指標: 対象月 − 前後1か月の平均（ポイント）・分母: 各国・各月の全メッセージ・1点が1か国"
    legend={[
      { label: '日本', color: 'var(--series-jp)', kind: 'rect' },
      { label: 'その他の国', color: 'var(--series-ref)', kind: 'rect' },
    ]}
  >
    <DotStrip
      rows={workRows}
      highlight="JP"
      highlightLabel="日本"
      nameOf={scopeName}
      format={fmtPt}
      ariaLabel="休暇の月の仕事関連メッセージ割合の変化の国別分布"
      describe={(r) => {
        const c = crossOf(r.key);
        return `${r.label}: 日本 ${fmtPt(c?.jpDipPt)}、${c?.countries}か国中 ${c?.jpRank}位（下がった順）、全か国の中央値 ${fmtPt(c?.medianPt)}`;
      }}
    />
    {#snippet notes()}
      <p>横の位置が値で、左ほど大きく下がった国です。縦の積み上がりは、値が近い国の点が重ならないように下から積んだもので、高い所ほどその値の近くに国が多いことを示します。▲は全か国の中央値です。</p>
      <p>
        2025年8月と2026年8月の両方で値がある {data.augustConsistency.countries} か国のうち、{data.augustConsistency.sameSign}
        か国は2回とも同じ向きに動きました。
      </p>
    {/snippet}
    {#snippet table()}
      <DataTable
        caption="地域グループ別の中央値"
        columns={[
          { key: 'm', label: '月' },
          { key: 'jp', label: '日本', numeric: true },
          { key: 'rank', label: '日本の順位', numeric: true },
          ...GROUPS.map((g) => ({ key: g, label: g, numeric: true })),
        ]}
        rows={data.crossCountry.map((c) => ({
          m: monthLabel(c.month),
          jp: fmtPt(c.jpDipPt),
          rank: `${c.jpRank} / ${c.countries}`,
          ...Object.fromEntries(GROUPS.map((g) => [g, fmtPt(c.groups[g]?.medianPt)])),
        }))}
      />
    {/snippet}
  </ChartFrame>

  <div class="prose">
    <h3>営業日数で説明できるか</h3>
    <p>
      日本の暦から作った営業日の割合（前後の月との差）と、日本の仕事関連の割合（同）の相関係数は
      {data.correlation.jp.workdaysCustom.r.toFixed(2)}（お盆・年末年始を含む、{data.correlation.jp.workdaysCustom.n}か月）、祝日だけでは
      {data.correlation.jp.workdays.r.toFixed(2)} でした。
    </p>
    <p>
      ただし、同じ日本の暦を他国の系列に当てると、日本は {data.correlation.placebo.countries} か国中 {data.correlation.placebo.jpRank}
      位にとどまり、フランスやイタリアとも同程度に相関します。相関を生んでいるのは主に北半球に共通する8月の低下で、
      日本の営業日数で日本の動きを説明できているとは言えません。
    </p>
    <p>
      また、これは25か月分の探索的な分析です。相関係数は営業日数と構成比の関係の強さを示すだけで、因果関係を示すものではありません。
    </p>
    <div class="table-scroll">
      <DataTable
        caption="日本の暦を各国の系列に当てたときの相関係数"
        columns={[
          { key: 'c', label: '国' },
          { key: 'r', label: '相関係数', numeric: true },
        ]}
        rows={PLACEBO.map((c) => ({ c: scopeName(c), r: data.correlation.placebo.selected[c]?.toFixed(2) ?? '—' }))}
      />
    </div>
  </div>
</section>

<section class="prose" aria-labelledby="caveats">
  <h2 id="caveats" class="section-title">読み方の注意</h2>
  <ul>
    <li>値はすべてメッセージの構成比です。ある区分の割合が下がっても、その区分のメッセージ数が減ったとは限りません。</li>
    <li>仕事関連・トピックはモデルによる推定分類、年齢は利用者の申告です。実際の職業・就業・在学を表すものではありません。</li>
    <li>Signals の月は UTC 基準、日本の暦は日本時間です。月の境界は最初の9時間ずれます。</li>
    <li>観測は27か月で、季節の繰り返しは夏3回、冬・春2回にとどまります。統計的な検定はしておらず、傾向の記述にとどめます。</li>
    <li>お盆（8月13〜16日）、年末年始（12月29日〜1月3日）、大学の休みの時期、国のグループは本分析の定義です。お盆は国民の祝日ではありません。</li>
  </ul>
</section>

<section class="prose" aria-labelledby="sources">
  <h2 id="sources" class="section-title">出典</h2>
  <ul>
    <li>
      <a href="https://openai.com/signals/data-download/">OpenAI Signals {data.sources.signals.release}</a>（{data.sources.signals.license}、取得日
      {data.sources.signals.retrievedAt}）。国別・月別の仕事関連区分、年齢層の構成比を、本プロジェクトが前後の月との差・国別順位に加工しました。
    </li>
    <li>
      出典: 内閣府ウェブサイト「<a href="https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html">国民の祝日について</a>」、<a
        href={data.sources.holidays.licenseUrl}>PDL1.0</a
      >（{data.sources.holidays.retrievedAt}に利用）。祝日 CSV をもとに、Signals Japan Insight が月別の営業日数を集計して作成しました。
    </li>
    <li>分析の手順と全数値: リポジトリの <code>docs/analysis/holiday-calendar.md</code> と <code>data/analysis/holiday-calendar.json</code>。</li>
  </ul>
</section>

<style>
  .notice {
    max-width: 40rem;
    margin: 0 auto 48px;
    padding: 14px 18px;
    border-radius: 12px;
    background: var(--wash);
    font-size: 0.875rem;
    color: var(--ink-2);
  }

  .notice p:last-child {
    margin-bottom: 0;
  }

  .points li {
    margin-bottom: 10px;
  }

  section {
    margin-bottom: 40px;
  }

  .section-lead {
    max-width: 44rem;
    margin-bottom: 24px;
  }

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex: none;
  }

  .prose h3 {
    margin-top: 8px;
  }

  code {
    font-size: 0.85em;
  }

  @media (max-width: 719px) {
    .wide-only {
      display: none;
    }
  }
</style>
