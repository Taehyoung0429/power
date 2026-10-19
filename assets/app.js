/* Power — 대시보드 동작 (2026-10-11). 데이터는 각 페이지의 <script id="page-data"> JSON. */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const PAL = ["#0071e3", "#ff9f0a", "#34c759", "#bf5af2", "#ff375f", "#64d2ff", "#5e5ce6", "#a2845e", "#8e8e93", "#30b0c7", "#ffcc00"];
  const FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Apple SD Gothic Neo","Pretendard",sans-serif';
  const DATA = (() => { const n = $("#page-data"); return n ? JSON.parse(n.textContent) : {}; })();
  window.PAGE = DATA;

  /* ── 숫자 ── */
  const fmt = (v, d = 0) => v == null || isNaN(v) ? "-" : Number(v).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const auto = v => v == null ? "-" : Math.abs(v) >= 100 ? fmt(v, 0) : Math.abs(v) >= 10 ? fmt(v, 1) : fmt(v, 2);
  const pct = (v, d = 1) => v == null ? "-" : (v > 0 ? "+" : "") + fmt(v, d) + "%";
  window.fmt = fmt;

  /* ── 공통 UI ── */
  function nav() {
    const b = $(".menu-btn");
    if (b) b.addEventListener("click", () => document.body.classList.toggle("menu-open"));
    const prog = $(".progress"), top = $(".toTop");
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      if (prog) prog.style.width = (p * 100).toFixed(2) + "%";
      if (top) top.classList.toggle("on", h.scrollTop > 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    if (top) top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    onScroll();
  }
  /* 메뉴 '커버리지' 드롭다운: 누르면 섹터 목록, 섹터를 누르거나 올리면 그 섹터 기업 목록 */
  function dropdown() {   // 메뉴 드롭다운 (커버리지: 섹터→기업, 지표: 탭 목록)
    const all = $$(".gnav .dd");
    all.forEach(dd => {
      $(".dd-btn", dd).addEventListener("click", e => { e.preventDefault(); const was = dd.classList.contains("open"); all.forEach(x => x.classList.remove("open")); if (!was) dd.classList.add("open"); });
      const pick = i => { $$(".dd-sec", dd).forEach(b => b.classList.toggle("on", b.dataset.i === i)); $$(".dd-list", dd).forEach(l => l.classList.toggle("on", l.dataset.i === i)); };
      $$(".dd-sec", dd).forEach(b => { b.addEventListener("click", () => pick(b.dataset.i)); b.addEventListener("mouseenter", () => pick(b.dataset.i)); });
      $$(".dd-list a", dd).forEach(a => a.addEventListener("click", () => dd.classList.remove("open")));
    });
    document.addEventListener("click", e => { all.forEach(dd => { if (!dd.contains(e.target)) dd.classList.remove("open"); }); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") all.forEach(dd => dd.classList.remove("open")); });
    $$(".mmenu a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  }
  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal,.zoom").forEach(el => io.observe(el));
  }
  function countUp() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suf || "", pre = el.dataset.pre || "";
      const t0 = performance.now(), dur = 1400;
      const step = t => { const k = Math.min(1, (t - t0) / dur), e2 = 1 - Math.pow(1 - k, 4); el.textContent = pre + fmt(to * e2, dec) + suf; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: 0.4 });
    $$("[data-count]").forEach(el => io.observe(el));
  }
  /* 세그먼트 컨트롤: <div class="seg" data-seg="name"><button data-v="..">..</button>…</div> */
  function seg(root, onChange) {
    if (!root) return;
    let thumb = $(".thumb", root);
    if (!thumb) { thumb = document.createElement("span"); thumb.className = "thumb"; root.prepend(thumb); }
    const btns = $$("button", root);
    const place = b => { thumb.style.left = b.offsetLeft + "px"; thumb.style.width = b.offsetWidth + "px"; };
    root._place = () => { const on = btns.find(x => x.classList.contains("on")); if (on) { place(on); show(on); } };
    const pick = (b, fire = true) => { btns.forEach(x => x.classList.toggle("on", x === b)); place(b); show(b); if (fire && onChange) onChange(b.dataset.v, b); };
    // 휴대폰 밑줄 탭: 고른 탭이 가려져 있으면 보이게 옆으로 밀어 줌
    const show = b => { if (root.scrollWidth > root.clientWidth) root.scrollTo({ left: Math.max(0, b.offsetLeft - 16), behavior: "smooth" }); };
    btns.forEach(b => b.addEventListener("click", () => pick(b)));
    requestAnimationFrame(() => pick(btns.find(b => b.classList.contains("on")) || btns[0], false));   // 그 사이 다른 코드가 고른 칸을 존중
    window.addEventListener("resize", () => { const on = btns.find(b => b.classList.contains("on")); if (on) place(on); });
    return { set: v => { const b = btns.find(x => x.dataset.v === v); if (b) pick(b); } };
  }
  window.seg = seg;
  // 산업 지표 메뉴: PC 화면에서 한 줄에 안 들어가면 두 줄로 (2026-10-19, 휴대폰은 밑줄 탭 그대로)
  const fitTabs = () => { const t = document.getElementById("indTabs"); if (!t) return; t.classList.remove("wrap");
    if (innerWidth > 640 && t.scrollWidth > t.clientWidth + 1) t.classList.add("wrap"); };
  fitTabs(); window.addEventListener("resize", fitTabs); document.fonts && document.fonts.ready.then(fitTabs);
  function tabs(root, panelsRoot, onChange, useHash) {
    const btns = $$("button", root);
    const show = (v, fire = true) => {
      btns.forEach(b => b.classList.toggle("on", b.dataset.v === v));
      $$(".panel", panelsRoot).forEach(p => p.classList.toggle("on", p.dataset.v === v));
      if (useHash) history.replaceState(null, "", "#" + v);
      if (root._place) root._place();
      if (fire && onChange) onChange(v);
      setTimeout(() => window.dispatchEvent(new Event("resize")), 30);
    };
    btns.forEach(b => b.addEventListener("click", () => show(b.dataset.v)));
    const h = useHash && location.hash.slice(1);
    show(btns.some(b => b.dataset.v === h) ? h : (btns.find(b => b.classList.contains("on")) || btns[0]).dataset.v);
    return show;
  }
  function rails() {
    $$(".rail").forEach(r => {
      const tr = $(".track", r), [prev, next] = $$(".ctrl button", r);
      if (!tr || !prev) return;
      const upd = () => { prev.disabled = tr.scrollLeft < 8; next.disabled = tr.scrollLeft + tr.clientWidth > tr.scrollWidth - 8; };
      prev.addEventListener("click", () => tr.scrollBy({ left: -tr.clientWidth * 0.8 }));
      next.addEventListener("click", () => tr.scrollBy({ left: tr.clientWidth * 0.8 }));
      tr.addEventListener("scroll", upd, { passive: true }); upd();
    });
  }
  function lightbox() {
    let lb = $(".lb");
    if (!lb) { lb = document.createElement("div"); lb.className = "lb"; lb.innerHTML = "<img alt=''>"; document.body.appendChild(lb); }
    $$("[data-zoom]").forEach(f => f.addEventListener("click", () => { $("img", lb).src = f.dataset.zoom; lb.classList.add("on"); }));
    lb.addEventListener("click", () => lb.classList.remove("on"));
    document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("on"); });
  }
  function sortable(tbl) {
    const ths = $$("th", tbl);
    ths.forEach((th, i) => {
      if (!th.classList.contains("sort")) return;
      th.addEventListener("click", () => {
        const asc = !th.classList.contains("asc");
        ths.forEach(x => x.classList.remove("asc", "desc")); th.classList.add(asc ? "asc" : "desc");
        const rows = $$("tbody tr", tbl);
        const val = r => { const c = r.children[i]; const v = c.dataset.v ?? c.textContent; const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? String(v) : n; };
        rows.sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (asc ? 1 : -1); });
        rows.forEach(r => r.parentNode.appendChild(r));
      });
    });
  }

  /* ── 차트 공통 ── */
  const charts = [];
  function lazy(el, build) {
    if (!el) return;
    const go = () => { if (el._chart) return; const c = echarts.init(el, null, { renderer: "svg" }); el._chart = c; charts.push(c);
      const orig = c.setOption.bind(c);
      // y축 제목은 위치를 맞추기 전까지 숨김 → 처음부터 숫자 열 위에 나타남 (움직이며 재정렬되는 모습 없앰, 2026-10-12)
      const hideNames = o => { const ys = o.yAxis == null ? [] : Array.isArray(o.yAxis) ? o.yAxis : [o.yAxis];
        ys.forEach(ax => { if (ax && ax.name) ax.nameTextStyle = Object.assign({}, ax.nameTextStyle, { opacity: 0 }); }); return o; };
      c.setOption = (o, ...a) => { if (o && o.series) c._alignPending = true; return orig(o && o.series ? hideNames(alignZero(mobileLegend(o, el))) : o, ...a); };   // 좁은 화면: 범례를 아래로, 줄바꿈
      if ("ResizeObserver" in window) new ResizeObserver(() => c.resize()).observe(el);  // 패널 폭이 바뀌면 다시 맞춤
      // Y축 제목 맞추기는 새 그림을 그린 직후 한 번만 (매 프레임 다시 맞추면 그리기가 끝나지 않고 계속 다시 그려져 느려짐, 2026-10-14 수정)
      // 그리기 도중(rendered 안)에 setOption 을 부를 수 없어 바로 다음 순간(setTimeout 0)에 맞춤
      c.on("rendered", () => { if (!c._alignPending || c._alignQueued) return; c._alignQueued = true;
        setTimeout(() => { c._alignQueued = false; try { alignAxisNames(c); c._alignPending = false; } catch (e) { /* 다음 그리기 때 다시 */ } }, 0); });
      build(c); };
    if (!("IntersectionObserver" in window)) return go();
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); go(); } }), { rootMargin: "120px" });
    io.observe(el);
    el._rebuild = () => { if (el._chart) build(el._chart); else go(); };
  }
  window.addEventListener("resize", () => charts.forEach(c => c.resize()));
  /* 축이 두 개인 그래프: 양쪽 y축의 0 위치를 같은 높이로 맞춤 (눈금 수·간격도 맞춤) */
  function niceStep(span, n) {
    const raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function alignZero(o) {
    if (o.noAlign) { delete o.noAlign; return o; }   // 축 범위를 직접 정한 차트는 그대로
    if (!Array.isArray(o.yAxis) || o.yAxis.length < 2 || o.yAxis[1].show === false) return o;
    const ext = [[0, 0], [0, 0]];
    const stacks = {};
    o.series.forEach(s => {
      const ai = s.yAxisIndex || 0;
      (s.data || []).forEach((d, i) => {
        let v = d && typeof d === "object" ? (Array.isArray(d) ? d[1] : d.value) : d;
        if (v == null || isNaN(v)) return;
        if (s.stack) { const k = ai + "|" + s.stack + "|" + i + "|" + (v >= 0 ? "p" : "n"); v = (stacks[k] = (stacks[k] || 0) + v); }
        ext[ai][0] = Math.min(ext[ai][0], v); ext[ai][1] = Math.max(ext[ai][1], v);
      });
    });
    if (ext[1][0] === 0 && ext[1][1] === 0) return o;
    const st = ext.map(([lo, hi]) => niceStep((hi - lo) || 1, 5));
    const N = Math.max(...ext.map(([lo], k) => Math.ceil(-lo / st[k] - 1e-9)));
    const Pp = Math.max(...ext.map(([, hi], k) => Math.ceil(hi / st[k] - 1e-9)));
    const P = Math.max(1, Pp);
    o.yAxis = o.yAxis.map((ax, k) => k > 1 ? ax : Object.assign({}, ax, { min: -N * st[k], max: P * st[k], interval: st[k], scale: false }));
    return o;
  }
  /* 휴대폰 폭: 범례를 넘기는 방식(1/3 ▶) 대신 차트 아래에 모두 펼쳐 보여줌 */
  function mobileLegend(o, el) {
    const w = el.clientWidth;
    if (!o.legend || w >= 600 || o.legend.show === false) return o;
    const names = (o.legend.data || o.series.map(s => s.name)).filter((n, i, a) => n && a.indexOf(n) === i && !/합계$/.test(n));
    let rows = 1, x = 0;
    const tw = s => [...String(s)].reduce((t, ch) => t + (/[가-힣]/.test(ch) ? 12.5 : /\s/.test(ch) ? 3.5 : 7.2), 0);   // 글자 폭 추정 (한글/영문 구분)
    names.forEach(n => { const iw = 24 + tw(n); if (x + iw > w) { rows++; x = 0; } x += iw; });
    const lh = 22;
    const zoom = Array.isArray(o.dataZoom) ? o.dataZoom.some(z => z.type === "slider") : false;
    o.legend = Object.assign({}, o.legend, { type: "plain", top: undefined, bottom: zoom ? 34 : 0, left: 0, right: 0, itemGap: 12, data: names });
    const g = Object.assign({ left: 8, right: 8, top: 66, bottom: 8, containLabel: true }, o.grid || {});
    o.grid = Object.assign(g, { top: 30, bottom: (zoom ? 40 : 8) + rows * lh + 10 });
    if (Array.isArray(o.dataZoom)) o.dataZoom = o.dataZoom.map(z => z.type === "slider" ? Object.assign({}, z, { bottom: 4 }) : z);
    return o;
  }
  /* y축 제목을 그 축 숫자 열의 가운데에 맞춤 (모든 그래프 공통) */
  const _cv = document.createElement("canvas").getContext("2d");
  function alignAxisNames(c) {
    const opt = c.getOption();
    if (!opt.yAxis) return;
    const upd = [], need = [0, 0];
    let changed = false;
    opt.yAxis.forEach((ax, i) => {
      const m = c.getModel().getComponent("yAxis", i);
      if (!m || !ax.name || ax.show === false) { upd.push({}); return; }
      const lab = m.axis.getViewLabels().map(l => l.formattedLabel || "");
      const fs = (ax.axisLabel && ax.axisLabel.fontSize) || 11;
      _cv.font = `${fs}px ${FONT}`;
      const w = Math.max(0, ...lab.map(t => _cv.measureText(String(t)).width));
      const margin = (ax.axisLabel && ax.axisLabel.margin != null) ? ax.axisLabel.margin : 8;
      const shift = Math.round(2 * (margin + w / 2));
      const right = (m.axis && m.axis.position === "right") || m.get("position") === "right";
      const pad = right ? [0, 0, 0, shift] : [0, shift, 0, 0];
      const cur = (ax.nameTextStyle || {}).padding;
      if (!cur || cur[1] !== pad[1] || cur[3] !== pad[3] || (ax.nameTextStyle || {}).align !== "center" || (ax.nameTextStyle || {}).opacity === 0) changed = true;
      upd.push({ nameTextStyle: Object.assign({}, ax.nameTextStyle, { align: "center", padding: pad, opacity: 1 }) });
      // 제목이 숫자 열보다 넓어 가장자리에서 잘리면 그만큼 여백을 늘림
      _cv.font = `${(ax.nameTextStyle && ax.nameTextStyle.fontSize) || 11}px ${FONT}`;
      const nw = _cv.measureText(String(ax.name)).width;
      const over = Math.ceil(nw / 2 - (margin + w / 2)) + 2;
      if (over > 0) need[right ? 1 : 0] = Math.max(need[right ? 1 : 0], over);
    });
    const g = (opt.grid || [{}])[0] || {};
    const gl = 8 + need[0], gr = 8 + need[1];
    if ((need[0] || need[1]) && (g.left !== gl || g.right !== gr)) { changed = true; }
    if (changed) c.setOption({ yAxis: upd, grid: [{ left: need[0] ? gl : g.left, right: need[1] ? gr : g.right }] });
  }
  window.alignAxisNames = alignAxisNames;
  const base = (extra = {}) => Object.assign({
    animationDuration: 1100, animationEasing: "cubicOut", animationDurationUpdate: 700,
    textStyle: { fontFamily: FONT, color: "#1d1d1f" }, color: PAL,
    grid: { left: 8, right: 8, top: 66, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,.94)", borderWidth: 0, padding: [10, 14],
      textStyle: { color: "#1d1d1f", fontSize: 12, fontFamily: FONT },
      extraCssText: "border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.14);backdrop-filter:blur(12px);",
      axisPointer: { type: "line", lineStyle: { color: "#c7c7cc" }, shadowStyle: { color: "rgba(0,0,0,.035)" } } },
    legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 10, itemHeight: 10, itemGap: 16, textStyle: { color: "#424245", fontSize: 12 } },
  }, extra);
  const xCat = (data, extra = {}) => Object.assign({ type: "category", data, axisLine: { lineStyle: { color: "#d2d2d7" } }, axisTick: { show: false },
    axisLabel: { color: "#86868b", fontSize: 11, hideOverlap: true } }, extra);
  const yVal = (extra = {}) => Object.assign({ type: "value", splitLine: { lineStyle: { color: "#f0f0f2" } }, axisLabel: { color: "#86868b", fontSize: 11 },
    nameTextStyle: { color: "#86868b", fontSize: 11, align: "left" } }, extra);
  const fcStyle = (v, fc, color) => ({ value: v, itemStyle: fc ? { color: color, opacity: 0.45, decal: null, borderColor: color, borderWidth: 1, borderType: "dashed" } : { color } });
  function markFc(labels, fc) {
    const i = fc.indexOf(true);
    if (i < 0) return undefined;
    return { silent: true, itemStyle: { color: "rgba(0,113,227,.04)" }, label: { show: true, position: "insideTop", color: "#86868b", fontSize: 11, formatter: "추정" },
      data: [[{ xAxis: labels[i] }, { xAxis: labels[labels.length - 1] }]] };
  }
  window.CH = { lazy, base, xCat, yVal };

  /* 매출액(부문 누적) + YoY / 영업이익 + OPM / EBITDA(부문 누적) */
  function finOption(fin, mode, kind, unit) {
    const d = fin[mode];
    if (!d || !d.labels.length) return null;
    const L = d.labels, fc = d.fc;
    let series = [], legendOff = false;
    const opStack = kind === "op" && fin.op_stack;   // 영업이익도 부문 누적 (기업별 지정, 2026-10-13)
    const segs = kind === "ebitda" ? d.ebseg : opStack ? d.opseg : d.seg;
    const total = kind === "ebitda" ? d.ebitda : kind === "op" ? d.op : d.sales;
    const useSeg = (kind !== "op" || opStack) && segs && segs.length >= 2 && segs.every(s => s.vals.some(v => v != null));
    if (useSeg) {
      segs.forEach((s, k) => series.push({ name: s.name, type: "bar", stack: "s", barMaxWidth: 34, emphasis: { focus: "series" },
        data: s.vals.map((v, i) => fcStyle(v, fc[i], PAL[k % PAL.length])),
        itemStyle: { borderRadius: 0 } }));
      // 합계 표시용 (막대 위 숫자)
      series.push({ name: kind === "ebitda" ? "조정 EBITDA 합계" : kind === "op" ? "영업이익 합계" : "매출액 합계", type: "line", data: total, symbol: "none", lineStyle: { opacity: 0 }, itemStyle: { opacity: 0 }, tooltip: { show: true },
        label: { show: mode === "y" || L.length <= 12, position: "top", color: "#1d1d1f", fontSize: 10, formatter: p => auto(p.value) }, z: 5, legendHoverLink: false });
    } else {
      const col = kind === "op" ? "#0071e3" : "#5e5ce6";
      series.push({ name: kind === "op" ? "영업이익" : "매출액", type: "bar", barMaxWidth: 34, data: (total || []).map((v, i) => fcStyle(v, fc[i], col)),
        itemStyle: { borderRadius: [6, 6, 0, 0] }, label: { show: mode === "y" || L.length <= 12, position: "top", fontSize: 10, color: "#1d1d1f", formatter: p => auto(p.value) } });
    }
    if (kind === "ebitda" && total) {   // 보고서 그림처럼: 부문 누적 막대 + 합계 꺾은선 (같은 축)
      series = series.filter(s => !/합계$/.test(s.name));
      series.push({ name: "조정 EBITDA", type: "line", data: total, smooth: 0.25, symbolSize: 7, z: 10, lineStyle: { width: 2.5, color: "#ff9f0a" },
        itemStyle: { color: "#fff", borderColor: "#ff9f0a", borderWidth: 2 }, label: { show: true, position: "top", fontSize: 10, color: "#c25e00", formatter: p => auto(p.value) } });
    }
    const rate = kind === "op" ? d.opm : kind === "ebitda" ? null : d.sales_yoy;
    const rname = kind === "op" ? "영업이익률(R)" : kind === "ebitda" ? "EBITDA 마진(R)" : "매출액 성장률(R)";
    if (rate && rate.some(v => v != null)) {
      series.push({ name: rname, type: "line", yAxisIndex: 1, data: rate, smooth: 0.25, symbol: "circle", symbolSize: 7, connectNulls: true,
        lineStyle: { width: 2.5, color: "#ff9f0a" }, itemStyle: { color: "#fff", borderColor: "#ff9f0a", borderWidth: 2 }, z: 10,
        label: { show: mode === "y", position: "top", color: "#c25e00", fontSize: 10, formatter: p => fmt(p.value, 1) } });
    }
    if (series[0]) series[0].markArea = markFc(L, fc);
    return base({
      legend: Object.assign(base().legend, { show: !legendOff, data: series.filter(s => !/합계$/.test(s.name)).map(s => s.name) }),
      tooltip: Object.assign(base().tooltip, { valueFormatter: v => v == null ? "-" : auto(v) }),
      xAxis: xCat(L), yAxis: [yVal({ name: "(" + String(unit || "").split(",")[0].trim() + ")" }), yVal({ name: rate ? "(%)" : "", show: !!rate, splitLine: { show: false }, axisLabel: { color: "#c25e00", fontSize: 11 } })],
      series,
    });
  }
  window.finOption = finOption;

  function tpOption(prices, tps, ccy, range) {
    let P = prices;
    if (range && range !== "all") {
      const days = { "6m": 182, "1y": 365, "3m": 92 }[range];
      const cut = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
      P = prices.filter(p => p[0] >= cut);
    }
    const first = P.length ? P[0][0] : "";
    // 목표주가 계단: 보고서 날짜부터 다음 보고서까지
    const tpLine = [];
    const sorted = tps.filter(t => t.tp).sort((a, b) => a.date < b.date ? -1 : 1);
    let cur = null;
    sorted.forEach(t => { if (t.date < first) cur = t; });
    if (cur) tpLine.push([first, cur.tp]);
    sorted.filter(t => t.date >= first).forEach(t => tpLine.push([t.date, t.tp]));
    if (tpLine.length && P.length) tpLine.push([P[P.length - 1][0], tpLine[tpLine.length - 1][1]]);
    const marks = sorted.filter(t => t.date >= first).map(t => ({ value: [t.date, t.tp], r: t }));
    return base({
      tooltip: Object.assign(base().tooltip, { valueFormatter: v => v == null ? "-" : fmt(v, ccy === "USD" ? 2 : 0) }),
      xAxis: { type: "time", axisLine: { lineStyle: { color: "#d2d2d7" } }, axisLabel: { color: "#86868b", fontSize: 11, hideOverlap: true }, splitLine: { show: false } },
      yAxis: yVal({ scale: true, name: ccy === "USD" ? "(USD)" : "(원)" }),
      series: [
        { name: "주가", type: "line", data: P, showSymbol: false, lineStyle: { width: 2, color: "#1d1d1f" }, itemStyle: { color: "#1d1d1f" },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(29,29,31,.14)" }, { offset: 1, color: "rgba(29,29,31,0)" }]) } },
        { name: "목표주가", type: "line", step: "end", data: tpLine, showSymbol: false, lineStyle: { width: 2.5, color: "#ff375f" }, itemStyle: { color: "#ff375f" } },
        { name: "보고서", type: "scatter", data: marks, symbolSize: 11, itemStyle: { color: "#fff", borderColor: "#ff375f", borderWidth: 2.5 }, z: 10,
          cursor: "pointer",
          tooltip: { trigger: "item", enterable: true, formatter: p => `<b>${p.data.r.date}</b><br>${p.data.r.rating || ""} · 목표주가 ${fmt(p.data.r.tp, ccy === "USD" ? 1 : 0)}<br><span style="color:#6e6e73">${p.data.r.subtitle || ""}</span>` +
            (p.data.r.url ? `<br><a href="${p.data.r.url}" target="_blank" rel="noopener" style="color:#0066cc;pointer-events:auto">보고서 보기 ↗</a>` : "") } },
      ],
    });
  }
  window.tpOption = tpOption;

  /* 추정치 변화: x = 매출액·영업이익·지배순이익·EPS(우축), 보고서 날짜마다 막대 */
  function revOption(revs, year, unit, epsUnit) {
    const rs = revs.filter(r => r.years[year] && Object.values(r.years[year]).some(v => v != null));
    const hasEps = rs.some(r => r.years[year].eps != null);
    const cats = hasEps ? ["매출액", "영업이익", "지배순이익", "EPS (우축)"] : ["매출액", "영업이익", "지배순이익"];
    const series = [];
    const n = rs.length;
    rs.forEach((r, k) => {
      const y = r.years[year];
      const col = n === 1 ? "#0071e3" : echarts.color.lerp(k / Math.max(1, n - 1), ["#c7d9f5", "#0071e3"]);
      const prev = k > 0 ? rs[k - 1].years[year] : null;
      const lab = (v, key) => v == null ? "" : auto(v);
      series.push({ name: r.date, type: "bar", stack: "r" + k, barMaxWidth: 26, barGap: "18%", itemStyle: { color: col, borderRadius: [5, 5, 0, 0] },
        data: hasEps ? [y.sales, y.op, y.ni, null] : [y.sales, y.op, y.ni], label: { show: n <= 4, position: "top", fontSize: 9, color: "#6e6e73", formatter: p => lab(p.value) } });
      if (hasEps) series.push({ name: r.date, type: "bar", stack: "r" + k, yAxisIndex: 1, barMaxWidth: 26, itemStyle: { color: col, borderRadius: [5, 5, 0, 0] },
        data: [null, null, null, y.eps], label: { show: n <= 4, position: "top", fontSize: 9, color: "#6e6e73", formatter: p => lab(p.value) } });
    });
    return base({
      legend: Object.assign(base().legend, { data: rs.map(r => r.date), type: "scroll", right: 0 }),
      grid: { left: 8, right: 8, top: 66, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: "rgba(0,0,0,.035)" } }, backgroundColor: "rgba(255,255,255,.95)", borderWidth: 0,
        extraCssText: "border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.14);", textStyle: { fontSize: 12, color: "#1d1d1f" },
        formatter: ps => {
          const c = ps[0].axisValue; let h = `<b>${c} · ${year}</b>`; let prev = null;
          ps.filter(p => p.value != null).forEach(p => {
            const ch = prev ? ` <span style="color:${p.value >= prev ? "#e8384f" : "#2f6fde"}">${pct((p.value / prev - 1) * 100)}</span>` : "";
            h += `<br>${p.marker}${p.seriesName}  <b>${auto(p.value)}</b>${ch}`; prev = p.value;
          });
          return h;
        } },
      xAxis: xCat(cats, { axisLabel: { color: "#1d1d1f", fontSize: 13, fontWeight: 600, interval: 0, hideOverlap: false },
 }),
      yAxis: [yVal({ name: unit ? "(" + unit.replace(/[()]/g, "") + ")" : "" }), yVal({ name: hasEps ? "(" + (epsUnit || "원") + ")" : "", show: hasEps, splitLine: { show: false }, nameTextStyle: { color: "#86868b", fontSize: 11, align: "right" } })],
      series,
    });
  }
  window.revOption = revOption;

  function flowOption(f, range) {
    let n = range === "all" ? f.dates.length : ({ "1m": 21, "3m": 63, "6m": 126, "1y": 240, "3y": 740 }[range] || 63);
    const s = Math.max(0, f.dates.length - n);
    const D = f.dates.slice(s), fo = f.foreign.slice(s), og = f.organ.slice(s), iv = (f.individual || []).slice(s);
    const cum = a => { let t = 0; return a.map(v => +(t += v || 0).toFixed(1)); };
    return base({
      tooltip: Object.assign(base().tooltip, { valueFormatter: v => v == null ? "-" : fmt(v, 1) + "억" }),
      xAxis: xCat(D),
      yAxis: [yVal({ name: "(억원)" }), yVal({ name: "(누적)", splitLine: { show: false } })],
      series: [
        { name: "외국인", type: "bar", data: fo, itemStyle: { color: "#0071e3", borderRadius: 2 }, barMaxWidth: 8 },
        { name: "기관", type: "bar", data: og, itemStyle: { color: "#ff9f0a", borderRadius: 2 }, barMaxWidth: 8 },
        { name: "개인", type: "bar", data: iv, itemStyle: { color: "#34c759", borderRadius: 2 }, barMaxWidth: 8 },
        { name: "외국인 누적", type: "line", yAxisIndex: 1, data: cum(fo), showSymbol: false, lineStyle: { width: 2.5, color: "#0040a0" }, itemStyle: { color: "#0040a0" } },
        { name: "기관 누적", type: "line", yAxisIndex: 1, data: cum(og), showSymbol: false, lineStyle: { width: 2.5, color: "#c25e00" }, itemStyle: { color: "#c25e00" } },
        { name: "개인 누적", type: "line", yAxisIndex: 1, data: cum(iv), showSymbol: false, lineStyle: { width: 2.5, color: "#1e7a34" }, itemStyle: { color: "#1e7a34" } },
      ],
    });
  }
  window.flowOption = flowOption;

  function lineOption(dates, series, o = {}) {
    return base({
      tooltip: Object.assign(base().tooltip, { valueFormatter: v => v == null ? "-" : (o.dec != null ? fmt(v, o.dec) : auto(v)) + (o.suf || "") }),
      legend: Object.assign(base().legend, { type: "scroll", right: 0 }),
      grid: { left: 8, right: o.endLabel ? 46 : 8, top: 66, bottom: 8, containLabel: true },
      dataZoom: undefined,   // 범위 조절 막대 없음 (사용자 요청 2026-10-11)
      xAxis: xCat(dates, { boundaryGap: false }),
      yAxis: yVal({ scale: true, name: o.unit || "" }),
      series: series.map((s, k) => ({ name: s.name, type: "line", data: s.vals, showSymbol: false, connectNulls: true, smooth: 0.15,
        lineStyle: { width: s.bold ? 3 : 2, type: s.dash ? "dashed" : "solid", color: s.color || PAL[k % PAL.length] }, itemStyle: { color: s.color || PAL[k % PAL.length] },
        emphasis: { focus: "series" }, labelLayout: o.endLabel ? { moveOverlap: "shiftY" } : undefined, endLabel: o.endLabel ? { show: true, formatter: p => o.dec != null ? fmt(p.value, o.dec) : auto(p.value), color: s.color || PAL[k % PAL.length], fontSize: 11 } : undefined,
        markLine: s.base ? { silent: true, symbol: "none", data: [{ yAxis: s.base }], lineStyle: { color: "#c7c7cc", type: "dashed" }, label: { show: false } } : undefined })),
    });
  }
  window.lineOption = lineOption;

  function spark(el, vals, color) {
    if (!el || !vals || !vals.length) return;
    lazy(el, c => c.setOption({ animationDuration: 1400, grid: { left: 0, right: 0, top: 4, bottom: 4 }, xAxis: { type: "category", show: false, boundaryGap: false, data: vals.map((_, i) => i) },
      yAxis: { type: "value", show: false, scale: true }, tooltip: { show: false },
      series: [{ type: "line", data: vals, showSymbol: false, smooth: 0.3, lineStyle: { width: 2, color }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: color + "33" }, { offset: 1, color: color + "00" }]) } }] }));
  }
  window.spark = spark;

  /* 데이터 표 + CSV */
  function dataTable(box, head, rows, name) {
    if (!box) return;
    const h = `<div class="chart-head" style="margin-top:6px"><span class="small">${rows.length}행</span><button class="pill ghost" data-csv>CSV 내려받기</button></div>
      <div class="tbl-wrap" style="max-height:420px"><table class="t"><thead><tr>${head.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td>${i === 0 ? v : (typeof v === "number" ? auto(v) : (v ?? "-"))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    box.innerHTML = h;
    $("[data-csv]", box).addEventListener("click", () => {
      const csv = "﻿" + [head, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = (name || "data") + ".csv"; a.click();
    });
  }
  window.dataTable = dataTable;
  function toggleData(btn, box, fill) {
    if (!btn) return;
    btn.addEventListener("click", () => {
      const on = box.hasAttribute("hidden");
      if (on) { fill(); box.removeAttribute("hidden"); btn.textContent = "차트만 보기"; } else { box.setAttribute("hidden", ""); btn.textContent = "데이터 보기"; }
    });
  }
  window.toggleData = toggleData;

  /* ── 페이지별 ── */
  const P = {};
  P.home = d => {
    $$(".tile").forEach(t => { const c = d.companies.find(x => x.code === t.dataset.code); if (c) spark($(".spark", t), c.spark, c.upside >= 0 ? "#0071e3" : "#ff375f"); });
    const m = d.market || [];
    $$(".mk").forEach(el => { const s = m.find(x => x.name === el.dataset.n); if (s) spark($(".spark", el), s.vals.slice(-120), "#0071e3"); });
    const rc = $("#homeRel");
    // 커버리지 상대주가: 고른 기간의 첫날 = 100 으로 다시 계산 (지수는 회색 점선)
    if (rc && d.covrel) {
      let rg = "3m";
      const draw = c => {
        const days = { "1m": 31, "3m": 92, "6m": 183, "1y": 366 }[rg];
        const cut = rg === "3m" && d.covrel.base3m ? d.covrel.base3m : new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);   // 3개월 = 산업 지표와 같은 기준일
        // 장중 주가(live.json)가 있으면 오늘 값을 마지막 점으로 붙임 (같은 날짜면 바꿔 씀)
        let D = d.covrel.dates, SER = d.covrel.series; const L = window.__live;
        if (L && L.at) { const day = L.at.slice(0, 10), last = D[D.length - 1];
          if (day >= last) { const add = day > last;
            SER = SER.map(x => { const q = L.q[x.key]; const lv = q && q.p ? q.p : null;
              return Object.assign({}, x, { vals: add ? x.vals.concat([lv != null ? lv : x.vals[x.vals.length - 1]]) : (lv != null ? x.vals.slice(0, -1).concat([lv]) : x.vals) }); });
            if (add) D = D.concat([day]); } }
        let s = D.findIndex(x => x >= cut); if (s < 0) s = 0;
        const COV = ["#0071e3", "#ff9f0a", "#34c759", "#bf5af2", "#ff375f", "#64d2ff", "#5e5ce6", "#a2845e", "#ffcc00", "#30b0c7", "#e5484d"];
        let k = 0;
        const ser = SER.map(x => { const v = x.vals.slice(s); const b = v.find(y => y != null);
          return { name: x.name, vals: v.map(y => y == null || !b ? null : +(y / b * 100).toFixed(1)), dash: x.index,
                   color: x.index ? (x.name === "KOSPI" ? "#6e6e73" : "#aeaeb2") : COV[k++ % COV.length], base: 100 }; });
        const o = lineOption(D.slice(s), ser, { unit: `(${D[s].slice(2).replace(/-/g, ".")}=100)`, endLabel: true });
        o.legend = Object.assign(o.legend, { type: "plain", right: 0 });   // 13개 범례를 넘기지 않고 두 줄로 모두
        o.grid.top = 90;
        c.setOption(o, true);
      };
      lazy(rc, c => draw(c));
      seg($("#homeRelSeg"), v => { rg = v; rc._chart && draw(rc._chart); });
      document.addEventListener("live", () => { rc._chart && draw(rc._chart); });
    }
  };
  P.coverage = d => {
    const grid = $("#covGrid");
    const sg = seg($("#covSeg"), v => {
      $$(".tile", grid).forEach((t, i) => {
        const show = v === "all" || t.dataset.sector === v;
        if (show) { t.style.display = ""; t.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 450, delay: i * 30, easing: "cubic-bezier(.28,.11,.32,1)", fill: "both" }); }
        else t.style.display = "none";
      });
      $$("#covTable tbody tr").forEach(r => r.style.display = v === "all" || r.dataset.sector === v ? "" : "none");
    });
    $$(".tile", grid).forEach(t => { const c = d.companies.find(x => x.code === t.dataset.code); if (c) spark($(".spark", t), c.spark, "#0071e3"); });
    $$("table.sortable").forEach(sortable);
    const h = location.hash.slice(1); if (sg) setTimeout(() => sg.set(h || $("#covSeg button").dataset.v), 50);   // '전체' 없음: 처음엔 첫 섹터
    window.addEventListener("hashchange", () => { const h2 = location.hash.slice(1); if (h2 && sg) sg.set(h2); });
  };
  P.company = d => {
    // 로컬 내비: 지금 보는 구역 표시
    const links = $$(".lnav nav a");
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
    $$("section[id]").forEach(s => io.observe(s));
    const fin = d.fin;
    if (fin) {
      let mode = fin.q && fin.q.labels.length ? "q" : "y";
      const draw = () => {
        [["#chSales", d.kindA || "sales"], ["#chOp", d.kindB || "op"]].forEach(([id, kind]) => {
          const el = $(id); if (!el) return;
          lazy(el, c => { const o = finOption(fin, mode, kind, fin.unit); if (o) c.setOption(o, true); });
          if (el._chart) { const o = finOption(fin, mode, kind, fin.unit); if (o) el._chart.setOption(o, true); }
        });
      };
      const sg = $("#finSeg"); if (sg) $$("button", sg).forEach(b => b.classList.toggle("on", b.dataset.v === mode));
      seg(sg, v => { mode = v; draw(); });
      draw();
      // 12MF PER·PBR 밴드 (valband.py): 회색 배수선 + 주황 주가
      const bd = d.band;
      // 두 밴드 차트 Y축 최대값을 같게 (사용자 지정 2026-10-13): 두 그림의 선·주가 중 최대값을 보기 좋게 올림
      const bandMax = (() => { if (!bd) return null; const k1 = Math.max(...bd.price.filter(v => v)) >= 100000 ? 1000 : 1;
        let m = Math.max(...bd.price.filter(v => v)); ["per", "pbr"].forEach(k => bd[k] && bd[k].lines.forEach(l => l.forEach(v => { if (v != null && v > m) m = v; })));
        m = m / k1; const p = Math.pow(10, Math.floor(Math.log10(m))); const st = [1, 2, 2.5, 5, 10].map(x => x * p / 2).find(s => Math.ceil(m / s) * s >= m && Math.ceil(m / s) <= 8) || p;
        return Math.ceil(m / st) * st; })();
      [["#chPerBand", "per"], ["#chPbrBand", "pbr"]].forEach(([id, key]) => { const el = $(id), b = bd && bd[key]; if (!el || !b) return;
        lazy(el, c => { const k1 = Math.max(...bd.price.filter(v => v)) >= 100000 ? 1000 : 1, sc = v => v == null ? null : +(v / k1).toFixed(k1 > 1 ? 1 : 0);
          const greys = ["#d1d1d6", "#aeaeb2", "#8e8e93", "#636366", "#3a3a3c"];
          c.setOption(base({ legend: Object.assign(base().legend, { data: b.mults.map(m => fmt(m, m % 1 ? 1 : 0) + "X") }),
            tooltip: Object.assign(base().tooltip, { valueFormatter: v => v == null ? "-" : fmt(v, k1 > 1 ? 1 : 0) }),
            xAxis: xCat(bd.dates, { boundaryGap: false, axisLabel: { formatter: v => v.slice(2, 7).replace("-", "."), interval: "auto" } }),
            yAxis: yVal({ name: k1 > 1 ? "(천원)" : "(원)", max: bandMax }), grid: Object.assign(base().grid, { right: 22 }),
            series: [...b.mults.map((m, i) => ({ name: fmt(m, m % 1 ? 1 : 0) + "X", type: "line", data: b.lines[i].map(sc), symbol: "none", lineStyle: { width: 1.5, color: greys[i] }, itemStyle: { color: greys[i] } })),
              { name: "주가", type: "line", data: bd.price.map(sc), symbol: "none", connectNulls: true, lineStyle: { width: 2.2, color: "#ff9f0a" }, itemStyle: { color: "#ff9f0a" }, z: 10,
                markPoint: (() => { let i = bd.price.length - 1; while (i >= 0 && bd.price[i] == null) i--; if (i < 0) return undefined;   // 가장 최근 주가: 표식 + 지금 배수 (소수 1자리)
                  return { silent: true, data: [{ coord: [i, sc(bd.price[i])], value: b.now, symbol: "circle", symbolSize: 9, itemStyle: { color: "#fff", borderColor: "#ff9f0a", borderWidth: 2.5 },
                    label: { show: true, position: "bottom", distance: 6, color: "#c25e00", fontSize: 11, fontWeight: 700, backgroundColor: "rgba(255,255,255,.9)", padding: [2, 4], borderRadius: 4, formatter: () => fmt(b.now, 1) + "X" } }] }; })() }] }), true); }); });
      // 보고서 그림을 옮긴 차트 (data/report_charts.json): 비중 = 100% 누적 막대, 추이 = 막대
      // 금액 차트(누적·막대+선)끼리 왼쪽 Y축 최대값을 같게 (사용자 지정 2026-10-13): 누적은 기간별 합, 막대+선은 막대 값
      // 금액 차트(누적·막대+선)끼리 왼쪽 Y축 최대값을 같게: 누적은 기간별 합, 막대+선은 막대 값 중 최대를 보기 좋게 올림 (사용자 지정 2026-10-13)
      const niceCeil = x => { const p = Math.pow(10, Math.floor(Math.log10(x))); return [1, 2, 2.5, 5, 10].map(k => k * p).find(v => v >= x - 1e-9); };
      const leftStep = m => niceStep(m, 4);
      // 단위가 다르면(예: LS 십억원 vs 조원) 같게 맞추지 않음 (2026-10-14)
      const money = (d.report_charts || []).filter(ch => /^stack|^combo$/.test(ch.type));
      // 누적 합이 막대+선의 '선'(수주잔고)과 같은 크기면 (LS 그림 10 = 수주잔고) 막대(신규수주)와 맞추지 않음
      const sums = ch => ch.labels.map((_, i) => ch.series.reduce((t, s) => t + (s.vals[i] || 0), 0));
      const lineLike = money.some(st => st.type !== "combo" && money.some(cb => { if (cb.type !== "combo") return false;
        const a = Math.max(0, ...sums(st)), b = Math.max(0, ...cb.series.slice(1).flatMap(s => s.vals).filter(v => v != null)); return b && Math.abs(a - b) / b < 0.1; }));
      const leftMax = lineLike || new Set(money.map(ch => ch.unit)).size !== 1 ? null : (() => { let m = 0; const mx = a => Math.max(0, ...a.filter(v => v != null));
        money.forEach(ch => {
          if (ch.type !== "combo") ch.labels.forEach((_, i) => { m = Math.max(m, ch.series.reduce((t, s) => t + (s.vals[i] || 0), 0)); });
          if (ch.type === "combo") m = Math.max(m, mx(ch.series[0].vals)); });
        if (!m) return null; const st = leftStep(m); return Math.ceil(m / st - 1e-9) * st; })();
      (d.report_charts || []).forEach((ch, i) => { const el = $("#rch" + i); if (!el) return;
        if (!ch.series.some(s => s.vals.some(v => v != null))) { el.innerHTML = '<p class="note" style="padding:40px 0;text-align:center">값 입력 대기 중</p>'; return; }
        if (ch.type === "combo_stack") {   // 누적막대+선 (일진전기 부문별, 2026-10-14): 이름에 '잔고' 들어간 계열 = 선(오른쪽 축), 나머지 = 쌓은 막대. 음수는 0에서 자름
          const isLn = s => /잔고/.test(s.name), bars = ch.series.filter(s => !isLn(s)), lns = ch.series.filter(isLn);
          const bc = ["#0071e3", "#8ec5ff", "#34c759", "#aeaeb2"], lc = ["#ff9f0a", "#ff375f", "#af52de", "#1d1d1f"];
          lazy(el, c => c.setOption(base({ legend: Object.assign(base().legend, { data: ch.series.map(s => s.name) }),
            tooltip: Object.assign(base().tooltip, { axisPointer: { type: "shadow" }, valueFormatter: v => v == null ? "-" : fmt(v, 1) }), noAlign: true,
            xAxis: xCat(ch.labels), yAxis: [yVal({ name: ch.unit, min: 0 }), yVal({ name: ch.unit, min: 0, splitLine: { show: false } })],
            series: [...bars.map((s, k) => ({ name: s.name, type: "bar", stack: "s", barMaxWidth: 30, data: s.vals, itemStyle: { color: bc[k % 4] } })),
              ...lns.map((s, k) => ({ name: s.name, type: "line", yAxisIndex: 1, data: s.vals, symbol: "circle", symbolSize: 6, lineStyle: { width: 2.5, color: lc[k % 4] },
                itemStyle: { color: "#fff", borderColor: lc[k % 4], borderWidth: 2 } }))] }), true));
          return; }
        if (ch.type === "stack" || ch.type === "stack_share" || ch.type === "combo") {   // 누적(금액 쌓은 막대) / 누적+비중선(첫 계열 비중, 오른쪽 축) / 막대+선(첫 계열 막대, 나머지 선·오른쪽 축)
          const dec = ch.series.some(s => s.vals.some(v => v != null && Math.abs(v - Math.round(v)) > 1e-9)) && ch.type !== "combo" && Math.max(0, ...ch.series.flatMap(s => s.vals).filter(v => v != null)) < 100 ? 1 : 0;   // 조원처럼 소수 값이면 소수 1자리
          lazy(el, c => { const combo = ch.type === "combo", shareLn = ch.type === "stack_share", cols = ["#636366", "#aeaeb2", "#d1d1d6", "#f8c98a", "#c4a88f", "#ff9f0a"];
            c.setOption(base({ legend: Object.assign(base().legend, { data: ch.series.map(s => s.name).concat(shareLn ? [ch.series[0].name + " 비중(R)"] : []) }),
              tooltip: Object.assign(base().tooltip, { axisPointer: { type: "shadow" }, valueFormatter: v => v == null ? "-" : fmt(v, dec) },
                combo ? {} : { formatter: ps => { const i = ps[0].dataIndex, tot = ch.series.reduce((t, s) => t + (s.vals[i] || 0), 0);   // 누적: 맨 아래 합계
                  return `<b>${ch.labels[i]}</b><br>` + ps.map(p => `${p.marker} ${p.seriesName} <b style="float:right;margin-left:16px">${p.value == null ? "-" : fmt(p.value, /비중/.test(p.seriesName) ? 1 : dec) + (/비중/.test(p.seriesName) ? "%" : "")}</b>`).join("<br>")
                    + `<div style="border-top:1px solid #e5e5ea;margin-top:4px;padding-top:4px">합계 <b style="float:right;margin-left:16px">${fmt(tot, dec)}</b></div>`; } }),
              noAlign: true,
              xAxis: xCat(ch.labels), yAxis: (() => { if (!leftMax) return combo || shareLn ? [yVal({ name: ch.unit, min: 0 }), yVal({ name: combo ? ch.unit : "(%)", splitLine: { show: false } })] : yVal({ name: ch.unit });
                const stL = leftStep(leftMax), n = Math.round(leftMax / stL), L = yVal({ name: ch.unit, min: 0, max: leftMax, interval: stL });
                if (combo) { const R = Math.max(0, ...ch.series.slice(1).flatMap(s => s.vals).filter(v => v != null)), stR = niceCeil(R / n || 1);
                  return [L, yVal({ name: ch.unit, min: 0, max: stR * n, interval: stR, splitLine: { show: false } })]; }
                return shareLn ? [L, yVal({ name: "(%)", min: 0, max: 100, interval: 100 / n, splitLine: { show: false } })] : L; })(),
              series: [...ch.series.map((s, k) => combo && k > 0
                ? { name: s.name, type: "line", yAxisIndex: 1, data: s.vals, symbol: "circle", symbolSize: 7, lineStyle: { width: 2.5, color: "#ff9f0a" }, itemStyle: { color: "#fff", borderColor: "#ff9f0a", borderWidth: 2 },
                    label: { show: ch.labels.length <= 12, position: "top", fontSize: 9.5, color: "#c25e00", formatter: p => p.value == null ? "" : fmt(p.value, 0) } }
                : { name: s.name, type: "bar", stack: combo ? undefined : "s", barMaxWidth: 30, data: s.vals, itemStyle: { color: combo ? "#0071e3" : cols[k % cols.length] },
                    label: { show: combo && ch.labels.length <= 12, position: "top", fontSize: 9.5, color: "#1d1d1f", formatter: p => p.value == null ? "" : fmt(p.value, 0) } }),
                ...(shareLn && ch.series[0] ? [{ name: ch.series[0].name + " 비중(R)", type: "line", yAxisIndex: 1, symbol: "circle", symbolSize: 6, z: 10,   // 누적: 첫 계열(북미) 비중 % (보조축)
                  data: ch.labels.map((_, i) => { const t = ch.series.reduce((a, s) => a + (s.vals[i] || 0), 0); return t ? +(100 * (ch.series[0].vals[i] || 0) / t).toFixed(1) : null; }),
                  lineStyle: { width: 2.5, color: "#ff375f" }, itemStyle: { color: "#fff", borderColor: "#ff375f", borderWidth: 2 } }] : [])] }), true); });
          return; }
        lazy(el, c => { const share = ch.type === "share";
          c.setOption(base({ legend: Object.assign(base().legend, { show: ch.series.length > 1, data: ch.series.map(s => s.name) }),
            grid: Object.assign(base().grid, ch.series.length > 1 ? {} : { top: 36 }),   // 범례 없는 단일 계열: 범례 자리만큼 위 여백 줄임
            tooltip: Object.assign(base().tooltip, { axisPointer: { type: "shadow" }, valueFormatter: v => v == null ? "-" : fmt(v, 1) + (share ? "%" : "") }),
            xAxis: xCat(ch.labels), yAxis: yVal({ name: ch.unit, max: share ? 100 : null }),
            series: ch.series.map((s, k) => ({ name: s.name, type: "bar", stack: share ? "s" : undefined, barMaxWidth: 34, data: s.vals,
              itemStyle: { color: share ? ["#8e8e93", "#636366", "#3a3a3c", "#f8c98a", "#f4a259", "#ff7a1a"][k % 6] : "#f4a259", borderRadius: share ? 0 : [5, 5, 0, 0] },
              label: { show: true, position: share ? "inside" : "top", fontSize: 9.5, color: share ? (k <= 2 ? "#fff" : "#1d1d1f") : "#1d1d1f",
                formatter: p => p.value == null || (share && p.value < 4) ? "" : fmt(p.value, 1) } })) }), true); }); });
      const ob = $("#chOrders");
      if (ob && fin.backlog) lazy(ob, c => {
        const bl = fin.backlog.q.labels.length ? fin.backlog.q : fin.backlog.y, od = fin.orders ? (fin.orders.q.labels.length ? fin.orders.q : fin.orders.y) : null;
        const L = bl.labels, fc = L.map(x => /F$/.test(x));
        c.setOption(base({ tooltip: Object.assign(base().tooltip, { valueFormatter: v => auto(v) }), xAxis: xCat(L), yAxis: [yVal({ name: "(" + String(fin.unit || "").split(",")[0].trim() + ")" }), yVal({ splitLine: { show: false } })],
          series: [od ? { name: fin.orders.label || "신규수주", type: "bar", barMaxWidth: 30, data: od.vals.map((v, i) => fcStyle(v, /F$/.test(od.labels[i]), "#34c759")), itemStyle: { color: "#34c759", borderRadius: [6, 6, 0, 0] } } : null,
            { name: fin.backlog.label || "수주잔고", type: "line", yAxisIndex: od ? 1 : 0, data: bl.vals, symbolSize: 6, lineStyle: { width: 2.5, color: "#1d1d1f" }, itemStyle: { color: "#1d1d1f" } }].filter(Boolean) }));
      });
    }
    const tp = $("#chTp");
    if (tp) { let rg = "all"; lazy(tp, c => { c.setOption(tpOption(d.prices, d.tp_history, d.ccy, rg), true);
        // 보고서 점을 누르면 그 보고서 요약 페이지로
        c.on("click", p => { if (p.seriesName === "보고서" && p.data && p.data.r && p.data.r.url) window.open(p.data.r.url, "_blank", "noopener"); }); }); seg($("#tpSeg"), v => { rg = v; tp._chart && tp._chart.setOption(tpOption(d.prices, d.tp_history, d.ccy, rg), true); }); }
    const rv = $("#chRev");
    if (rv && d.revisions.length) {
      const years = d.rev_years || ["2026F", "2027F", "2028F"];
      let yr = years[0];
      // 지배순이익과 EPS 사이 실선: 왼쪽 축(금액) | 오른쪽 축(EPS) 구분
      const sep = c => {
        const a = c.convertToPixel({ xAxisIndex: 0 }, "지배순이익"), b = c.convertToPixel({ xAxisIndex: 0 }, "EPS (우축)");
        const g = c.getModel().getComponent("grid").coordinateSystem.getRect();
        if (a == null || b == null || isNaN(b)) { c.setOption({ graphic: [{ id: "sep", type: "line", invisible: true, shape: { x1: 0, y1: 0, x2: 0, y2: 0 } }] }); return; }
        const x = (a + b) / 2;
        c.setOption({ graphic: [{ id: "sep", type: "line", shape: { x1: x, y1: g.y - 6, x2: x, y2: g.y + g.height + 22 }, style: { stroke: "#86868b", lineWidth: 1.5, lineDash: [5, 4] }, z: 100 }] });
      };
      // 기본은 이 연도 추정치가 있는 최근 6편만, '전체 보기'로 전부
      let all = false;
      const pick = () => { const rs = d.revisions.filter(r => r.years[yr] && Object.values(r.years[yr]).some(v => v != null));
        const btn = $("#revAll"); if (btn) { btn.hidden = rs.length <= 6; btn.textContent = all ? "최근 6편만" : `전체 보기 (${rs.length}편)`; }
        return all ? rs : rs.slice(-6); };
      const drawRev = c => { c.setOption(revOption(pick(), yr, d.rev_unit, d.ccy === "USD" ? "USD" : "원"), true); setTimeout(() => sep(c), 0); };
      const ra = $("#revAll"); if (ra) ra.addEventListener("click", () => { all = !all; rv._chart && drawRev(rv._chart); });
      lazy(rv, c => { drawRev(c); window.addEventListener("resize", () => setTimeout(() => sep(c), 50)); });
      seg($("#revSeg"), v => { yr = v; rv._chart && drawRev(rv._chart); });
    }
    const dm = $("#discMore");
    if (dm) dm.addEventListener("click", () => {   // 공시: 10건 + 더 보기
      const hid = $$("#discList .more-item"); const open = hid[0].hidden;
      hid.forEach(x => { x.hidden = !open; });
      dm.textContent = open ? "접기" : `더 보기 (${hid.length}건)`;
    });
    const nm = $("#newsMore");
    if (nm) nm.addEventListener("click", () => {   // 뉴스: 8건 + 더 보기
      const hid = $$("#newsList .more-item"); const open = hid[0].hidden;
      hid.forEach(x => { x.hidden = !open; });
      nm.textContent = open ? "접기" : `더 보기 (${hid.length}건)`;
    });
    const rm = $("#repMore");
    if (rm) rm.addEventListener("click", () => {   // 보고서 목록: 최근 5편 + 더 보기
      const hid = $$("#repList .more-item"); const open = hid[0].hidden;
      hid.forEach(x => { x.hidden = !open; if (open) x.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: "ease-out" }); });
      rm.textContent = open ? "접기" : `더 보기 (${hid.length}편)`;
    });
    const fl = $("#chFlow");
    if (fl && d.flows) {
      let rg = "3m";
      const LAB = { "1m": "1개월", "3m": "3개월", "6m": "6개월", "1y": "1년", "3y": "3년", "all": "전체 기간" }, N = { "1m": 21, "3m": 63, "6m": 126, "1y": 240, "3y": 740, "all": 1e9 };
      const stats = () => {   // 고른 기간의 순매수 합계만 표시
        const n = N[rg], f = d.flows, sum = a => (a || []).slice(-n).reduce((t, v) => t + (v || 0), 0);
        $("#flowStats").innerHTML = [["외국인", f.foreign], ["기관", f.organ], ["개인", f.individual]].map(([k, a]) => {
          const v = sum(a); return `<div class="kpi"><div class="l">${k} ${LAB[rg]} 순매수</div><div class="v ${v > 0 ? "up" : v < 0 ? "down" : ""}" style="font-size:26px">${v > 0 ? "+" : ""}${fmt(v, 0)}억</div></div>`;
        }).join("");
      };
      stats();
      lazy(fl, c => c.setOption(flowOption(d.flows, rg), true));
      seg($("#flowSeg"), v => { rg = v; stats(); fl._chart && fl._chart.setOption(flowOption(d.flows, rg), true); });
    }
    // 가격대별 매물 (2026-10-15): 고른 기간의 투자자별 순매수(주)를 그날 종가 가격대에 합산 + 남은 물량 평단 (비례 차감)
    const cEls = { foreign: $("#chCostF"), organ: $("#chCostO"), individual: $("#chCostI") };
    if (cEls.foreign && d.flows) {
      let crg = "3y";
      const NM = { foreign: "외국인", organ: "기관", individual: "개인" }, CL = { foreign: "#0071e3", organ: "#ff9f0a", individual: "#34c759" };
      const N2 = { "1m": 21, "3m": 63, "6m": 126, "1y": 240, "3y": 740, "all": 1e9 };
      const calc = () => { const f = d.flows, n = Math.min(N2[crg], f.dates.length), s0 = f.dates.length - n;
        const px = f.price.slice(s0), lo = Math.min(...px.filter(Boolean)) * 0.98, hi = Math.max(...px.filter(Boolean)) * 1.02, B = 16, w = (hi - lo) / B;
        const out = { lo, hi, w, B, cur: px[px.length - 1], from: f.dates[s0], to: f.dates[f.dates.length - 1] };
        ["foreign", "organ", "individual"].forEach(k => {
          const sh = f[k].slice(s0).map((v, i) => px[i] ? (v || 0) * 1e8 / px[i] : 0), bins = Array(B).fill(0);
          let lots = new Map();
          sh.forEach((q, i) => { const p = px[i]; if (!p) return; bins[Math.min(B - 1, Math.floor((p - lo) / w))] += q;
            if (q > 0) lots.set(p, (lots.get(p) || 0) + q);
            else if (q < 0) { let tot = 0; lots.forEach(v => tot += v); if (tot > 0) { const r = 1 - Math.min(-q, tot) / tot; lots.forEach((v, kk) => lots.set(kk, v * r)); } } });
          let tot = 0, amt = 0; lots.forEach((v, p) => { tot += v; amt += v * p; });
          out[k] = { bins, avg: tot > 1 ? amt / tot : null, left: tot, sum: sh.reduce((a, b) => a + b, 0) }; });
        return out; };
      const opt = (k, R) => { const x = R[k], lim = Math.max(1, ...["foreign", "organ", "individual"].flatMap(kk => R[kk].bins.map(Math.abs))) / 1e3 * 1.1;
        const data = x.bins.map((v, i) => [v / 1e3, (R.lo + i * R.w) / 1e4, (R.lo + (i + 1) * R.w) / 1e4]);
        const ml = [{ yAxis: R.cur / 1e4, lineStyle: { color: "#ff375f", type: "dashed", width: 1.2 }, label: { formatter: `현재가 ${fmt(R.cur / 1e4, 0)}만`, color: "#ff375f", position: "insideEndTop", fontSize: 10, backgroundColor: "rgba(255,255,255,.92)", padding: [1, 4], borderRadius: 4 } }];
        if (x.avg) ml.push({ yAxis: x.avg / 1e4, lineStyle: { color: CL[k], type: [6, 3], width: 2 }, label: { formatter: `평단 ${fmt(x.avg / 1e4, 0)}만 (${fmt(x.left / 1e3, 0)}천주)`, color: CL[k], fontWeight: 700, position: "insideStartTop", fontSize: 10.5, backgroundColor: "rgba(255,255,255,.92)", padding: [2, 5], borderRadius: 4 } });
        return { animationDuration: 600, noAlign: true,
          title: { text: `${NM[k]}  ${x.sum >= 0 ? "+" : ""}${fmt(x.sum / 1e3, 0)}천주` + (x.avg ? "" : "  · 평단 없음"), left: 0, top: 0, textStyle: { fontSize: 13, fontWeight: 600, color: getComputedStyle(document.body).color } },
          grid: { left: 44, right: 12, top: 34, bottom: 28 },
          tooltip: { trigger: "item", formatter: p => `${fmt(p.value[1], 0)}~${fmt(p.value[2], 0)}만원<br>${NM[k]} 순매수 <b>${fmt(p.value[0], 1)}천주</b>` },
          xAxis: { type: "value", min: -lim, max: lim, axisLabel: { color: "#86868b", fontSize: 10, formatter: v => fmt(v, 0) }, splitLine: { lineStyle: { color: "#f0f0f2" } } },
          yAxis: { type: "value", min: R.lo / 1e4, max: R.hi / 1e4, axisLabel: { color: "#86868b", fontSize: 10, formatter: v => fmt(v, 0) }, splitLine: { lineStyle: { color: "#f0f0f2" } } },
          series: [{ type: "custom", renderItem: (params, api) => { const a = api.coord([0, api.value(1)]), b = api.coord([api.value(0), api.value(2)]), gap = 1.5;
              return { type: "rect", shape: { x: Math.min(a[0], b[0]), y: b[1] + gap, width: Math.abs(b[0] - a[0]), height: Math.max(0, a[1] - b[1] - gap * 2) }, style: { fill: CL[k] } }; },
            encode: { x: 0, y: [1, 2] }, data, markLine: { silent: true, symbol: "none", data: ml } },
            { type: "line", data: [[0, R.lo / 1e4], [0, R.hi / 1e4]], symbol: "none", lineStyle: { color: "#86868b", width: 0.8 }, silent: true }] }; };
      const drawC = () => { const R = calc(); Object.entries(cEls).forEach(([k, el]) => el._chart && el._chart.setOption(opt(k, R), true)); };
      Object.values(cEls).forEach(el => lazy(el, () => drawC()));
      seg($("#costSeg"), v => { crg = v; drawC(); });
    }
  };
  P.indicators = d => {
    seg($("#indTabs"));   // 세그먼트 바 모양 (손잡이), 탭 전환은 아래 tabs 가 처리
    const showTab = tabs($("#indTabs"), $("#indPanels"), null, true);
    window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if (h) showTab(h); window.scrollTo({ top: 0, behavior: "smooth" }); });
    // 시장 지표 카드 → 큰 차트
    const big = $("#mkBig"); let cur = (d.market || [])[0];
    const rangeCut = r => { const days = { "1m": 31, "3m": 92, "6m": 182, "1y": 365, all: 9999 }[r]; return new Date(Date.now() - days * 864e5).toISOString().slice(0, 10); };
    let mr = "1y";
    const drawMk = () => { if (!cur || !big) return; const cut = rangeCut(mr); const idx = cur.dates.findIndex(x => x >= cut); const s = Math.max(0, idx);
      $("#mkTitle").textContent = cur.name; $("#mkUnit").textContent = cur.unit;
      big._chart && big._chart.setOption(lineOption(cur.dates.slice(s), [{ name: cur.name, vals: cur.vals.slice(s), color: "#0071e3" }], { unit: "(" + cur.unit + ")", endLabel: true }), true); };
    if (big) lazy(big, () => drawMk());
    $$(".mk").forEach(el => { const s = (d.market || []).find(x => x.name === el.dataset.n); if (s) spark($(".spark", el), s.vals.slice(-120), "#0071e3");
      el.addEventListener("click", () => { cur = s; $$(".mk").forEach(x => x.classList.toggle("on", x === el)); drawMk(); big.scrollIntoView({ behavior: "smooth", block: "center" }); }); });
    seg($("#mkSeg"), v => { mr = v; drawMk(); });
    toggleData($("#mkData"), $("#mkDataBox"), () => { const s = cur; dataTable($("#mkDataBox"), ["날짜", s.name], s.dates.map((x, i) => [x, s.vals[i]]).reverse(), s.name); });
    // 커버리지 상대주가
    const rel = d.rel || []; let gi = +(($("#relSeg button.on") || {}).dataset || {}).v || 0, relMode = "rel";
    const relEl = $("#relChart");
    // 장중 주가(live.json)를 오늘 날짜 점으로 붙임: 종가 = 실시간가, 상대값 = 직전 상대값 × (실시간가 / 직전 종가)
    const withLive = g => { const L = window.__live; if (!L || !L.at) return g;
      const day = L.at.slice(0, 10), n = g.dates.length, last = g.dates[n - 1]; if (day < last) return g;
      const add = day > last, k0 = add ? n - 1 : n - 2; if (k0 < 0) return g;
      const series = g.series.map(s => { let k = k0; while (k >= 0 && (s.abs[k] == null || (s.rel && s.rel[k] == null))) k--;   // 직전 거래일 (휴장일 빈칸 건너뜀)
        const q = s.key && L.q[s.key]; const a0 = k >= 0 ? s.abs[k] : null, r0 = s.rel && k >= 0 ? s.rel[k] : null;
        const ap = q && q.p && a0 ? q.p : (add ? s.abs[n - 1] : s.abs[n - 1]);
        const rp = q && q.p && a0 && r0 != null ? +(r0 * q.p / a0).toFixed(2) : (s.rel ? s.rel[n - 1] : null);
        const abs = add ? s.abs.concat([ap]) : s.abs.slice(0, -1).concat([ap]);
        const relv = s.rel ? (add ? s.rel.concat([rp]) : s.rel.slice(0, -1).concat([rp])) : s.rel;
        return Object.assign({}, s, { abs, rel: relv }); });
      return Object.assign({}, g, { dates: add ? g.dates.concat([day]) : g.dates, series }); };
    const drawRel = () => { const g = withLive(rel[gi]); if (!g || !relEl._chart) return;
      const ss = g.series.map(s => ({ name: s.name, vals: relMode === "rel" ? s.rel : s.abs, dash: s.index, bold: s.index, color: s.index ? "#8e8e93" : undefined, base: relMode === "rel" ? 100 : null }));
      relEl._chart.setOption(lineOption(g.dates, relMode === "rel" ? ss : ss.filter(s => !/(pt)/.test(s.name)), { unit: relMode === "rel" ? `(${g.base})` : "(종가)", zoom: true, endLabel: true }), true);   // 마지막 값 라벨 (홈과 같게) + 오른쪽 여백으로 마지막 날짜 안 잘림
      $("#relNote").textContent = `기준일 ${g.base}. 점선 = 지수.`; };
    if (relEl) lazy(relEl, () => drawRel());
    seg($("#relSeg"), v => { gi = +v; drawRel(); });
    document.addEventListener("live", () => drawRel());
    seg($("#relMode"), v => { relMode = v; drawRel(); });
    toggleData($("#relData"), $("#relDataBox"), () => { const g = rel[gi]; dataTable($("#relDataBox"), ["날짜", ...g.series.map(s => s.name)], g.dates.map((x, i) => [x, ...g.series.map(s => (relMode === "rel" ? s.rel : s.abs)[i])]).reverse(), "상대주가_" + g.group); });
    // PER·PBR
    const pp = d.per_pbr || []; let pg = 0;
    // PER·PBR 을 좌우 두 그래프로 (2026-10-12, PPI 와 같은 배치). x = 연도, 선 = 기업
    const ppEls = { per: $("#ppChart"), pbr: $("#pbChart") };
    const drawOne = pk => { const g = pp[pg], el = ppEls[pk]; if (!g || !el || !el._chart) return; const obj = g[pk];
      const cap = pk === "per" ? 150 : 40;
      el._chart.setOption(base({ tooltip: Object.assign(base().tooltip, { valueFormatter: v => v == null ? "-" : fmt(v, pk === "per" ? 1 : 2) + "배" }),
        legend: Object.assign(base().legend, { type: "plain" }),
        xAxis: xCat(g.years, { boundaryGap: true, axisLabel: { color: "#1d1d1f", fontSize: 12 } }), yAxis: yVal({ name: "(배)" }),
        series: Object.entries(obj).map(([nm, a], k) => ({ name: nm, type: "line", data: a.map(v => v != null && v < cap ? v : null), connectNulls: false,
          symbol: "circle", symbolSize: 7, lineStyle: { width: 2.5, color: PAL[k % PAL.length] }, itemStyle: { color: "#fff", borderColor: PAL[k % PAL.length], borderWidth: 2 },
          label: { show: true, position: "top", fontSize: 10, color: PAL[k % PAL.length], formatter: p => p.value == null ? "" : fmt(p.value, 1) }, labelLayout: { hideOverlap: true } })) }), true); };
    const drawPP = () => { drawOne("per"); drawOne("pbr"); const g = pp[pg]; if (g) $("#ppNote").textContent = g.basis + " · 150배 넘는 PER 은 그래프에서 생략"; };
    Object.values(ppEls).forEach(el => { if (el) lazy(el, () => drawPP()); });
    seg($("#ppSeg"), v => { pg = +v; drawPP(); });
    toggleData($("#ppData"), $("#ppDataBox"), () => { const g = pp[pg]; const names = Object.keys(g.per);
      dataTable($("#ppDataBox"), ["연도", ...names.map(n => n + " PER"), ...Object.keys(g.pbr).map(n => n + " PBR")], g.years.map((y, k) => [y, ...names.map(n => g.per[n][k]), ...Object.keys(g.pbr).map(n => g.pbr[n][k])]), "PER_PBR"); });
    // 외국인 보유율
    const fr = d.foreign || []; let fi = +(($("#frSeg button.on") || {}).dataset || {}).v || 0, frg = "6m";
    const frEl = $("#frChart");
    const drawFr = () => { const g = fr[fi]; if (!g || !frEl._chart) return; const cut = rangeCut(frg); const s = Math.max(0, g.dates.findIndex(x => x >= cut));
      frEl._chart.setOption(lineOption(g.dates.slice(s), g.series.map(x => ({ name: x.name, vals: x.vals.slice(s) })), { unit: "(%)", suf: "%", endLabel: true }), true); };
    if (frEl) lazy(frEl, () => drawFr());
    seg($("#frSeg"), v => { fi = +v; drawFr(); });
    seg($("#frRange"), v => { frg = v; drawFr(); });
    toggleData($("#frData"), $("#frDataBox"), () => { const g = fr[fi]; dataTable($("#frDataBox"), ["날짜", ...g.series.map(s => s.name)], g.dates.map((x, i) => [x, ...g.series.map(s => s.vals[i])]).reverse(), "외국인보유율"); });
    // 미국 전기요금 (EIA, 2026-10-14): '지역 비교' = 용도 하나로 여러 지역 선 / '지역별 용도' = 한 지역의 용도 4개 선. 오른쪽은 전년 대비.
    // 데이터는 탭을 열 때 assets/eia_price.json 에서 (ERCOT·PJM 은 주 묶음 근사)
    (() => { const el = $("#elChart"), ey = $("#elYoy"), area = $("#elArea"), picksBox = $("#elPicks"); if (!el) return;
      let E = null, mode = "cmp", one = "US", sec = "ALL", per = "m", rng = 5, picks = ["US", "PJM", "ERCOT"], busy = false;   // 처음엔 미국 전체·PJM·ERCOT (사용자 지정)
      const SC = ["#1d1d1f", "#ff9f0a", "#0071e3", "#34c759"], CC = ["#1d1d1f", "#0071e3", "#ff375f", "#ff9f0a", "#34c759", "#af52de", "#5ac8fa", "#a2845e", "#8e8e93", "#30b0c7", "#ffcc00", "#5856d6", "#ff6b81", "#64d2a0", "#c7a17a"];
      const nameOf = id => { if (!E) return id; const g = E.iso.find(x => x.id === id) || E.regions.find(x => x.id === id); if (g) return g.name;
        for (const r of E.regions) { const s = (r.states || []).find(x => x.id === id); if (s) return s.name; } return id; };
      const options = (skip = []) => { const o = (lab, arr) => { const it = arr.filter(x => !skip.includes(x.id)); return it.length ? `<optgroup label="${lab}">` + it.map(x => `<option value="${x.id}">${x.name}</option>`).join("") + "</optgroup>" : ""; };
        const states = E.regions.flatMap(r => r.states || []).sort((a, b) => a.name.localeCompare(b.name));
        return o("미국", [{ id: "US", name: "미국 전체" }]) + o("ISO/RTO (주 단위 근사)", E.iso) + o("주", states); };
      const renderPicks = () => { if (mode !== "cmp" || !E) { picksBox.innerHTML = ""; return; }
        picksBox.innerHTML = picks.map((id, k) => `<span class="el-chip"><i style="background:${CC[k % CC.length]}"></i>${nameOf(id)}${picks.length > 1 ? `<b data-x="${id}">×</b>` : ""}</span>`).join("")
          + `<select class="el-sel el-add"><option value="">+ 지역 추가</option>${options(picks)}</select>`;
        picksBox.querySelectorAll("b[data-x]").forEach(b => b.onclick = () => { picks = picks.filter(x => x !== b.dataset.x); renderPicks(); draw(); });
        const add = picksBox.querySelector(".el-add"); add.onchange = () => { if (add.value && picks.length < 15) { picks.push(add.value); renderPicks(); draw(); } }; };
      const draw = () => { if (!E || !el._chart || !ey._chart) return; const P = E[per], n = P.dates.length;
        const lag = per === "m" ? 12 : 1, cut = rng ? Math.max(0, n - rng * (per === "m" ? 12 : 1)) : 0;
        const ser = mode === "cmp" ? picks.map((id, k) => ({ name: nameOf(id), vals: P.vals[id + "|" + sec] || [], color: CC[k % CC.length], bold: k === 0 }))
          : E.sectors.map((s, k) => ({ name: s.name, vals: P.vals[one + "|" + s.id] || [], color: SC[k], bold: k === 0 }));
        const t = $("#elTitle"); if (t) t.textContent = mode === "cmp" ? E.sectors.find(s => s.id === sec).name + " 전기요금 비교" : nameOf(one) + " 용도별 전기요금";
        const yoy = ser.map(s => ({ name: s.name, color: s.color, bold: s.bold, vals: s.vals.map((v, i) => i >= lag && v != null && s.vals[i - lag] ? +(100 * (v / s.vals[i - lag] - 1)).toFixed(1) : null) }));
        const sl = a => a.map(s => Object.assign({}, s, { vals: s.vals.slice(cut) })), ds = P.dates.slice(cut);
        el._chart.setOption(lineOption(ds, sl(ser), { unit: "(¢/kWh)", endLabel: true, dec: 2 }), true);
        ey._chart.setOption(lineOption(ds, sl(yoy).map((s, k) => Object.assign(s, { base: k === 0 ? 0.0001 : null })), { unit: "YoY(%)", suf: "%", endLabel: true, dec: 1 }), true); };
      const setMode = () => { $("#elAreaRow").classList.toggle("el-hide", mode !== "one"); $("#elSec").classList.toggle("el-hide", mode !== "cmp"); renderPicks(); draw(); };
      const load = () => { if (E || busy) return; busy = true;
        fetch("assets/eia_price.json?v=" + Date.now().toString().slice(0, -5)).then(r => r.json()).then(j => { E = j; area.innerHTML = options(); area.value = one; setMode(); })
          .catch(() => { el.innerHTML = '<p class="note" style="padding:40px 0;text-align:center">데이터를 읽지 못했습니다</p>'; }); };
      lazy(el, () => { load(); draw(); }); lazy(ey, () => draw());
      seg($("#elMode"), v => { mode = v; setMode(); });
      seg($("#elSec"), v => { sec = v; draw(); });
      seg($("#elPer"), v => { per = v; draw(); });
      seg($("#elRng"), v => { rng = +v; draw(); });
      area.addEventListener("change", () => { one = area.value; draw(); }); })();
    // 미국 전기 사용량 (EIA 판매 전력량, 2026-10-14): 전기요금 탭과 같은 구조 (사용자 요청)
    //  지역 비교 = 고른 지역들을 누적 영역으로 쌓음 (처음엔 ISO/RTO 10개 + 기타 = 미국 전체), 오른쪽 전년 대비 (합계·PJM·ERCOT 만 켜짐, 나머지는 범례로)
    //  지역별 용도 = 한 지역의 주거·상업·산업·기타 누적, 오른쪽 용도별 전년 대비
    (() => { const el = $("#esChart"), ey = $("#esYoy"), area = $("#esArea"), picksBox = $("#esPicks"); if (!el) return;
      let E = null, mode = "cmp", one = "US", sec = "ALL", per = "m", rng = 5, picks = null, busy = false;
      const CC = ["#0071e3", "#ff375f", "#ff9f0a", "#34c759", "#af52de", "#5ac8fa", "#a2845e", "#30b0c7", "#ffcc00", "#5856d6", "#c7c7cc", "#ff6b81", "#64d2a0", "#8e8e93", "#1d1d1f"];
      const SC = { RES: "#ff9f0a", COM: "#0071e3", IND: "#34c759", OTH: "#c7c7cc" };
      const nameOf = id => { if (id === "OTH") return "기타"; if (id === "US") return "미국 전체"; const g = E.iso.find(x => x.id === id); if (g) return g.name;
        for (const r of E.regions) { const x = (r.states || []).find(y => y.id === id); if (x) return x.name; } return id; };
      const colorOf = id => id === "OTH" ? "#c7c7cc" : CC[picks.indexOf(id) % CC.length];
      const states = () => E.regions.flatMap(r => r.states || []).sort((a, b) => a.name.localeCompare(b.name));
      const options = (skip = [], withUS = false) => { const o = (lab, arr) => { const it = arr.filter(x => !skip.includes(x.id)); return it.length ? `<optgroup label="${lab}">` + it.map(x => `<option value="${x.id}">${x.name}</option>`).join("") + "</optgroup>" : ""; };
        return (withUS ? o("미국", [{ id: "US", name: "미국 전체" }]) : "") + o("ISO/RTO (주 단위 근사)", E.iso.concat([{ id: "OTH", name: "기타 (ISO/RTO 밖)" }])) + o("주", states()); };
      const renderPicks = () => { if (mode !== "cmp" || !E) { picksBox.innerHTML = ""; return; }
        picksBox.innerHTML = picks.map(id => `<span class="el-chip"><i style="background:${colorOf(id)}"></i>${nameOf(id)}${picks.length > 1 ? `<b data-x="${id}">×</b>` : ""}</span>`).join("")
          + `<select class="el-sel el-add"><option value="">+ 지역 추가</option>${options(picks)}</select>`;
        picksBox.querySelectorAll("b[data-x]").forEach(b => b.onclick = () => { picks = picks.filter(x => x !== b.dataset.x); renderPicks(); draw(); });
        const add = picksBox.querySelector(".el-add"); add.onchange = () => { if (add.value && picks.length < 15) { picks.push(add.value); renderPicks(); draw(); } }; };
      const draw = () => { if (!E || !el._chart || !ey._chart) return; const P = E[per], n = P.dates.length;
        const lag = per === "m" ? 12 : 1, cut = rng ? Math.max(0, n - rng * (per === "m" ? 12 : 1)) : 0, ds = P.dates.slice(cut);
        const tw = a => (a || []).map(v => v == null ? null : +(v / 1000).toFixed(1));   // GWh → TWh
        const V = (id, s) => P.vals[id + "|" + s] || [];
        let comp, totRaw, totName;
        if (mode === "cmp") {
          comp = picks.map(id => ({ id, name: nameOf(id), raw: V(id, sec), color: colorOf(id) }));
          totRaw = P.dates.map((_, i) => comp.some(c => c.raw[i] == null) ? null : comp.reduce((t, c) => t + c.raw[i], 0)); totName = "선택 지역 총량";
          $("#esTitle").textContent = (sec === "ALL" ? "" : E.sectors.find(x => x.id === sec).name + " ") + "전기 사용량 비교";
        } else {
          const all = V(one, "ALL"), parts = ["RES", "COM", "IND"].map(s => ({ id: s, name: E.sectors.find(x => x.id === s).name, raw: V(one, s), color: SC[s] }));
          const oth = all.map((v, i) => v == null || parts.some(p => p.raw[i] == null) ? null : Math.max(0, v - parts.reduce((t, p) => t + p.raw[i], 0)));
          comp = parts.concat([{ id: "OTH", name: "기타 (수송 등)", raw: oth, color: SC.OTH, noYoy: true }]); totRaw = all; totName = nameOf(one) + " 전체";   // 기타는 아주 작아 전년 대비가 튐 → 오른쪽에선 뺌
          $("#esTitle").textContent = nameOf(one) + " 용도별 전기 사용량";
        }
        const T = tw(totRaw).slice(cut);
        const o = lineOption(ds, comp.map(c => ({ name: c.name, vals: tw(c.raw).slice(cut), color: c.color })), { unit: "(TWh)", dec: 1 });
        o.series.forEach(x => { x.stack = "t"; x.smooth = false; x.areaStyle = { opacity: 0.85 }; x.lineStyle = Object.assign({}, x.lineStyle, { width: 0.6 }); x.emphasis = { focus: "none" }; });
        o.yAxis = Object.assign(o.yAxis, { scale: false, min: 0 }); o.grid.right = 24;
        o.tooltip = Object.assign(o.tooltip, { formatter: ps => { const i = ps[0].dataIndex; return `<b>${ds[i]}</b><br>` + ps.slice().reverse().map(p => `${p.marker} ${p.seriesName} <b style="float:right;margin-left:16px">${p.value == null ? "-" : fmt(p.value, 1)}</b>`).join("<br>")
          + `<div style="border-top:1px solid #e5e5ea;margin-top:4px;padding-top:4px">합계 <b style="float:right;margin-left:16px">${T[i] == null ? "-" : fmt(T[i], 1)} TWh</b></div>`; } });
        el._chart.setOption(o, true);
        const yy = a => a.map((v, i) => i >= lag && v != null && a[i - lag] ? +(100 * (v / a[i - lag] - 1)).toFixed(1) : null);
        const ys = [{ name: totName, vals: yy(totRaw).slice(cut), color: "#1d1d1f", bold: true, base: 0.0001 }].concat(comp.filter(c => !c.noYoy).map(c => ({ name: c.name, vals: yy(c.raw).slice(cut), color: c.id === "OTH" ? "#8e8e93" : c.color })));
        const oy = lineOption(ds, ys, { unit: "YoY(%)", suf: "%", endLabel: true, dec: 1 });
        ey._chart.setOption(oy, true); };
      const setMode = () => { $("#esAreaRow").classList.toggle("el-hide", mode !== "one"); $("#esSec").classList.toggle("el-hide", mode !== "cmp"); renderPicks(); draw(); };
      const load = () => { if (E || busy) return; busy = true;
        fetch("assets/eia_sales.json?v=" + Date.now().toString().slice(0, -5)).then(r => r.json()).then(j => { E = j; picks = E.iso.map(g => g.id).concat(["OTH"]);
          area.innerHTML = options([], true); area.value = one; setMode(); })
          .catch(() => { el.innerHTML = '<p class="note" style="padding:40px 0;text-align:center">데이터를 읽지 못했습니다</p>'; }); };
      lazy(el, () => { load(); draw(); }); lazy(ey, () => draw());
      seg($("#esMode"), v => { mode = v; setMode(); });
      seg($("#esSec"), v => { sec = v; draw(); });
      seg($("#esPer"), v => { per = v; draw(); });
      seg($("#esRng"), v => { rng = +v; draw(); });
      area.addEventListener("change", () => { one = area.value; draw(); }); })();
    // 전력기기 실적 합산 (2026-10-19): 기업별(지정 부문) 매출·영업이익 누적 막대, 추정치는 흐리게, 툴팁에 합계
    (() => { const E = d.earn_sum; if (!E || !$("#earnSales")) return; let per = "q";
      const cols = ["#1d1d1f", "#0071e3", "#ff9f0a", "#34c759", "#af52de"];
      const draw = () => [["#earnSales", "sales"], ["#earnOp", "op"]].forEach(([id, key]) => { const el = $(id); if (!el || !el._chart) return; const P = E[per], ser = P[key];
        const fcStart = P.fc.indexOf(true);
        el._chart.setOption(base({ legend: Object.assign(base().legend, { data: ser.map(x => x.name) }), noAlign: true,
          tooltip: Object.assign(base().tooltip, { axisPointer: { type: "shadow" }, formatter: ps => { const i = ps[0].dataIndex, tot = ser.reduce((t, x) => t + (x.vals[i] || 0), 0);
            return `<b>${P.labels[i]}${P.fc[i] ? "F" : ""}</b><br>` + ps.map(p => `${p.marker} ${p.seriesName} <b style="float:right;margin-left:16px">${p.value == null ? "-" : fmt(p.value, 0)}</b>`).join("<br>")
              + `<div style="border-top:1px solid #e5e5ea;margin-top:4px;padding-top:4px">합계 <b style="float:right;margin-left:16px">${fmt(tot, 0)}</b></div>`; } }),
          xAxis: xCat(P.labels.map((l, i) => l + (P.fc[i] ? "F" : ""))), yAxis: yVal({ name: "(십억원)" }),
          series: ser.map((x, k) => ({ name: x.name, type: "bar", stack: "s", barMaxWidth: 26, itemStyle: { color: cols[k % cols.length] },
            data: x.vals.map((v, i) => ({ value: v, itemStyle: P.fc[i] ? { opacity: 0.45 } : undefined })),
            markArea: k === 0 && fcStart >= 0 ? { silent: true, itemStyle: { color: "rgba(0,113,227,.05)" }, label: { show: true, position: "insideTop", color: "#86868b", fontSize: 10 },
              data: [[{ name: "추정", xAxis: fcStart }, { xAxis: P.labels.length - 1 }]] } : undefined })) }), true); });
      ["#earnSales", "#earnOp"].forEach(id => lazy($(id), () => draw()));
      seg($("#earnSeg"), v => { per = v; draw(); }); })();
    // 수주 합산 (2026-10-14): 5개사 신규수주 / 수주잔고 누적 막대, 툴팁 맨 아래 합계
    const os = d.orders_sum;
    if (os) [["#ordSum", os.orders], ["#blSum", os.backlog]].forEach(([id, ser]) => { const el = $(id); if (!el || !ser.length) return;
      const cols = ["#1d1d1f", "#0071e3", "#ff9f0a", "#34c759", "#af52de"], names = ["효성중공업 (중공업)", "HD현대일렉트릭", "LS일렉트릭", "산일전기", "일진전기 (중전기)"];
      lazy(el, c => c.setOption(base({ legend: Object.assign(base().legend, { data: ser.map(s => s.name) }), noAlign: true,
        tooltip: Object.assign(base().tooltip, { axisPointer: { type: "shadow" }, formatter: ps => { const i = ps[0].dataIndex, tot = ser.reduce((t, s) => t + (s.vals[i] || 0), 0);
          return `<b>${os.labels[i]}</b><br>` + ps.map(p => `${p.marker} ${p.seriesName} <b style="float:right;margin-left:16px">${p.value == null ? "-" : fmt(p.value, 0)}</b>`).join("<br>")
            + `<div style="border-top:1px solid #e5e5ea;margin-top:4px;padding-top:4px">합계 <b style="float:right;margin-left:16px">${fmt(tot, 0)}</b></div>`; } }),
        xAxis: xCat(os.labels), yAxis: yVal({ name: "(십억원)", min: 0 }),
        series: ser.map(s => ({ name: s.name, type: "bar", stack: "s", barMaxWidth: 26, data: s.vals, itemStyle: { color: cols[Math.max(0, names.indexOf(s.name)) % 5] } })) }), true)); });
    // 섹터 수급 합산 (기업 수급 차트와 같은 모양: 일별 막대 + 누적 선, 억원)
    const sf = d.sflow || []; let si = 0, srg = "6m";   // 첫 그룹(메뉴 순서대로)부터
    const sfEl = $("#sfChart");
    const sfStats = () => { const g = sf[si]; if (!g) return; const n = srg === "all" ? g.dates.length : { "1m": 21, "3m": 63, "6m": 126, "1y": 240 }[srg], LAB = srg === "all" ? `${g.dates[0].slice(0, 7).replace("-", ".")} 이후` : { "1m": "1개월", "3m": "3개월", "6m": "6개월", "1y": "1년" }[srg];
      const sum = a => a.slice(-n).reduce((t, v) => t + (v || 0), 0);
      $("#sfStats").innerHTML = [["외국인", g.foreign], ["기관", g.organ], ["개인", g.individual]].map(([k, a]) => { const v = sum(a);
        return `<div class="kpi"><div class="l">${g.group} ${k} ${LAB} 순매수</div><div class="v ${v > 0 ? "up" : v < 0 ? "down" : ""}" style="font-size:24px">${v > 0 ? "+" : ""}${fmt(v, 0)}억</div></div>`; }).join("");
      $("#sfNote").textContent = "합산 기업: " + g.companies.join(", ") + " · 순매수 주식수 × 그날 종가"; };
    // 섹터 가격대별 매물 (2026-10-15): 기업별 순매수(억원)를 '그날 종가가 현재가 대비 몇 %였나' 구간에 모아 합산. 평단도 현재가 대비 %
    const sfC = { foreign: $("#sfCostF"), organ: $("#sfCostO"), individual: $("#sfCostI") };
    const drawSfCost = () => { const g = sf[si]; if (!g || !g.per || !sfC.foreign) return;
      const n = srg === "all" ? g.dates.length : Math.min({ "1m": 21, "3m": 63, "6m": 126, "1y": 240 }[srg], g.dates.length), s0 = g.dates.length - n;
      const NM = { foreign: "외국인", organ: "기관", individual: "개인" }, CL = { foreign: "#0071e3", organ: "#ff9f0a", individual: "#34c759" };
      const comps = g.per.map(c => { const px = c.price.slice(s0), cur = [...px].reverse().find(Boolean); return { c, px, cur }; }).filter(x => x.cur);
      const rels = comps.flatMap(x => x.px.filter(Boolean).map(p => (p / x.cur - 1) * 100));
      if (!rels.length) return;
      const lo = Math.min(...rels) - 2, hi = Math.max(...rels) + 2, B = 16, w = (hi - lo) / B;
      const R = {};
      ["foreign", "organ", "individual"].forEach(k => { const bins = Array(B).fill(0); let sum = 0, leftV = 0, leftW = 0;
        comps.forEach(({ c, px, cur }) => { const lots = new Map();
          c[k].slice(s0).forEach((v, i) => { const p = px[i]; if (!p || v == null) return; const rel = (p / cur - 1) * 100; bins[Math.min(B - 1, Math.max(0, Math.floor((rel - lo) / w)))] += v; sum += v;
            const q = v * 1e8 / p;
            if (q > 0) lots.set(p, (lots.get(p) || 0) + q);
            else if (q < 0) { let tot = 0; lots.forEach(x => tot += x); if (tot > 0) { const r = 1 - Math.min(-q, tot) / tot; lots.forEach((x, kk) => lots.set(kk, x * r)); } } });
          lots.forEach((q, p) => { const val = q * cur; leftV += val; leftW += val * (p / cur - 1) * 100; }); });
        R[k] = { bins, sum, avg: leftV > 1e8 ? leftW / leftV : null, left: leftV / 1e8 }; });
      const lim = Math.max(1, ...Object.values(R).flatMap(x => x.bins.map(Math.abs))) * 1.1;
      Object.entries(sfC).forEach(([k, el]) => { if (!el._chart) return; const x = R[k];
        const ml = [{ yAxis: 0, lineStyle: { color: "#ff375f", type: "dashed", width: 1.2 }, label: { formatter: "현재가", color: "#ff375f", position: "insideEndTop", fontSize: 10, backgroundColor: "rgba(255,255,255,.92)", padding: [1, 4], borderRadius: 4 } }];
        if (x.avg != null) ml.push({ yAxis: x.avg, lineStyle: { color: CL[k], type: [6, 3], width: 2 }, label: { formatter: `평단 현재가 대비 ${x.avg >= 0 ? "+" : ""}${fmt(x.avg, 0)}% (${fmt(x.left, 0)}억 남음)`, color: CL[k], fontWeight: 700, position: "insideStartTop", fontSize: 10.5, backgroundColor: "rgba(255,255,255,.92)", padding: [2, 5], borderRadius: 4 } });
        el._chart.setOption({ animationDuration: 600, noAlign: true,
          title: { text: `${NM[k]}  ${x.sum >= 0 ? "+" : ""}${fmt(x.sum, 0)}억` + (x.avg == null ? "  · 평단 없음" : ""), left: 0, top: 0, textStyle: { fontSize: 13, fontWeight: 600, color: getComputedStyle(document.body).color } },
          grid: { left: 44, right: 12, top: 34, bottom: 28 },
          tooltip: { trigger: "item", formatter: p => `현재가 대비 ${fmt(p.value[1], 0)}~${fmt(p.value[2], 0)}%<br>${NM[k]} 순매수 <b>${fmt(p.value[0], 0)}억</b>` },
          xAxis: { type: "value", min: -lim, max: lim, axisLabel: { color: "#86868b", fontSize: 10, formatter: v => fmt(v, 0) }, splitLine: { lineStyle: { color: "#f0f0f2" } } },
          yAxis: { type: "value", min: lo, max: hi, axisLabel: { color: "#86868b", fontSize: 10, formatter: v => fmt(v, 0) + "%" }, splitLine: { lineStyle: { color: "#f0f0f2" } } },
          series: [{ type: "custom", renderItem: (params, api) => { const a = api.coord([0, api.value(1)]), b = api.coord([api.value(0), api.value(2)]), gap = 1.5;
              return { type: "rect", shape: { x: Math.min(a[0], b[0]), y: b[1] + gap, width: Math.abs(b[0] - a[0]), height: Math.max(0, a[1] - b[1] - gap * 2) }, style: { fill: CL[k] } }; },
            encode: { x: 0, y: [1, 2] }, data: x.bins.map((v, i) => [v, lo + i * w, lo + (i + 1) * w]), markLine: { silent: true, symbol: "none", data: ml } },
            { type: "line", data: [[0, lo], [0, hi]], symbol: "none", lineStyle: { color: "#86868b", width: 0.8 }, silent: true }] }, true); }); };
    Object.values(sfC).forEach(el => el && lazy(el, () => drawSfCost()));
    const drawSf = () => { const g = sf[si]; drawSfCost(); if (!g || !sfEl._chart) return; sfEl._chart.setOption(flowOption(g, srg), true); };
    if (sfEl && sf.length) { lazy(sfEl, () => drawSf()); sfStats(); }
    seg($("#sfSeg"), v => { si = +v; drawSf(); sfStats(); });
    seg($("#sfRange"), v => { srg = v; drawSf(); sfStats(); });
    toggleData($("#sfData"), $("#sfDataBox"), () => { const g = sf[si]; dataTable($("#sfDataBox"), ["날짜", "외국인(억)", "기관(억)", "개인(억)"], g.dates.map((x, i) => [x, g.foreign[i], g.organ[i], g.individual[i]]).reverse(), "섹터수급_" + g.group); });
    // PPI
    // 전력기기 PPI: 묶음(변압기 / 배전기기·배전반 / 전력 및 통신선) 버튼으로 바꿔 그림 (2026-10-12)
    const ppiGroups = d.ppi ? (d.ppi.groups || [d.ppi]) : []; let ppi = ppiGroups[0]; const pEl = $("#ppiChart"), pyEl = $("#ppiYoy");
    // 두 차트 같은 모양: 오른쪽 끝 값 라벨(같은 여백) + 마지막 데이터에 표식 (2026-10-12)
    // 마지막 데이터: 표식 + 값 라벨을 점 위/아래에 (위쪽 선은 위로, 아래쪽 선은 아래로) → 오른쪽 여백 없이 차트를 넓게
    const lastIdx = vals => { let i = vals.length - 1; while (i >= 0 && vals[i] == null) i--; return i; };
    const ppiOpt = (key, unit, suf) => {
      const many = ppi.series.length > 3;   // 전체 비교: 선이 많아 끝 값 라벨을 겹치지 않게 오른쪽에 (상대주가 그래프와 같은 방식)
      const o = lineOption(ppi.dates, ppi.series.map((s, k) => ({ name: s.name + (key === "yoy" ? " YoY" : ""), vals: s[key], color: PAL[k] })), { unit, suf, endLabel: many });
      if (many) { if (key === "yoy") o.series[0].markLine = { silent: true, symbol: "none", data: [{ yAxis: 0 }], lineStyle: { color: "#c7c7cc" }, label: { show: false } };
        const y0 = +String(ppi.dates[0]).slice(0, 4);
        Object.assign(o.xAxis.axisLabel, { hideOverlap: false, interval: (i, v) => /-01$/.test(v) && (+v.slice(0, 4) - y0) % 3 === 0 }); o.xAxis.axisTick = { show: false };
        o.grid.left = key === "yoy" ? 18 : 30;   // 긴 축 제목 (19.01=100) / YoY(%) 잘리지 않게
        o.series.forEach(sr => { if (sr.endLabel) sr.endLabel.formatter = p => p.value == null ? "" : fmt(p.value, key === "yoy" ? 1 : 0) + (key === "yoy" ? "%" : ""); });
        return o; }
      const lasts = ppi.series.map(s => { const i = lastIdx(s[key]); return i < 0 ? null : s[key][i]; });
      const top = Math.max(...lasts.filter(v => v != null));
      // BLS 미공표 기간이 길면(3개월 이상, 예: 터빈 2016.10~2017.12) 선을 끊고, 한두 달 빈 곳은 이어서 그림
      o.series.forEach((sr, k) => { const v = ppi.series[k][key]; let run = 0, mx = 0, seen = false;
        v.forEach(x => { if (x == null) { if (seen) run++; } else { seen = true; mx = Math.max(mx, run); run = 0; } });
        sr.connectNulls = mx < 3; });
      o.series.forEach((sr, k) => { const vals = ppi.series[k][key], i = lastIdx(vals); if (i < 0) return;
        const up = lasts[k] === top;
        sr.markPoint = { silent: true, z: 20, animation: false, data: [{ coord: [i, vals[i]], value: vals[i], symbol: "circle", symbolSize: 9,
          itemStyle: { color: "#fff", borderColor: PAL[k], borderWidth: 2.5 },
          label: { show: true, position: up ? "top" : "bottom", distance: 6, color: PAL[k], fontSize: 11, fontWeight: 600,
                   backgroundColor: "rgba(255,255,255,.9)", padding: [1, 3], borderRadius: 3,
                   formatter: () => key === "yoy" ? fmt(vals[i], 1) + "%" : fmt(vals[i], ppi.dec || 0) } }] };
        if (key === "yoy" && !k) sr.markLine = { silent: true, symbol: "none", data: [{ yAxis: 0 }], lineStyle: { color: "#c7c7cc" }, label: { show: false } }; });
      // 두 차트 x축 눈금 통일: 3년마다 1월에만 표시
     const y0 = +String(ppi.dates[0]).slice(0, 4);
     Object.assign(o.xAxis.axisLabel, { hideOverlap: false, interval: (i, v) => /-01$/.test(v) && (+v.slice(0, 4) - y0) % 3 === 0 });
     o.xAxis.axisTick = { show: false };
     o.grid.right = key === "yoy" ? 30 : 22; if (key === "yoy") o.grid.left = 18;
     if (key === "vals" && ppi.dec) { o.grid.left = 30; o.tooltip = Object.assign({}, o.tooltip, { valueFormatter: v => v == null ? "-" : fmt(v, ppi.dec) }); }   // 전기료(US$/kWh): 소수 3자리, 긴 단위 제목
     return o; };   // 왼쪽: Y축 제목 'YoY(%)' 이 숫자 열(예: 15)보다 넓어 잘리지 않게   // YoY 라벨(예: 13.3%)이 오른쪽에서 잘리지 않게
    const drawPpi = () => { if (!ppi) return; const t = $("#ppiTitle"); if (t) t.textContent = ppi.title || "미국 " + ppi.name + " PPI"; const t2 = $("#ppiYoyTitle"); if (t2) t2.textContent = ppi.title ? "전년 대비" : "PPI 전년 대비";
      if (pEl && pEl._chart) pEl._chart.setOption(ppiOpt("vals", ppi.unit || "(지수)", ""), true);
      if (pyEl && pyEl._chart) pyEl._chart.setOption(ppiOpt("yoy", "YoY(%)", "%"), true); };
    if (ppi && pEl) lazy(pEl, c => c.setOption(ppiOpt("vals", ppi.unit || "(지수)", "")));
    if (ppi && pyEl) lazy(pyEl, c => c.setOption(ppiOpt("yoy", "YoY(%)", "%")));
    seg($("#ppiSeg"), v => { ppi = ppiGroups[+v] || ppiGroups[0]; drawPpi(); });
    if (ppi) { const t = $("#ppiTitle"), t2 = $("#ppiYoyTitle"); if (t) t.textContent = ppi.title || "미국 " + ppi.name + " PPI"; if (t2) t2.textContent = ppi.title ? "전년 대비" : "PPI 전년 대비"; }   // 첫 화면 제목
    // 무역: 변압기 / 배전반 (2026-10-13) 같은 그림 — 국가별 쌓은 막대 + 비중 선(R)
    const PXSRC = { us_transformer_trade: "us", eu_transformer_trade: "eu", kr_transformer_trade: "kr", cn_transformer_trade: "cn" };
    const PXNOTE = { us: "해상·항공 운송분 기준 (육로 수입은 무게 자료 없음)", eu: "역외 수입 · 유로 기준", kr: "", cn: "무게(제2수량 kg) 기준" };
    const tradeChart = (tr, ids, hs0, tk0) => {
      let tk = tk0 && tr[tk0] ? tk0 : (Object.keys(tr).find(k => tr[k]) || Object.keys(tr)[0]), hs = hs0, per = "월간", rng = 5;   // 기간: 5년 / 10년 / 전체(0) — 처음엔 5년 (사용자 지정)
      let shownDates = [];   // 막대 그래프에 보이는 기간 → 단가 그래프도 같은 축
      const tEl = $(ids.chart); if (!tEl) return;
      const pEl = $(ids.chart.replace("Chart", "Px"));
      const drawPx = () => { if (!pEl || !pEl._chart) return; const src = PXSRC[tk] || tk, P = ((d.trade_px || {})[src] || {})[hs], x = P && P[per];
        const tt = $(ids.chart.replace("Chart", "PxTitle")), nt = $(ids.chart.replace("Chart", "PxNote"));
        if (!x || !x.series.some(s => s.vals.some(v => v != null))) { pEl._chart.clear(); if (tt) tt.textContent = "단가"; if (nt) nt.textContent = "단가 자료 준비 중"; return; }
        // 막대 그래프와 같은 날짜축 (연간 진행 중인 해는 'YYYY (1~N월)' 표기가 달라도 연도로 맞춤)
        const key = v => per === "연간" ? String(v).slice(0, 4) : v;
        const pos = new Map(x.dates.map((v, i) => [key(v), i]));
        const X = shownDates.length ? { dates: shownDates, series: x.series.map(s => ({ name: s.name, vals: shownDates.map(dd => { const i = pos.get(key(dd)); return i == null ? null : s.vals[i]; }) })) } : x;
        const s0 = 0;
        if (tt) tt.textContent = `단가 (${x.unit}) · ${x.series.map(s => s.name).join(" vs ")}`;
        if (nt) nt.textContent = "";   // 설명 문구 뺌 (사용자 지정 2026-10-13)
        const o = lineOption(X.dates, X.series.map((s, k) => ({ name: s.name, vals: s.vals, color: ["#1d1d1f", "#ff375f"][k] })), { unit: `(${x.unit})`, endLabel: true });
        o.series.forEach(sr => { sr.connectNulls = true; if (sr.endLabel) sr.endLabel.formatter = p => p.value == null ? "" : fmt(p.value, 1); });
        // Y축 최대값은 글로벌 선 기준 (사용자 지정 2026-10-13): 미국향·한국산은 물량이 적은 달에 튀어서, 튀는 값은 축 밖으로 잘림
        const gv = X.series[0].vals.filter(v => v != null);
        if (gv.length && x.series.length > 1) { const m = Math.max(...gv) * 1.2, st = niceStep(m, 5);
          (Array.isArray(o.yAxis) ? o.yAxis[0] : o.yAxis).max = Math.ceil(m / st - 1e-9) * st; }
        o.grid.left = 26;   // 축 제목 (US$/kg) 이 잘리지 않게
        pEl._chart.setOption(o, true); };
      if (pEl) lazy(pEl, () => drawPx());
      const curT = () => (tr[tk] || {})[hs + "_" + per];
      const drawTr = () => { const t = curT(); if (!tEl._chart) return; if (!t) { tEl._chart.clear(); $(ids.note).textContent = tr[tk] ? "이 자료(나라 통계)에는 해당 품목의 세분 코드가 없습니다" : "자료 준비 중"; return; }
        const named = t.series.filter(s => s.name !== "합계"); const tot = t.series.find(s => s.name === "합계");
        let s0 = rng ? Math.max(0, t.dates.length - (per === "월간" ? rng * 12 : rng)) : 0;   // 기간 버튼 (2026-10-13)
        shownDates = t.dates.slice(s0);
        tEl._chart.setOption(base({ tooltip: Object.assign(base().tooltip, { axisPointer: { type: "shadow" }, valueFormatter: v => v == null ? "-" : fmt(v, 1) }),
          legend: Object.assign(base().legend, { type: "scroll", right: 0, data: named.map(s => s.name).concat((t.shares || []).map(sh => sh.name + " 비중(R)")) }),
          xAxis: xCat(t.dates.slice(s0)), yAxis: [yVal({ name: "(" + t.unit + ")" }), yVal({ name: "(%)", show: !!(t.shares && t.shares.length), splitLine: { show: false } })],
          series: [...named.map((s, k) => ({ name: s.name, type: "bar", stack: "a", data: s.vals.slice(s0), barMaxWidth: 24, itemStyle: { color: s.name === "기타" ? "#d2d2d7" : PAL[k % PAL.length] }, emphasis: { focus: "series" } })),
            ...(t.shares || []).map((sh, k) => ({ name: sh.name + " 비중(R)", type: "line", yAxisIndex: 1, data: sh.vals.slice(s0), showSymbol: t.dates.length - s0 <= 120 /* 기간이 길면 표식 없이 선만 */, showAllSymbol: true, symbol: "circle", symbolSize: 5, smooth: 0.2,
              lineStyle: { width: 2.5, color: ["#1d1d1f", "#ff375f"][k] }, itemStyle: { color: "#fff", borderColor: ["#1d1d1f", "#ff375f"][k], borderWidth: 2 }, z: 10 })),
            tot ? { name: "합계", type: "line", data: tot.vals.slice(s0), symbol: "none", lineStyle: { opacity: 0 }, itemStyle: { opacity: 0 }, label: { show: per === "연간", position: "top", fontSize: 10, formatter: p => fmt(p.value, 0) } } : null].filter(Boolean) }), true);
        $(ids.note).textContent = `${t.hs_name} · ${t.flow}금액`; drawPx(); };
      lazy(tEl, () => drawTr());
      seg($(ids.src), v => { tk = v; drawTr(); });
      seg($(ids.hs), v => { hs = v; drawTr(); });
      seg($(ids.per), v => { per = v; drawTr(); });
      seg($(ids.per.replace("Per", "Rng")), v => { rng = +v; drawTr(); });
    };
    tradeChart(d.trade || {}, { chart: "#trChart", note: "#trNote", src: "#trSeg", hs: "#trHs", per: "#trPer" }, "850423");
    tradeChart(d.sw_trade || {}, { chart: "#swChart", note: "#swNote", src: "#swSeg", hs: "#swHs", per: "#swPer" }, "853710");
    tradeChart(d.sw_trade || {}, { chart: "#cbChart", note: "#cbNote", src: "#cbSeg", hs: "#cbHs", per: "#cbPer" }, "853529");
    seg($("#trProd"), v => { $("#trCard").hidden = v !== "tr"; $("#swCard").hidden = v !== "sw"; $("#cbCard").hidden = v !== "cb";   // 무역: 제품(변압기/배전반) 고르기
      setTimeout(() => window.dispatchEvent(new Event("resize")), 30); });
    lightbox();
  };
  P.reports = d => {   // 필터: 전체/기업/산업/섹터 + 주소 #c=<기업> 로 기업 하나만 (상단 리포트 드롭다운)
    const q = $("#rq"); let kind = "all", code = null;
    const names = Object.fromEntries((window.PAGE.codes || []).map(x => [x.slug, x.name]));
    const apply = () => { const s = (q.value || "").trim().toLowerCase();
      $$(".item[data-kind]").forEach(it => { const ok = (code ? it.dataset.code === code : (kind === "all" || it.dataset.kind === kind || it.dataset.sector === kind)) && (!s || it.textContent.toLowerCase().includes(s)); it.style.display = ok ? "" : "none"; });
      $$(".month").forEach(m => { m.style.display = $$(".item", m).some(i => i.style.display !== "none") ? "" : "none"; });
      const f = $("#rFilter"); if (code) { f.hidden = false; f.innerHTML = `${names[code] || code} 리포트만 보는 중 · <a href="#all">전체 보기</a>`; } else f.hidden = true; };
    q.addEventListener("input", apply);
    const sg = seg($("#rSeg"), v => { kind = v; code = null; apply(); });
    const fromHash = () => { const h = decodeURIComponent(location.hash.slice(1)); if (!h) return;
      if (h.startsWith("c=")) { code = h.slice(2); apply(); } else { code = null; if (sg) sg.set(h); kind = h; apply(); } window.scrollTo({ top: 0, behavior: "smooth" }); };
    window.addEventListener("hashchange", fromHash); setTimeout(fromHash, 60);
  };
  P.news = d => {   // 필터: 전체/섹터 + 주소 #c=<기업> (기업 페이지와 같은 뉴스: 지정 기사 + 섹터 뉴스)
    const q = $("#nq"); let sec = "all", code = null;
    const apply = () => { const s = (q.value || "").trim().toLowerCase(); const set = code && d.comp[code] ? new Set(d.comp[code].links) : null;
      $$(".item[data-sec]").forEach(it => { const ok = (set ? set.has(it.dataset.link) : (sec === "all" || it.dataset.sec === sec)) && (!s || it.textContent.toLowerCase().includes(s)); it.style.display = ok ? "" : "none"; });
      const f = $("#nFilter"); if (set) { f.hidden = false; f.innerHTML = `${d.comp[code].name} 뉴스만 보는 중 · <a href="#all">전체 보기</a>`; } else f.hidden = true; };
    q.addEventListener("input", apply);
    const sg = seg($("#nSeg"), v => { sec = v; code = null; apply(); });
    const fromHash = () => { const h = decodeURIComponent(location.hash.slice(1)); if (!h) return;
      if (h.startsWith("c=")) { code = h.slice(2); apply(); } else { code = null; sec = h; if (sg) sg.set(h); apply(); } window.scrollTo({ top: 0, behavior: "smooth" }); };
    window.addEventListener("hashchange", fromHash); setTimeout(fromHash, 60);
  };

  document.addEventListener("DOMContentLoaded", () => {
    nav(); dropdown(); reveal(); countUp(); rails();
    const page = document.body.dataset.page;
    if (P[page]) P[page](DATA);
  });
})();

// 장중 주가 (2026-10-12): assets/live.json (live_prices.py 가 10분마다 갱신) 을 읽어 현재가·등락률·상승여력을 바꿔 그림
(() => {
  const src = (document.currentScript || {}).src || "";
  const base = src.replace(/app\.js.*$/, "");
  fetch(base + "live.json?t=" + Date.now(), { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(L => {
    if (!L || !L.q) return;
    window.__live = L; document.dispatchEvent(new Event("live"));
    const money = (v, ccy) => ccy === "USD" ? "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(v).toLocaleString("ko-KR") + "원";
    const fp = (v, d = 1) => v == null ? "-" : (v > 0 ? "+" : "") + v.toFixed(d) + "%";
    const cls = (el, v) => { el.classList.remove("up", "down"); if (v > 0) el.classList.add("up"); else if (v < 0) el.classList.add("down"); };
    const label = q => q.s === "US" ? q.t.slice(5, 10).replace("-", "/") + " (미국)" : (q.s === "NXT" ? "NXT " : "") + q.t.slice(5).replace("-", "/");
    document.querySelectorAll("[data-lv]").forEach(el => {
      const host = el.closest("[data-code]"); if (!host) return;
      const q = L.q[host.dataset.code]; if (!q || !q.p) return;
      switch (el.dataset.lv) {
        case "px": el.textContent = money(q.p, el.dataset.ccy); if ("v" in el.dataset) el.dataset.v = q.p; break;
        case "chg": el.textContent = fp(q.c, 2); cls(el, q.c); break;
        case "at": el.textContent = "현재가 " + label(q); break;
        case "atchg": el.textContent = label(q) + " " + fp(q.c, 2); cls(el, q.c); break;
        case "up": { const tp = +el.dataset.tp; if (tp) { const u = (tp / q.p - 1) * 100; el.textContent = fp(u); cls(el, u); if ("v" in el.dataset) el.dataset.v = u.toFixed(1); } break; }
      }
    });
  }).catch(() => {});
})();
