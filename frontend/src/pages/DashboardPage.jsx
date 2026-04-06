import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import BourseDrawer from '../components/Boursedrawer';

/* ═══════════════════════════════════════════════════════════════════════════
   ISO MAPPINGS + COUNTRY META
═══════════════════════════════════════════════════════════════════════════ */
const NUMERIC_TO_ALPHA2 = {
  '4':'AF','8':'AL','12':'DZ','24':'AO','32':'AR','36':'AU','40':'AT','50':'BD',
  '56':'BE','68':'BO','76':'BR','100':'BG','120':'CM','124':'CA','152':'CL',
  '156':'CN','170':'CO','178':'CG','188':'CR','192':'CU','196':'CY','203':'CZ',
  '208':'DK','214':'DO','218':'EC','818':'EG','222':'SV','231':'ET',
  '246':'FI','250':'FR','266':'GA','276':'DE','288':'GH','300':'GR','320':'GT',
  '332':'HT','340':'HN','348':'HU','356':'IN','360':'ID','364':'IR','368':'IQ',
  '372':'IE','376':'IL','380':'IT','388':'JM','392':'JP','400':'JO','404':'KE',
  '410':'KR','408':'KP','414':'KW','422':'LB','430':'LR','434':'LY','484':'MX',
  '504':'MA','516':'NA','524':'NP','528':'NL','554':'NZ','558':'NI','566':'NG',
  '578':'NO','586':'PK','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH',
  '616':'PL','620':'PT','634':'QA','642':'RO','643':'RU','682':'SA',
  '694':'SL','706':'SO','710':'ZA','724':'ES','729':'SD','752':'SE',
  '756':'CH','760':'SY','764':'TH','788':'TN','792':'TR','800':'UG','804':'UA',
  '784':'AE','826':'GB','840':'US','858':'UY','862':'VE','704':'VN','887':'YE',
  '894':'ZM','716':'ZW','426':'LS','450':'MG','454':'MW','508':'MZ','646':'RW',
  '191':'HR','703':'SK','705':'SI','807':'MK','688':'RS','70':'BA','499':'ME',
  '44':'BS','48':'BH','64':'BT','90':'SB','108':'BI','116':'KH',
  '140':'CF','148':'TD','174':'KM','180':'CD','232':'ER','242':'FJ','270':'GM',
  '324':'GN','328':'GY','336':'VA','352':'IS','417':'KG','418':'LA',
  '428':'LV','440':'LT','442':'LU','462':'MV','466':'ML','470':'MT','478':'MR',
  '496':'MN','540':'NC','548':'VU','562':'NE',
  '624':'GW','626':'TL','662':'LC','670':'VC','678':'ST','690':'SC',
  '740':'SR','776':'TO','780':'TT','798':'TV',
  '882':'WS',
};

const ALPHA2_TO_NUMERIC = Object.fromEntries(
  Object.entries(NUMERIC_TO_ALPHA2).map(([num, a2]) => [a2, num])
);

const COUNTRY_META = {
  FR:{ label:'France',            flag:'🇫🇷' },
  DE:{ label:'Allemagne',         flag:'🇩🇪' },
  GB:{ label:'Royaume-Uni',       flag:'🇬🇧' },
  US:{ label:'États-Unis',        flag:'🇺🇸' },
  CA:{ label:'Canada',            flag:'🇨🇦' },
  AU:{ label:'Australie',         flag:'🇦🇺' },
  JP:{ label:'Japon',             flag:'🇯🇵' },
  CN:{ label:'Chine',             flag:'🇨🇳' },
  KR:{ label:'Corée du Sud',      flag:'🇰🇷' },
  TR:{ label:'Turquie',           flag:'🇹🇷' },
  SA:{ label:'Arabie Saoudite',   flag:'🇸🇦' },
  MA:{ label:'Maroc',             flag:'🇲🇦' },
  TN:{ label:'Tunisie',           flag:'🇹🇳' },
  IN:{ label:'Inde',              flag:'🇮🇳' },
  BR:{ label:'Brésil',            flag:'🇧🇷' },
  ZA:{ label:'Afrique du Sud',    flag:'🇿🇦' },
  NG:{ label:'Nigéria',           flag:'🇳🇬' },
  EG:{ label:'Égypte',            flag:'🇪🇬' },
  BE:{ label:'Belgique',          flag:'🇧🇪' },
  NL:{ label:'Pays-Bas',          flag:'🇳🇱' },
  CH:{ label:'Suisse',            flag:'🇨🇭' },
  SE:{ label:'Suède',             flag:'🇸🇪' },
  NO:{ label:'Norvège',           flag:'🇳🇴' },
  HU:{ label:'Hongrie',           flag:'🇭🇺' },
  PL:{ label:'Pologne',           flag:'🇵🇱' },
  IT:{ label:'Italie',            flag:'🇮🇹' },
  ES:{ label:'Espagne',           flag:'🇪🇸' },
  RU:{ label:'Russie',            flag:'🇷🇺' },
  MX:{ label:'Mexique',           flag:'🇲🇽' },
  NZ:{ label:'Nouvelle-Zélande',  flag:'🇳🇿' },
  PT:{ label:'Portugal',          flag:'🇵🇹' },
  AT:{ label:'Autriche',          flag:'🇦🇹' },
  FI:{ label:'Finlande',          flag:'🇫🇮' },
  DK:{ label:'Danemark',          flag:'🇩🇰' },
  IE:{ label:'Irlande',           flag:'🇮🇪' },
  GR:{ label:'Grèce',             flag:'🇬🇷' },
  CZ:{ label:'Tchéquie',          flag:'🇨🇿' },
  RO:{ label:'Roumanie',          flag:'🇷🇴' },
  UA:{ label:'Ukraine',           flag:'🇺🇦' },
  AE:{ label:'Émirats arabes unis',flag:'🇦🇪' },
  QA:{ label:'Qatar',             flag:'🇶🇦' },
  KE:{ label:'Kenya',             flag:'🇰🇪' },
  GH:{ label:'Ghana',             flag:'🇬🇭' },
  PK:{ label:'Pakistan',          flag:'🇵🇰' },
  ID:{ label:'Indonésie',         flag:'🇮🇩' },
  MY:{ label:'Malaisie',          flag:'🇲🇾' },
  TH:{ label:'Thaïlande',         flag:'🇹🇭' },
  VN:{ label:'Vietnam',           flag:'🇻🇳' },
  AR:{ label:'Argentine',         flag:'🇦🇷' },
  CL:{ label:'Chili',             flag:'🇨🇱' },
  CO:{ label:'Colombie',          flag:'🇨🇴' },
  PE:{ label:'Pérou',             flag:'🇵🇪' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITAIRE DAYS LEFT
═══════════════════════════════════════════════════════════════════════════ */
function daysLeft(deadline) {
  const diff = Math.round((new Date(deadline) - new Date()) / 86400000);
  if (diff < 0)   return { label: 'Expiré', color: '#dc2626' };
  if (diff <= 7)  return { label: `${diff}j`,  color: '#d97706' };
  if (diff <= 30) return { label: `${diff}j`,  color: '#2563eb' };
  return { label: `${diff}j`, color: '#166534' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   WORLD MAP — vraie carte D3 + TopoJSON projection Mercator
═══════════════════════════════════════════════════════════════════════════ */
function WorldMap({ onCountryClick, activeCountry, scholarshipCounts = {} }) {
  const containerRef    = useRef(null);
  const svgRef          = useRef(null);
  const activeCountryRef= useRef(activeCountry);
  const [tooltip, setTooltip] = useState(null);
  const [ready,   setReady  ] = useState(false);

  const normCounts = {};
  Object.entries(scholarshipCounts).forEach(([k, v]) => {
    if (/^\d+$/.test(k)) { normCounts[k] = v; }
    else {
      const num = ALPHA2_TO_NUMERIC[k.toUpperCase()];
      if (num) normCounts[num] = v;
    }
  });

  const getAlpha2     = (id) => NUMERIC_TO_ALPHA2[String(id)] || null;
  const getCount      = (id) => normCounts[String(id)] || 0;
  const colorForCount = (n)  =>
    n === 0 ? '#1e2a3a' :
    n >= 10 ? '#1a3a6b' :
    n >= 7  ? '#2563eb' :
    n >= 4  ? '#3b82f6' : '#93c5fd';
  const strokeForCount = (n, isActive) =>
    isActive ? '#f5a623' :
    n > 0    ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)';

  useEffect(() => {
    let cancelled = false;

    const loadScripts = () => new Promise((resolve) => {
      if (window.__d3loaded && window.__topojsonloaded) { resolve(); return; }
      const s1 = document.createElement('script');
      s1.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
      s1.onload = () => {
        window.__d3loaded = true;
        const s2 = document.createElement('script');
        s2.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
        s2.onload = () => { window.__topojsonloaded = true; resolve(); };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s1);
    });

    const draw = async () => {
      await loadScripts();
      if (cancelled || !svgRef.current || !containerRef.current) return;

      const d3       = window.d3;
      const topojson = window.topojson;

      const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      if (cancelled || !svgRef.current) return;

      const W = containerRef.current.getBoundingClientRect().width || 800;
      const H = Math.round(W * 0.52);

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', H);

      const proj = d3.geoMercator()
        .scale(W / 6.4)
        .translate([W / 2, H / 1.58]);

      const pathGen  = d3.geoPath().projection(proj);
      const features = topojson.feature(world, world.objects.countries).features;

      svg.selectAll('path.country')
        .data(features)
        .join('path')
        .attr('class', 'country')
        .attr('d', pathGen)
        .attr('data-id', d => d.id)
        .attr('fill',         d => colorForCount(getCount(d.id)))
        .attr('stroke',       d => strokeForCount(getCount(d.id), false))
        .attr('stroke-width', 0.5)
        .style('cursor',     d => getCount(d.id) > 0 ? 'pointer' : 'default')
        .style('transition', 'fill 0.18s, stroke-width 0.18s')
        .on('mouseenter', function(event, d) {
          const a2 = getAlpha2(d.id);
          const n  = getCount(d.id);
          if (!n) return;
          d3.select(this)
            .attr('fill', '#f5a623')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);
          const [mx, my] = d3.pointer(event, svgRef.current);
          setTooltip({ x: mx, y: my, code: a2, count: n });
        })
        .on('mouseleave', function(event, d) {
          const a2     = getAlpha2(d.id);
          const n      = getCount(d.id);
          const isAct  = a2 === activeCountryRef.current;
          d3.select(this)
            .attr('fill',         isAct ? '#f5a623' : colorForCount(n))
            .attr('stroke',       strokeForCount(n, isAct))
            .attr('stroke-width', isAct ? 1.5 : 0.5);
          setTooltip(null);
        })
        .on('click', function(event, d) {
          const a2 = getAlpha2(d.id);
          if (a2 && getCount(d.id) > 0) onCountryClick(a2);
        });

      svg.append('path')
        .datum(d3.geoGraticule()())
        .attr('d', pathGen)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.035)')
        .attr('stroke-width', 0.5);

      const tuniXY = proj([9.5375, 33.8869]);
      if (tuniXY) {
        const g = svg.append('g');
        const pulseCircle = g.append('circle')
          .attr('cx', tuniXY[0]).attr('cy', tuniXY[1])
          .attr('r', 5).attr('fill', 'none')
          .attr('stroke', '#f43f5e').attr('stroke-width', 1.5);
        pulseCircle.append('animate')
          .attr('attributeName', 'r').attr('from', '4').attr('to', '16')
          .attr('dur', '2s').attr('repeatCount', 'indefinite');
        pulseCircle.append('animate')
          .attr('attributeName', 'opacity').attr('from', '0.8').attr('to', '0')
          .attr('dur', '2s').attr('repeatCount', 'indefinite');
        g.append('circle')
          .attr('cx', tuniXY[0]).attr('cy', tuniXY[1])
          .attr('r', 4).attr('fill', '#f43f5e')
          .attr('stroke', '#fff').attr('stroke-width', 1.5);
        g.append('text')
          .attr('x', tuniXY[0] + 7).attr('y', tuniXY[1] + 3.5)
          .attr('font-size', 8.5).attr('font-weight', 700)
          .attr('fill', '#f43f5e').attr('font-family', 'system-ui')
          .text('Tunisie');
      }

      const lg = svg.append('g').attr('transform', `translate(10,${H - 32})`);
      lg.append('rect')
        .attr('width', 148).attr('height', 28).attr('rx', 5)
        .attr('fill', 'rgba(8,16,32,0.88)')
        .attr('stroke', 'rgba(245,166,35,0.3)').attr('stroke-width', 0.7);
      lg.append('text')
        .attr('x', 8).attr('y', 10).attr('font-size', 7).attr('font-weight', 600)
        .attr('fill', 'rgba(245,166,35,0.8)').attr('font-family', 'system-ui')
        .text('Intensité des bourses');
      const legColors = ['#93c5fd','#3b82f6','#2563eb','#1a3a6b'];
      const legLabels = ['1-3','4-6','7-9','10+'];
      legColors.forEach((c, i) => {
        lg.append('rect')
          .attr('x', 8 + i * 34).attr('y', 15).attr('width', 20).attr('height', 7)
          .attr('rx', 2).attr('fill', c);
        lg.append('text')
          .attr('x', 18 + i * 34).attr('y', 15).attr('text-anchor', 'middle')
          .attr('font-size', 6).attr('fill', 'rgba(255,255,255,0.4)')
          .attr('font-family', 'system-ui').attr('dy', 20)
          .text(legLabels[i]);
      });

      if (!cancelled) setReady(true);
    };

    draw().catch(console.error);
    return () => { cancelled = true; };
  }, [JSON.stringify(normCounts)]);

  useEffect(() => {
    activeCountryRef.current = activeCountry;
    if (!svgRef.current || !window.d3) return;
    svgRef.current.querySelectorAll('path.country').forEach(el => {
      const numId = el.getAttribute('data-id');
      const a2    = NUMERIC_TO_ALPHA2[numId] || null;
      const n     = normCounts[numId] || 0;
      const isAct = a2 === activeCountry;
      window.d3.select(el)
        .attr('fill',         isAct ? '#f5a623' : colorForCount(n))
        .attr('stroke',       strokeForCount(n, isAct))
        .attr('stroke-width', isAct ? 1.5 : 0.5);
    });
  }, [activeCountry]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, #050e1c 0%, #0b1e3d 55%, #08172e 100%)',
        zIndex: 0,
      }}/>

      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(245,166,35,0.15)',
            borderTopColor: '#f5a623',
            animation: 'spin 0.8s linear infinite',
          }}/>
          <span style={{ fontSize: 11, color: 'rgba(245,166,35,0.6)', letterSpacing: '0.06em', fontFamily: 'system-ui' }}>
            Chargement de la carte…
          </span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      <svg
        ref={svgRef}
        style={{
          position: 'relative', zIndex: 1, display: 'block', width: '100%',
          border: '1px solid rgba(245,166,35,0.15)',
          borderRadius: 8,
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.5s ease',
          minHeight: 220,
        }}
      />

      {tooltip && COUNTRY_META[tooltip.code] && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x + 14, (containerRef.current?.offsetWidth || 500) - 150),
          top:  Math.max(tooltip.y - 48, 8),
          background: '#060f1e',
          border: '1px solid rgba(245,166,35,0.55)',
          borderRadius: 7,
          padding: '7px 11px',
          pointerEvents: 'none',
          zIndex: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f5a623', whiteSpace: 'nowrap', fontFamily: 'system-ui' }}>
            {COUNTRY_META[tooltip.code].flag}&nbsp;{COUNTRY_META[tooltip.code].label}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontFamily: 'system-ui' }}>
            {tooltip.count} bourse{tooltip.count > 1 ? 's' : ''} disponible{tooltip.count > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CALENDRIER DES DEADLINES
═══════════════════════════════════════════════════════════════════════════ */
function Calendrier({ deadlines, onSelectBourse }) {
  const today = new Date();
  const [view, setView] = useState({ month: today.getMonth(), year: today.getFullYear() });

  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août',
                  'Septembre','Octobre','Novembre','Décembre'];
  const DAYS   = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

  const deadlineMap = {};
  deadlines.forEach(b => {
    if (!b.deadline) return;
    const d = new Date(b.deadline);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!deadlineMap[k]) deadlineMap[k] = [];
    deadlineMap[k].push(b);
  });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay    = (new Date(view.year, view.month, 1).getDay() + 6) % 7;

  const computeColor = (item) => {
    if (item?.inRoadmap) return '#7c3aed';
    if (item?.isFavori)  return '#f5a623';
    return '#2563eb';
  };

  const diffColor = (diff) =>
    diff < 0   ? '#dc2626' :
    diff <= 7  ? '#d97706' :
    diff <= 30 ? '#2563eb' : '#166534';

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setView(v => ({
    month: v.month === 0 ? 11 : v.month - 1,
    year:  v.month === 0 ? v.year - 1 : v.year,
  }));
  const next = () => setView(v => ({
    month: v.month === 11 ? 0 : v.month + 1,
    year:  v.month === 11 ? v.year + 1 : v.year,
  }));

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setView(v => ({ ...v, year: v.year - 1 }))} style={S.iconBtn}>«</button>
          <button onClick={prev} style={S.navBtn}>‹</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <select
            value={view.month}
            onChange={e => setView(v => ({ ...v, month: parseInt(e.target.value, 10) }))}
            style={{ fontSize:13, padding:'6px 10px', borderRadius:6, border:'1px solid #e6eef8', background:'#fff', color:'#0f1724', minWidth:140 }}>
            {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
          </select>
          <input
            type="number"
            value={view.year}
            onChange={e => setView(v => ({ ...v, year: parseInt(e.target.value || 0, 10) }))}
            style={{ width:84, fontSize:13, padding:'6px 8px', borderRadius:6, border:'1px solid #e6eef8', background:'#fff' }}
          />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={next} style={S.navBtn}>›</button>
          <button onClick={() => setView(v => ({ ...v, year: v.year + 1 }))} style={S.iconBtn}>»</button>
          <button
            onClick={() => setView({ month: today.getMonth(), year: today.getFullYear() })}
            style={{ ...S.btnXs, padding:'6px 10px' }}
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:9, color:'#94a3b8', fontWeight:700, padding:'2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`}/>;
          const isToday = (
            day === today.getDate() &&
            view.month === today.getMonth() &&
            view.year  === today.getFullYear()
          );
          const k    = `${view.year}-${view.month}-${day}`;
          const dl   = deadlineMap[k];
          const diff = dl ? Math.round((new Date(view.year, view.month, day) - today) / 86400000) : null;
          const col  = diff !== null ? diffColor(diff) : null;

          return (
            <div
              key={k}
              title={dl ? dl.map(b => b.nom).join(', ') : undefined}
              onClick={() => { if (dl?.[0] && onSelectBourse) onSelectBourse(dl[0]); }}
              style={{
                aspectRatio: '1',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-start',
                borderRadius: 6, fontSize: 10, position: 'relative',
                transition: 'all 0.15s',
                background: isToday ? '#1a3a6b' : dl ? `${col}14` : 'transparent',
                border: isToday
                  ? '2px solid #f5a623'
                  : dl
                  ? `1px solid ${col}50`
                  : '1px solid #f1f5f9',
                color: isToday ? '#fff' : dl ? col : '#94a3b8',
                cursor: dl ? 'pointer' : 'default',
                fontWeight: (isToday || dl) ? 700 : 400,
                padding: '3px 2px',
                overflow: 'hidden',
              }}
            >
              <span style={{ flexShrink: 0 }}>{day}</span>
              {dl && (
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  marginTop: 2,
                  overflowY: 'auto',
                  maxHeight: 'calc(100% - 16px)',
                }}>
                  {dl.map((item, idx) => {
                    const c = computeColor(item);
                    return (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); if (onSelectBourse) onSelectBourse(item); }}
                        title={item.nom}
                        style={{
                          display: 'block',
                          width: '100%',
                          boxSizing: 'border-box',
                          textAlign: 'left',
                          fontSize: 9,
                          padding: '2px 4px',
                          borderRadius: 4,
                          background: c + '18',
                          border: `1px solid ${c}44`,
                          color: c,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.nom}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display:'flex', gap:12, marginTop:12, flexWrap:'wrap' }}>
        {[['#dc2626','Expiré'],['#d97706','≤ 7 jours'],['#2563eb','≤ 30 jours'],['#166534','Planifiée']].map(([c, l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:9, height:9, borderRadius:2, background:c, flexShrink:0 }}/>
            <span style={{ fontSize:10, color:'#64748b' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage({ user, bourses, entretienScores, setView, handleQuickReply, onOpenBourse }) {
  const [roadmap,       setRoadmap      ] = useState([]);
  const [loading,       setLoading      ] = useState(true);
  const [activeCountry, setActiveCountry] = useState(null);
  const [favorites,     setFavorites    ] = useState([]);
  const [drawerBourse,  setDrawerBourse ] = useState(null);
  const [appliedNoms,   setAppliedNoms  ] = useState(new Set());
  const [starredNoms,   setStarredNoms  ] = useState(new Set());

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    axiosInstance.get(API_ROUTES.roadmap.byUser(user.id))
      .then(r => {
        const docs = r.data.docs || [];
        setRoadmap(docs);
        setAppliedNoms(new Set(docs.map(b => b.nom?.trim().toLowerCase())));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    axiosInstance.get(API_ROUTES.favoris.byUser(user.id))
      .then(r => {
        const doc  = (r.data && r.data.docs && r.data.docs[0]) || r.data;
        const favs = doc && doc.bourses ? doc.bourses : [];
        setFavorites(favs);
        setStarredNoms(new Set(favs.map(b => b.nom?.trim().toLowerCase())));
      })
      .catch(() => {});
  }, [user?.id]);

  const scholarshipCounts = {};
  (bourses || []).forEach(b => {
    if (!b.pays) return;
    const code = Object.entries(COUNTRY_META).find(([, m]) => m.label === b.pays)?.[0];
    if (code) scholarshipCounts[code] = (scholarshipCounts[code] || 0) + 1;
  });

  const roadmapSet   = new Set((roadmap   || []).map(b => b.nom?.trim().toLowerCase()));
  const favoritesSet = new Set((favorites || []).map(b => b.nom?.trim().toLowerCase()));

  const deadlines = (bourses || [])
    .filter(b => b.dateLimite)
    .map(b => ({
      nom:      b.nom,
      deadline: new Date(b.dateLimite),
      pays:     b.pays,
      isFavori: favoritesSet.has(b.nom?.trim().toLowerCase()),
      inRoadmap:roadmapSet.has(b.nom?.trim().toLowerCase()),
    }))
    .sort((a, b) => a.deadline - b.deadline);

  const roadmapDeadlines = deadlines.filter(d => d.inRoadmap);

  const parseScore = txt => {
    const m = (txt || '').match(/SCORE\s*GLOBAL\s*[:\-]\s*(\d+)/i);
    return m ? parseInt(m[1]) : null;
  };
  const scores    = (entretienScores || []).map(s => ({ ...s, scoreNum: parseScore(s.score) })).filter(s => s.scoreNum !== null);
  const lastScore = scores[0]?.scoreNum ?? null;
  const avgScore  = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b.scoreNum, 0) / scores.length) : null;
  const scoreDiff = scores.length >= 2 ? scores[0].scoreNum - scores[1].scoreNum : null;

  const PROFILE_FIELDS = [
    { field: 'name',    label: 'Nom'        },
    { field: 'email',   label: 'Email'      },
    { field: 'pays',    label: 'Pays cible' },
    { field: 'niveau',  label: 'Niveau'     },
    { field: 'domaine', label: 'Domaine'    },
  ];
  const completion = !user ? 0 : Math.round(PROFILE_FIELDS.filter(f => user[f.field]).length / PROFILE_FIELDS.length * 100);

  const urgentDeadlines = deadlines.filter(d => {
    const diff = Math.round((d.deadline - new Date()) / 86400000);
    return diff >= 0 && diff <= 14;
  });

  const activeCountryBourses = activeCountry
    ? (bourses || []).filter(b => b.pays === COUNTRY_META[activeCountry]?.label).slice(0, 6)
    : [];

  if (!user) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16, textAlign:'center', padding:40 }}>
      <div style={{ fontSize:48 }}>🔒</div>
      <h3 style={{ fontSize:'1.1rem', color:'#1a3a6b', fontWeight:700 }}>Dashboard personnel</h3>
      <p style={{ fontSize:13, color:'#64748b' }}>Connectez-vous pour accéder à votre tableau de bord</p>
      <button onClick={() => handleQuickReply('Je veux me connecter')} style={S.btnPrimary}>Se connecter</button>
    </div>
  );

  return (
    <div style={{ width:'100%', background:'#f8f9fc', minHeight:'100vh', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 32px' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#1a3a6b', marginBottom:3, letterSpacing:'-0.01em' }}>
              Tableau de Bord
            </h1>
            <p style={{ fontSize:13, color:'#64748b' }}>
              Bonjour {user.name || user.email?.split('@')[0]}, voici l'état de vos bourses d'études.
            </p>
          </div>
          <button style={S.btnGold} onClick={() => setView('bourses')}>Explorer Bourses</button>
        </div>

        {/* BANNER URGENCE */}
        {urgentDeadlines.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderRadius:8, background:'#fff3cd', border:'1px solid #fde68a', borderLeft:'4px solid #f5a623', marginBottom:20 }}>
            <span style={{ fontSize:18 }}>⚡</span>
            <span style={{ fontSize:12, color:'#856404', flex:1, fontWeight:500 }}>
              <strong>{urgentDeadlines.length} deadline{urgentDeadlines.length > 1 ? 's urgentes' : ' urgente'} :</strong>{' '}
              {urgentDeadlines.map(d => `${d.nom} (${Math.round((d.deadline - new Date()) / 86400000)}j)`).join(' · ')}
            </span>
            <button
              onClick={() => setView('roadmap')}
              style={{ padding:'5px 12px', borderRadius:4, background:'#1a3a6b', border:'none', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}
            >
              Voir
            </button>
          </div>
        )}

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { label:'Bourses disponibles', val:(bourses || []).length,  icon:'🎓', color:'#1a3a6b', bg:'#eff6ff' },
            { label:'Dans ma roadmap',     val:roadmap.length,           icon:'📋', color:'#166534', bg:'#f0fdf4' },
            {
              label:'Deadlines ce mois',
              val: deadlines.filter(d => {
                const di = Math.round((d.deadline - new Date()) / 86400000);
                return di >= 0 && di <= 30;
              }).length,
              icon:'⏰', color:'#d97706', bg:'#fffbeb',
            },
            { label:'Profil complété', val:`${completion}%`, icon:'⭐', color:'#7c3aed', bg:'#f5f3ff' },
          ].map((k, i) => (
            <div key={i} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'16px 18px', borderTop:`3px solid ${k.color}`, boxShadow:'0 2px 6px rgba(26,58,107,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize:26, fontWeight:800, color:k.color }}>{k.val}</div>
                </div>
                <div style={{ width:40, height:40, borderRadius:8, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                  {k.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CARTE MONDIALE */}
        <div style={{ ...S.card, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={S.cardTitle}>🌍 Carte mondiale des bourses</div>
              <div style={S.cardSub}>
                {Object.keys(scholarshipCounts).length} pays · {(bourses || []).length} bourses · Cliquez sur un pays pour explorer
              </div>
            </div>
            <button style={S.btnXs} onClick={() => setView('bourses')}>Toutes les bourses →</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', gap:16, alignItems:'start' }}>
            <WorldMap
              onCountryClick={code => setActiveCountry(code === activeCountry ? null : code)}
              activeCountry={activeCountry}
              scholarshipCounts={scholarshipCounts}
            />

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#1a3a6b', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4, borderBottom:'2px solid #f5a623', paddingBottom:4 }}>
                Top pays
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:2, maxHeight:240, overflowY:'auto' }}>
                {Object.entries(scholarshipCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 15)
                  .map(([code, count]) => {
                    const meta     = COUNTRY_META[code];
                    if (!meta) return null;
                    const isActive = activeCountry === code;
                    const barMax   = Math.max(...Object.values(scholarshipCounts));
                    const barColor = count >= 10 ? '#1a3a6b' : count >= 7 ? '#2563eb' : count >= 4 ? '#3b82f6' : '#93c5fd';
                    return (
                      <div
                        key={code}
                        onClick={() => setActiveCountry(code === activeCountry ? null : code)}
                        style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:6, cursor:'pointer', transition:'all 0.15s',
                          background: isActive ? '#eff6ff' : 'transparent',
                          border:     isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                        }}
                      >
                        <span style={{ fontSize:14, width:20, textAlign:'center' }}>{meta.flag}</span>
                        <span style={{ flex:1, fontSize:12, color:isActive ? '#1a3a6b' : '#475569', fontWeight:isActive ? 700 : 400 }}>
                          {meta.label}
                        </span>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <div style={{ width:Math.round(count / barMax * 36), height:4, borderRadius:2, background:barColor, transition:'width 0.3s' }}/>
                          <span style={{ fontSize:10, fontWeight:700, color:barColor, minWidth:14, textAlign:'right' }}>{count}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {activeCountry && COUNTRY_META[activeCountry] && (
                <div style={{ marginTop:8, padding:'12px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1a3a6b', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span>{COUNTRY_META[activeCountry].flag} {COUNTRY_META[activeCountry].label}</span>
                    <span style={{ fontSize:10, color:'#fff', background:'#1a3a6b', padding:'2px 7px', borderRadius:3, fontWeight:600 }}>
                      {scholarshipCounts[activeCountry] || 0} bourses
                    </span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    {activeCountryBourses.length > 0
                      ? activeCountryBourses.map((b, i) => (
                          <div key={i} style={{ fontSize:11, color:'#334155', padding:'4px 0', borderBottom:i < activeCountryBourses.length - 1 ? '1px solid #dbeafe' : 'none' }}>
                            {b.nom}
                          </div>
                        ))
                      : <div style={{ fontSize:11, color:'#94a3b8' }}>Aucune bourse trouvée</div>
                    }
                  </div>
                  <button
                    style={{ ...S.btnGold, width:'100%', marginTop:10, fontSize:11, padding:'7px' }}
                    onClick={() => handleQuickReply(`Montre-moi les bourses disponibles en ${COUNTRY_META[activeCountry].label} pour un étudiant tunisien`)}
                  >
                    Explorer avec l'IA
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ALERTES + PROFIL */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          {/* Alertes deadlines */}
          <div style={S.card}>
            <div style={S.cardTitle}>🔔 Alertes deadlines</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:12 }}>
              {deadlines.length === 0 ? (
                <div style={{ color:'#64748b', fontSize:13 }}>
                  Aucune bourse avec deadline disponible.
                </div>
              ) : deadlines.slice(0, 5).map((d, i) => {
                const dl   = daysLeft(d.deadline);
                const diff = Math.round((d.deadline - new Date()) / 86400000);
                const bg   = diff < 0 ? '#fef2f2' : diff <= 7 ? '#fffbeb' : diff <= 14 ? '#eff6ff' : '#f8fafc';
                const bl   = diff < 0 ? '#dc2626' : diff <= 7 ? '#d97706' : diff <= 14 ? '#2563eb' : '#e2e8f0';
                return (
                  <div
                    key={i}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:7, background:bg, borderLeft:`3px solid ${bl}`, cursor:'pointer' }}
                    onClick={() => setDrawerBourse(d)}
                  >
                    <div>
                      <div style={{ fontSize:12, color:'#1a3a6b', fontWeight:600 }}>{d.nom}</div>
                      <div style={{ fontSize:10, color:'#64748b', marginTop:1 }}>
                        {d.pays} · {d.deadline.toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:dl.color, fontWeight:700, padding:'2px 9px', borderRadius:4, background:`${dl.color}15`, border:`1px solid ${dl.color}35`, whiteSpace:'nowrap' }}>
                      {dl.label === 'Expiré' ? 'Expiré' : dl.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complétude profil */}
          <div style={S.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={S.cardTitle}>📋 Complétude du profil</div>
              <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0, position:'relative' }}>
                <svg width="38" height="38" viewBox="0 0 38 38">
                  <circle cx="19" cy="19" r="15" fill="none" stroke="#e2e8f0" strokeWidth="4"/>
                  <circle cx="19" cy="19" r="15" fill="none"
                    stroke={completion >= 80 ? '#166534' : completion >= 60 ? '#d97706' : '#1a3a6b'}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${completion * 0.942} 94.2`}
                    transform="rotate(-90 19 19)"
                  />
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#1a3a6b' }}>
                  {completion}%
                </div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Informations académiques', pct: user?.niveau && user?.domaine ? 100 : 50, color:'#166534' },
                { label:'Expériences & projets',    pct: 75,  color:'#2563eb' },
                { label:'CV généré & optimisé',     pct: 50,  color:'#d97706' },
                { label:'Lettres de motivation',    pct: 25,  color:'#dc2626' },
                { label:'Entretiens simulés',       pct: scores.length > 0 ? Math.min(100, scores.length * 33) : 0, color:'#7c3aed' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:'#475569' }}>{label}</span>
                    <span style={{ fontSize:10, fontWeight:700, color }}>{pct}%</span>
                  </div>
                  <div style={{ height:5, borderRadius:99, background:'#f1f5f9', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>
            {completion < 100 && (
              <div style={{ marginTop:10, padding:'8px 11px', borderRadius:7, background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                <div style={{ fontSize:11, color:'#1a3a6b' }}>
                  💡 Complète tes lettres de motivation pour augmenter ton score de 15%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GRILLE PRINCIPALE */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* LEFT — Calendrier + Prochaines échéances */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={S.cardTitle}>📅 Calendrier des deadlines</div>
                  <div style={S.cardSub}>{deadlines.length} bourse{deadlines.length !== 1 ? 's' : ''} avec deadline</div>
                  <div style={S.cardSub}>{roadmapDeadlines.length} bourse{roadmapDeadlines.length !== 1 ? 's' : ''} dans ta roadmap</div>
                </div>
                <button style={S.btnXs} onClick={() => setView('roadmap')}>Roadmap →</button>
              </div>
              {deadlines.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', color:'#64748b', fontSize:13 }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                  Ajoute des bourses à ta roadmap pour voir leurs deadlines
                  <div style={{ marginTop:14 }}>
                    <button style={S.btnPrimary} onClick={() => setView('bourses')}>Parcourir les bourses</button>
                  </div>
                </div>
              ) : (
                <Calendrier
                  deadlines={deadlines}
                  onSelectBourse={b => {
                    const full = (bourses || []).find(x => x.nom?.trim().toLowerCase() === b.nom?.trim().toLowerCase());
                    setDrawerBourse(full || b);
                  }}
                />
              )}
            </div>

            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={S.cardTitle}>⏳ Prochaines échéances</div>
                <button style={S.btnXs} onClick={() => setView('roadmap')}>Voir Roadmap →</button>
              </div>
              {deadlines.length === 0 ? (
                <div style={{ color:'#64748b', fontSize:13 }}>Aucune bourse dans ta roadmap.</div>
              ) : deadlines.slice(0, 5).map((d, i) => {
                const dl   = daysLeft(d.deadline);
                const diff = Math.round((d.deadline - new Date()) / 86400000);
                const bg   = diff < 0 ? '#fef2f2' : diff <= 7 ? '#fffbeb' : diff <= 14 ? '#eff6ff' : '#f8fafc';
                const bl   = diff < 0 ? '#dc2626' : diff <= 7 ? '#d97706' : diff <= 14 ? '#2563eb' : '#e2e8f0';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < Math.min(deadlines.length, 5) - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:dl.color, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:'#1a3a6b', fontWeight:600 }}>{d.nom}</div>
                      <div style={{ fontSize:11, color:'#64748b' }}>{d.pays} · {d.deadline.toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span style={{ fontSize:12, color:dl.color, fontWeight:700, padding:'3px 10px', borderRadius:4, background:`${dl.color}15`, border:`1px solid ${dl.color}35`, whiteSpace:'nowrap' }}>
                      {dl.label === 'Expiré' ? 'Expiré' : `Dans ${dl.label}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Progression + Force dossier + Top bourses */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Progression entretiens */}
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div>
                  <div style={S.cardTitle}>📊 Progression entretiens</div>
                  <div style={S.cardSub}>{scores.length} entretien{scores.length !== 1 ? 's' : ''} simulé{scores.length !== 1 ? 's' : ''}</div>
                </div>
                <button style={S.btnXs} onClick={() => setView('entretien')}>Pratiquer →</button>
              </div>

              {scores.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>🎙️</div>
                  <div style={{ color:'#64748b', fontSize:13, marginBottom:12 }}>Aucun entretien encore</div>
                  <button style={S.btnPrimary} onClick={() => setView('entretien')}>Démarrer un entretien IA</button>
                </div>
              ) : (
                <>
                  <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ marginBottom:12 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#1a3a6b" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#1a3a6b" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {(() => {
                      const pts = scores.slice().reverse();
                      const n   = pts.length;
                      if (n < 2) return (
                        <g>
                          <circle cx="200" cy={110 - (pts[0]?.scoreNum / 100) * 100} r="5" fill="#1a3a6b"/>
                          <text x="200" y={110 - (pts[0]?.scoreNum / 100) * 100 - 9} textAnchor="middle" fontSize="10" fill="#64748b">
                            {pts[0]?.scoreNum}/100
                          </text>
                        </g>
                      );
                      const xs   = pts.map((_, i) => (i / (n - 1)) * 380 + 10);
                      const ys   = pts.map(p => 110 - (p.scoreNum / 100) * 100);
                      const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
                      const area = `${line} L${xs[n-1]},110 L${xs[0]},110 Z`;
                      return (
                        <>
                          <path d={area} fill="url(#scoreGrad)"/>
                          <path d={line} fill="none" stroke="#1a3a6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          {xs.map((x, i) => (
                            <g key={i}>
                              <circle cx={x} cy={ys[i]} r="5" fill="#1a3a6b"/>
                              <circle cx={x} cy={ys[i]} r="2.5" fill="#f5a623"/>
                              <text x={x} y={ys[i] - 9} textAnchor="middle" fontSize="9" fill="#64748b">
                                {pts[i].scoreNum}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {[
                      { label:'Dernier score', val:`${lastScore}/100`, color: lastScore >= 75 ? '#166534' : lastScore >= 55 ? '#d97706' : '#dc2626' },
                      avgScore  != null && { label:'Moyenne',  val:`${avgScore}/100`, color:'#475569' },
                      scoreDiff != null && { label:'Évolution', val:`${scoreDiff > 0 ? '+' : ''}${scoreDiff}`, color: scoreDiff > 0 ? '#166534' : '#dc2626' },
                    ].filter(Boolean).map((s, i) => (
                      <div key={i} style={{ padding:'8px 12px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                        <div style={{ fontSize:15, fontWeight:800, color:s.color }}>{s.val}</div>
                        <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Force du dossier */}
            <div style={S.card}>
              <div style={S.cardTitle}>💪 Force de votre dossier</div>
              <div style={{ display:'flex', alignItems:'center', gap:16, margin:'14px 0' }}>
                <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="7"/>
                    <circle cx="40" cy="40" r="32" fill="none"
                      stroke={completion >= 80 ? '#166534' : completion >= 60 ? '#d97706' : '#1a3a6b'}
                      strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${completion * 2.01} 201`}
                      transform="rotate(-90 40 40)"
                      style={{ transition:'stroke-dasharray 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#1a3a6b' }}>
                    {completion}%
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1a3a6b', marginBottom:8 }}>
                    {completion >= 100 ? 'Profil complet !' : completion >= 80 ? 'Presque complet' : 'Profil à compléter'}
                  </div>
                  {PROFILE_FIELDS.map(({ field, label }) => (
                    <div key={field} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background: user[field] ? '#166534' : '#e2e8f0', flexShrink:0 }}/>
                      <span style={{ fontSize:12, color: user[field] ? '#1a3a6b' : '#94a3b8', fontWeight: user[field] ? 500 : 400 }}>{label}</span>
                      {!user[field] && (
                        <span style={{ fontSize:9, color:'#dc2626', marginLeft:'auto', fontWeight:600 }}>manquant</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button style={{ ...S.btnPrimary, width:'100%' }} onClick={() => setView('profil')}>
                Compléter mon profil
              </button>
            </div>

            {/* Top bourses */}
            <div style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={S.cardTitle}>✨ Top bourses pour toi</div>
                <button style={S.btnXs} onClick={() => setView('recommandations')}>Voir tout →</button>
              </div>
              {(bourses || []).slice(0, 3).map((b, i) => (
                <div key={i} style={{ padding:'10px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <div style={{ fontSize:13, color:'#1a3a6b', fontWeight:600, flex:1, marginRight:8 }}>{b.nom}</div>
                    <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#eff6ff', color:'#1a3a6b', border:'1px solid #bfdbfe', whiteSpace:'nowrap', fontWeight:500 }}>
                      {b.pays}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:5 }}>{b.financement}</div>
                  <button
                    style={{ fontSize:11, color:'#1a3a6b', background:'none', border:'none', cursor:'pointer', padding:0, fontWeight:600, textDecoration:'underline', textDecorationColor:'#f5a623' }}
                    onClick={() => handleQuickReply(`Donne-moi les détails sur la bourse "${b.nom}"`)}
                  >
                    En savoir plus →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── DRAWER EXTERNALISÉ ── */}
      {drawerBourse && (
        <BourseDrawer
          bourse={drawerBourse}
          onClose={() => setDrawerBourse(null)}
          onAskAI={b => {
            handleQuickReply(`Donne-moi les détails sur "${b.nom}"`);
            setDrawerBourse(null);
          }}
          onChoose={b => handleQuickReply('je choisis ' + b.nom)}
          applied={appliedNoms.has(drawerBourse.nom?.trim().toLowerCase())}
          onApply={async b => {
            try {
              await axiosInstance.post(API_ROUTES.roadmap.create, {
                userId:        user.id,
                userEmail:     user.email || '',
                nom:           b.nom,
                pays:          b.pays         || '',
                lienOfficiel:  b.lienOfficiel || '',
                financement:   b.financement  || '',
                dateLimite:    b.dateLimite   || null,
                ajouteLe:      new Date().toISOString(),
                statut:        'en_cours',
                etapeCourante: 0,
              });
              setAppliedNoms(prev => new Set([...prev, b.nom?.trim().toLowerCase()]));
            } catch(e) { console.error(e); }
          }}
          starred={starredNoms.has(drawerBourse.nom?.trim().toLowerCase())}
          onStar={async (b, isStarred) => {
            const nomKey = b.nom?.trim().toLowerCase();
            try {
              const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id) + '&limit=1&depth=0');
              const doc = res.data.docs?.[0];
              if (isStarred) {
                if (doc?.id) {
                  const newB = (doc.bourses || []).filter(x => x.nom?.trim().toLowerCase() !== nomKey);
                  await axiosInstance.patch(API_ROUTES.favoris.update(doc.id), { bourses: newB });
                  setStarredNoms(prev => { const s = new Set(prev); s.delete(nomKey); return s; });
                }
              } else {
                const nb = {
                  nom:          b.nom,
                  pays:         b.pays         || '',
                  lienOfficiel: b.lienOfficiel || '',
                  financement:  b.financement  || '',
                  dateLimite:   b.dateLimite   || null,
                  ajouteLe:     new Date().toISOString(),
                };
                if (doc?.id)
                  await axiosInstance.patch(API_ROUTES.favoris.update(doc.id), { bourses: [...(doc.bourses || []), nb] });
                else
                  await axiosInstance.post(API_ROUTES.favoris.create, { user: user.id, userEmail: user.email || '', bourses: [nb] });
                setStarredNoms(prev => new Set([...prev, nomKey]));
              }
            } catch(e) { console.error(e); }
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════════════ */
const S = {
  card:      { background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'18px 20px', boxShadow:'0 2px 8px rgba(26,58,107,0.06)' },
  cardTitle: { fontSize:14, fontWeight:700, color:'#1a3a6b' },
  cardSub:   { fontSize:11, color:'#64748b', marginTop:2 },
  btnPrimary:{ padding:'9px 18px', borderRadius:6, background:'#1a3a6b', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnGold:   { padding:'9px 18px', borderRadius:6, background:'#f5a623', color:'#1a3a6b', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' },
  btnOutline:{ padding:'8px 16px', borderRadius:6, background:'transparent', color:'#475569', border:'1px solid #e2e8f0', fontSize:13, cursor:'pointer' },
  btnXs:     { padding:'5px 12px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:11, cursor:'pointer', fontWeight:600 },
  navBtn:    { padding:'3px 12px', borderRadius:4, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#1a3a6b', fontSize:16, cursor:'pointer' },
  iconBtn:   { padding:'3px 8px',  borderRadius:4, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#1a3a6b', fontSize:14, cursor:'pointer' },
};