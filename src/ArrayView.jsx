import { ARRAY_ADDR, AKINDS, heapAddress, validMask } from './arrayModel';
import { MONO, VarPill, colorOfVar } from './LinkedListNode';

const BLUE = '#1d4ed8';
const GRAY = '#9ca3af';
const FOCUS_BG = '#fde68a';

// etiquetas (topo, inicio, final, i, pos...) sobre as posições do vetor: { [índice]: [nomes] }
function markersOf(snapshot) {
  const { mem, vars } = snapshot;
  const out = {};
  const add = (idx, name) => { out[idx] = [...(out[idx] ?? []), name]; };
  if (mem.type === 'pilhaVet') add(mem.fields.topo, 'topo');
  if (mem.type === 'filaVet') {
    add(mem.fields.inicio, 'inicio');
    add(mem.fields.final, 'final');
  }
  vars.forEach((v) => { if (v.markIdx !== undefined && v.markIdx !== null) add(v.markIdx, v.name); });
  return out;
}

const cellStyle = (state, focused) => ({
  width: 62,
  height: 50,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: MONO,
  fontSize: 17,
  fontWeight: 700,
  borderRadius: 6,
  border: `2px ${state === 'valid' ? 'solid' : 'dashed'} ${focused ? '#16a34a' : state === 'valid' ? '#374151' : GRAY}`,
  background: focused ? '#dcfce7' : state === 'valid' ? '#ffffff' : '#f3f4f6',
  color: state === 'valid' ? '#1f2937' : '#9ca3af',
  fontStyle: state === 'valid' ? 'normal' : 'italic',
});

function Markers({ names, column }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexDirection: column ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', minHeight: 22, minWidth: column ? 70 : 0 }}>
      {(names ?? []).map((n) => <VarPill key={n} name={n} />)}
    </div>
  );
}

function FieldBox({ name, value, focused, freed }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        border: `1px solid ${freed ? GRAY : '#93c5fd'}`,
        borderRadius: 6,
        padding: '3px 10px',
        textAlign: 'center',
        background: focused ? FOCUS_BG : '#ffffff',
        minWidth: 56,
      }}
    >
      <div style={{ fontSize: 10, color: '#6b7280' }}>{name}</div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// ---------- lista / pilha / fila com vetor ----------

function VectorStruct({ snapshot }) {
  const { mem, vars, focus } = snapshot;
  const cfg = AKINDS[mem.type];
  const column = cfg.layout === 'column';
  const valid = validMask(mem);
  const markers = markersOf(snapshot);
  const freed = mem.destroyed;
  const descTag = vars.filter((v) => v.role === 'desc' && !v.dangling);
  const phantom = Object.keys(markers).some((k) => Number(k) >= mem.max); // ex.: topo == MAX (vetor cheio)
  const slots = Array.from({ length: mem.max }, (_, i) => i);

  const cell = (i) => {
    const v = mem.dados[i];
    const state = freed ? 'invalid' : valid[i] ? 'valid' : 'invalid';
    const focused = focus.cell === i || (focus.cells ?? []).includes(i);
    const title = freed ? 'memória liberada' : valid[i] ? undefined : v === null ? 'lixo: posição nunca escrita' : 'valor antigo: fora da estrutura (ainda está na memória)';
    return (
      <div title={title} style={cellStyle(state, focused)}>
        {v === null ? '?' : v}
      </div>
    );
  };

  const box = {
    border: `2px ${freed ? 'dashed' : 'solid'} ${freed ? GRAY : BLUE}`,
    borderRadius: 10,
    background: freed ? '#f3f4f6' : '#eff6ff',
    opacity: freed ? 0.75 : 1,
    padding: '6px 14px 10px',
    fontFamily: MONO,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', gap: 4, minHeight: 22 }}>{descTag.map((v) => <VarPill key={v.name} name={v.name} />)}</div>
      <div style={box}>
        <div style={{ fontSize: 11, color: freed ? '#6b7280' : BLUE, marginBottom: 6 }}>
          {cfg.descStruct} · <span>dados[{mem.max}]</span>
        </div>
        {column ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {phantom && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, fontSize: 11, color: '#6b7280', textAlign: 'right' }}>{mem.max}</span>
                <div style={{ ...cellStyle('invalid', false), borderStyle: 'dotted', fontSize: 11, fontWeight: 400 }}>fora</div>
                <Markers names={markers[mem.max]} column />
              </div>
            )}
            {[...slots].reverse().map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, fontSize: 11, color: '#6b7280', textAlign: 'right' }}>[{i}]</span>
                {cell(i)}
                <Markers names={markers[i]} column />
              </div>
            ))}
            <div style={{ borderTop: '3px solid #374151', marginLeft: 36, width: 62, textAlign: 'center', fontSize: 10, color: '#6b7280' }}>base</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            {slots.map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Markers names={markers[i]} />
                {cell(i)}
                <span style={{ fontSize: 11, color: '#6b7280' }}>[{i}]</span>
              </div>
            ))}
            {phantom && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Markers names={markers[mem.max]} />
                <div style={{ ...cellStyle('invalid', false), borderStyle: 'dotted', fontSize: 11, fontWeight: 400 }}>fora</div>
                <span style={{ fontSize: 11, color: '#6b7280' }}>[{mem.max}]</span>
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-start' }}>
          {cfg.fields.map((f) => (
            <FieldBox key={f.name} name={f.name} value={freed ? mem.fields[f.name] : mem.fields[f.name]} focused={focus.field === f.name} freed={freed} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#6b7280', fontFamily: MONO }}>
        {ARRAY_ADDR.desc}
        {freed && <span style={{ color: '#dc2626', fontWeight: 700 }}> · liberado</span>}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', maxWidth: 520, textAlign: 'center', marginTop: 4 }}>
        Cinza tracejado = posição fora da estrutura (lixo ou valor antigo que continua na memória).
      </div>
    </div>
  );
}

// ---------- tabela hash (SVG) ----------

const SLOT_H = 30;
const Y0 = 78;
const VEC_X = 310;
const IDX_W = 38;
const VEC_W = 170;
const INT_X = 560;

function Arrow({ x1, y1, x2, y2, color = '#374151', dashed = false, id }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} strokeDasharray={dashed ? '6 4' : undefined} markerEnd={`url(#${id})`} />;
}

function Pill({ x, y, name, anchor = 'middle' }) {
  const w = name.length * 7 + 16;
  const x0 = anchor === 'end' ? x - w : anchor === 'start' ? x : x - w / 2;
  return (
    <g>
      <rect x={x0} y={y - 10} width={w} height={18} rx={9} fill={colorOfVar(name)} />
      <text x={x0 + w / 2} y={y + 3} textAnchor="middle" fontSize={11} fontWeight={600} fill="#fff" fontFamily={MONO}>{name}</text>
    </g>
  );
}

function HashView({ snapshot }) {
  const { mem, vars, focus, ghosts } = snapshot;
  const size = mem.max;
  const descLive = mem.parts.desc !== 'none';
  const descFreed = mem.parts.desc === 'freed';
  const vecLive = mem.parts.vec !== 'none';
  const vecFreed = mem.parts.vec === 'freed';
  const yBox = Y0;
  const yItens = yBox + 24 + 2 * 30 + 15;
  const h = Y0 + size * SLOT_H + 40;

  const field = (name) => {
    const v = mem.fields[name];
    return v === undefined ? '?' : String(v);
  };
  const itensText = vecLive ? ARRAY_ADDR.vec : '?';
  const descTags = vars.filter((v) => v.role === 'desc' && !v.dangling);
  const marks = vars.filter((v) => v.markIdx !== undefined && v.markIdx !== null);
  const novo = vars.find((v) => v.name === 'novo' && v.kind === 'ptr');

  const referenced = new Set(mem.slots.filter((s) => s));
  const ids = new Set([...Object.keys(mem.heap), ...Object.keys(ghosts ?? {})]);

  const intBox = (id, x, y, ghost) => {
    const valor = (mem.heap[id] ?? ghosts[id])?.valor;
    return (
      <g key={`int-${id}`}>
        <rect x={x} y={y} width={92} height={SLOT_H - 6} rx={6} fill={ghost ? '#f3f4f6' : '#ffffff'} stroke={ghost ? GRAY : '#374151'} strokeWidth={2} strokeDasharray={ghost ? '5 3' : undefined} />
        <text x={x + 10} y={y + 17} fontSize={15} fontWeight={700} fontFamily={MONO} fill={ghost ? '#9ca3af' : '#1f2937'}>{valor === null || valor === undefined ? '?' : valor}</text>
        <text x={x + 82} y={y + 16} textAnchor="end" fontSize={9} fontFamily={MONO} fill={ghost ? '#dc2626' : '#6b7280'}>{ghost ? 'liberado' : heapAddress(id)}</text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 780 ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <defs>
        <marker id="hArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#374151" /></marker>
        <marker id="hArrowG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9ca3af" /></marker>
      </defs>

      {/* struct Hash */}
      {descLive && (
        <g opacity={descFreed ? 0.75 : 1}>
          <rect x={20} y={yBox} width={196} height={24 + 90} rx={8} fill={descFreed ? '#f3f4f6' : '#eff6ff'} stroke={descFreed ? GRAY : BLUE} strokeWidth={2} strokeDasharray={descFreed ? '6 4' : undefined} />
          <text x={32} y={yBox + 16} fontSize={11} fontFamily={MONO} fill={descFreed ? '#6b7280' : BLUE}>Hash</text>
          <line x1={20} y1={yBox + 24} x2={216} y2={yBox + 24} stroke={descFreed ? GRAY : BLUE} />
          {[['qtd', field('qtd')], ['TABLE_SIZE', field('TABLE_SIZE')], ['itens', itensText]].map(([name, text], k) => {
            const y = yBox + 24 + k * 30;
            const focused = focus.field === name;
            const dangling = name === 'itens' && vecFreed && !descFreed;
            return (
              <g key={name}>
                {focused && <rect x={21} y={y + 1} width={194} height={28} fill={FOCUS_BG} />}
                {k > 0 && <line x1={20} y1={y} x2={216} y2={y} stroke="#bfdbfe" />}
                <text x={32} y={y + 19} fontSize={13} fontWeight={700} fontFamily={MONO} fill="#1f2937">{name}</text>
                <text x={206} y={y + 19} textAnchor="end" fontSize={13} fontFamily={MONO} fill={name === 'itens' && vecFreed ? '#dc2626' : '#1f2937'} textDecoration={name === 'itens' && vecFreed ? 'line-through' : undefined}>{text}</text>
                {dangling && <title>aponta para memória já liberada</title>}
              </g>
            );
          })}
          <text x={118} y={yBox + 24 + 90 + 14} textAnchor="middle" fontSize={10} fontFamily={MONO} fill={descFreed ? '#dc2626' : '#6b7280'}>
            {ARRAY_ADDR.desc}{descFreed ? ' · liberado' : ''}
          </text>
          {descTags.map((v, k) => <Pill key={v.name} x={118 + k * 40} y={yBox - 14} name={v.name} />)}
        </g>
      )}

      {/* seta itens -> vetor */}
      {descLive && vecLive && (
        <path
          d={`M216,${yItens} H262 V${Y0 - 20} H${VEC_X + 18} V${Y0 - 3}`}
          fill="none" stroke={vecFreed ? GRAY : '#374151'} strokeWidth={2} strokeDasharray={vecFreed ? '6 4' : undefined}
          markerEnd={`url(#${vecFreed ? 'hArrowG' : 'hArrow'})`}
        />
      )}

      {/* vetor de ponteiros */}
      {vecLive && (
        <g opacity={vecFreed ? 0.7 : 1}>
          <text x={VEC_X + IDX_W + 4} y={Y0 - 8} fontSize={11} fontFamily={MONO} fill={vecFreed ? '#6b7280' : '#1f2937'}>
            itens · int*[{size}] {ARRAY_ADDR.vec}{vecFreed ? ' · liberado' : ''}
          </text>
          {mem.slots.map((slot, i) => {
            const y = Y0 + i * SLOT_H;
            const focused = focus.cell === i;
            const dangling = slot && !mem.heap[slot] && !ghosts?.[slot];
            const text = slot === undefined ? '?' : slot === null ? 'NULL' : heapAddress(slot);
            return (
              <g key={i}>
                <rect x={VEC_X} y={y} width={IDX_W} height={SLOT_H} fill="#f3f4f6" stroke={vecFreed ? GRAY : '#374151'} strokeWidth={1.5} strokeDasharray={vecFreed ? '4 3' : undefined} />
                <rect x={VEC_X + IDX_W} y={y} width={VEC_W - IDX_W} height={SLOT_H} fill={focused ? FOCUS_BG : '#ffffff'} stroke={vecFreed ? GRAY : '#374151'} strokeWidth={1.5} strokeDasharray={vecFreed ? '4 3' : undefined} />
                <text x={VEC_X + IDX_W / 2} y={y + 20} textAnchor="middle" fontSize={12} fontFamily={MONO} fill="#6b7280">[{i}]</text>
                <text
                  x={VEC_X + IDX_W + 10} y={y + 20} fontSize={12} fontFamily={MONO}
                  fill={dangling ? '#dc2626' : slot === null || slot === undefined ? '#6b7280' : '#1f2937'}
                  textDecoration={dangling ? 'line-through' : undefined}
                >
                  {text}
                </text>
              </g>
            );
          })}
          {marks.map((v) => (
            <Pill key={v.name} x={VEC_X - 8} y={Y0 + v.markIdx * SLOT_H + SLOT_H / 2} name={v.name} anchor="end" />
          ))}
        </g>
      )}

      {/* ints no heap apontados pelo vetor */}
      {vecLive && mem.slots.map((slot, i) => {
        if (!slot || !ids.has(slot)) return null;
        const y = Y0 + i * SLOT_H;
        const ghost = !mem.heap[slot];
        return (
          <g key={`s${i}`}>
            <Arrow x1={VEC_X + VEC_W} y1={y + SLOT_H / 2} x2={INT_X} y2={y + SLOT_H / 2} color={ghost ? GRAY : '#374151'} dashed={ghost} id={ghost ? 'hArrowG' : 'hArrow'} />
            {intBox(slot, INT_X, y + 3, ghost)}
          </g>
        );
      })}

      {/* int recém-alocado (novo) que ainda não foi ligado ao vetor */}
      {Object.keys(mem.heap).filter((id) => !referenced.has(id)).map((id) => {
        const pos = marks.find((m) => m.name === 'pos');
        const y = (pos ? Y0 + pos.markIdx * SLOT_H : Y0) + 3;
        return (
          <g key={`u${id}`}>
            {intBox(id, INT_X + 110, y, false)}
            {novo && novo.target === id && <Pill x={INT_X + 110 + 46} y={y - 9} name="novo" />}
          </g>
        );
      })}
    </svg>
  );
}

export function ArrayCanvas({ snapshot }) {
  const hash = snapshot.mem.type === 'hash';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', display: 'flex', alignItems: hash ? 'stretch' : 'center', justifyContent: 'center', padding: hash ? 8 : 16 }}>
      {hash ? <HashView snapshot={snapshot} /> : <VectorStruct snapshot={snapshot} />}
    </div>
  );
}

// ---------- painel de variáveis (sem ponteiros de nó: ints, índices e o ponteiro da struct) ----------

export function ArrayVariablesPanel({ snapshot, previous, cardStyle, titleStyle, captionStyle }) {
  const { vars, mem } = snapshot;
  const prevVars = previous?.vars ?? [];
  const prevMem = previous?.mem ?? null;
  const changedVar = (v) => {
    const p = prevVars.find((x) => x.name === v.name);
    return !p || p.value !== v.value || p.target !== v.target;
  };
  const cfg = AKINDS[mem.type];
  const fieldRows = mem.type === 'hash'
    ? [['qtd', mem.fields.qtd], ['TABLE_SIZE', mem.fields.TABLE_SIZE]]
    : cfg.fields.map((f) => [f.name, mem.fields[f.name]]);
  const showFields = !mem.destroyed && (mem.type !== 'hash' || mem.parts.desc === 'live');
  const cell = { padding: '3px 6px', fontFamily: MONO, fontSize: 12 };
  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>Variáveis</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: 10 }}>
            <th style={cell}>nome</th><th style={cell}>tipo</th><th style={cell}>valor</th>
          </tr>
        </thead>
        <tbody>
          {vars.map((v) => {
            const changed = changedVar(v);
            let value;
            if (v.role === 'desc') value = `${mem.type === 'hash' ? ARRAY_ADDR.desc : ARRAY_ADDR.desc} → ${v.pointee}`;
            else if (v.kind === 'out') value = `→ x do chamador = ${v.value ?? '?'}`;
            else if (v.kind === 'ptr') value = `${v.target ? heapAddress(v.target) : '?'}${v.pointee !== null && v.pointee !== undefined ? ` → ${v.pointee}` : ''}`;
            else value = String(v.value);
            return (
              <tr key={v.name} style={{ background: changed ? '#fef9c3' : 'transparent' }}>
                <td style={cell}><VarPill name={v.name} /></td>
                <td style={{ ...cell, color: '#6b7280' }}>{v.type}</td>
                <td style={cell}>
                  {value}
                  {v.dangling && <span style={{ color: '#dc2626' }}> (liberado)</span>}
                </td>
              </tr>
            );
          })}
          {showFields && fieldRows.map(([name, value]) => {
            const before = prevMem && !prevMem.destroyed ? prevMem.fields[name] : value;
            return (
              <tr key={`f-${name}`} style={{ background: before !== value ? '#fef9c3' : 'transparent' }}>
                <td style={{ ...cell, color: '#6b7280', paddingLeft: 18 }}>↳ {cfg.descVar}-&gt;{name}</td>
                <td style={{ ...cell, color: '#6b7280' }}>int</td>
                <td style={cell}>{value === undefined ? '?' : value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ ...captionStyle, marginTop: 8 }}>Amarelo = mudou neste passo. Endereços são ilustrativos.</p>
    </section>
  );
}
