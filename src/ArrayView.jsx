import { ARRAY_ADDR, AKINDS, REM, heapAddress, validMask } from './arrayModel';
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
  const chain = mem.type === 'hashChain';
  const chr = mem.type === 'hashChar' || mem.type === 'hashOpen';
  const isChar = mem.type === 'hashChar';
  const SH = chain ? CHAIN_ROW : SLOT_H;
  const descLive = mem.parts.desc !== 'none';
  const descFreed = mem.parts.desc === 'freed';
  const vecLive = mem.parts.vec !== 'none';
  const vecFreed = mem.parts.vec === 'freed';
  const yBox = Y0;
  const yItens = yBox + 24 + 2 * 30 + 15;
  const h = Y0 + size * SH + 40;

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

  const layout = chain ? chainLayout(mem, ghosts ?? {}, vars) : null;

  const intBox = (id, x, y, ghost) => {
    const valor = (mem.heap[id] ?? ghosts[id])?.valor;
    return (
      <g key={`int-${id}`}>
        <rect x={x} y={y} width={92} height={SH - 6} rx={6} fill={ghost ? '#f3f4f6' : '#ffffff'} stroke={ghost ? GRAY : '#374151'} strokeWidth={2} strokeDasharray={ghost ? '5 3' : undefined} />
        <text x={x + 10} y={y + 17} fontSize={15} fontWeight={700} fontFamily={MONO} fill={ghost ? '#9ca3af' : '#1f2937'}>{valor === null || valor === undefined ? '?' : valor}</text>
        <text x={x + 82} y={y + 16} textAnchor="end" fontSize={9} fontFamily={MONO} fill={ghost ? '#dc2626' : '#6b7280'}>{ghost ? 'liberado' : heapAddress(id)}</text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${chain ? layout.width : 780} ${h}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
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
            itens · {chain ? 'No*' : isChar ? 'char' : 'int'}[{size}] {ARRAY_ADDR.vec}{vecFreed ? ' · liberado' : ''}
          </text>
          {mem.slots.map((slot, i) => {
            const y = Y0 + i * SH;
            const focused = focus.cell === i;
            const dangling = slot && !mem.heap[slot] && !ghosts?.[slot];
            const text = slot === undefined ? '?' : slot === null ? 'NULL' : heapAddress(slot);
            return (
              <g key={i}>
                <rect x={VEC_X} y={y} width={IDX_W} height={SH} fill="#f3f4f6" stroke={vecFreed ? GRAY : '#374151'} strokeWidth={1.5} strokeDasharray={vecFreed ? '4 3' : undefined} />
                <rect x={VEC_X + IDX_W} y={y} width={VEC_W - IDX_W} height={SH} fill={focused ? FOCUS_BG : focus.cells?.includes(i) ? '#ffedd5' : '#ffffff'} stroke={vecFreed ? GRAY : '#374151'} strokeWidth={1.5} strokeDasharray={vecFreed ? '4 3' : undefined} />
                <text x={VEC_X + IDX_W / 2} y={y + 20} textAnchor="middle" fontSize={12} fontFamily={MONO} fill="#6b7280">[{i}]</text>
                {chr ? (
                  slot === REM && !isChar ? (
                    <text x={VEC_X + IDX_W + 12} y={y + 20} fontSize={11} fontWeight={700} fontFamily={MONO} fill="#991b1b">REMOVIDO <tspan fill="#9ca3af" fontWeight={400}>(-2)</tspan></text>
                  ) : slot === null || slot === undefined ? (
                    <text x={VEC_X + IDX_W + 12} y={y + 20} fontSize={12} fontFamily={MONO} fill="#6b7280">{slot === undefined ? '?' : isChar ? "'\\0'" : 'VAZIO'} <tspan fontSize={10}>{slot === undefined ? '' : isChar ? 'vazio' : '(-1)'}</tspan></text>
                  ) : isChar ? (
                    <text x={VEC_X + IDX_W + 12} y={y + 21} fontSize={16} fontWeight={700} fontFamily={MONO} fill="#1f2937">'{slot}' <tspan fontSize={10} fontWeight={400} fill="#9ca3af">{slot.charCodeAt(0)}</tspan></text>
                  ) : (
                    <text x={VEC_X + IDX_W + 12} y={y + 21} fontSize={16} fontWeight={700} fontFamily={MONO} fill="#1f2937">{slot}</text>
                  )
                ) : !chain && slot && (mem.heap[slot] || ghosts?.[slot]) ? (
                  <>
                    {!mem.heap[slot] && <rect x={VEC_X + IDX_W + 1} y={y + 1} width={VEC_W - IDX_W - 2} height={SH - 2} fill="#f3f4f6" />}
                    <text x={VEC_X + IDX_W + 12} y={y + 21} fontSize={15} fontWeight={700} fontFamily={MONO} fill={mem.heap[slot] ? '#1f2937' : GRAY} textDecoration={mem.heap[slot] ? undefined : 'line-through'}>
                      {(mem.heap[slot] ?? ghosts[slot]).valor ?? '?'}
                    </text>
                    <text x={VEC_X + VEC_W - 6} y={y + 20} textAnchor="end" fontSize={9} fontFamily={MONO} fill={mem.heap[slot] ? '#6b7280' : '#dc2626'}>
                      {mem.heap[slot] ? heapAddress(slot) : 'liberado'}
                    </text>
                  </>
                ) : (
                  <text
                    x={VEC_X + IDX_W + 10} y={y + 20} fontSize={12} fontFamily={MONO}
                    fill={dangling ? '#dc2626' : slot === null || slot === undefined ? '#6b7280' : '#1f2937'}
                    textDecoration={dangling ? 'line-through' : undefined}
                  >
                    {text}
                  </text>
                )}
              </g>
            );
          })}
          {marks.map((v, k) => {
            // etiquetas na mesma posição ficam lado a lado, e não umas sobre as outras
            const before = marks.slice(0, k).filter((m) => m.markIdx === v.markIdx).reduce((acc, m) => acc + m.name.length * 7 + 20, 0);
            return <Pill key={v.name} x={VEC_X - 8 - before} y={Y0 + v.markIdx * SH + SH / 2} name={v.name} anchor="end" />;
          })}
        </g>
      )}

      {chr && snapshot.note && (
        <foreignObject x={20} y={yBox + 24 + 90 + 28} width={260} height={110}>
          <div style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.4, color: '#78350f', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 8px' }}>{snapshot.note}</div>
        </foreignObject>
      )}

      {/* int recém-alocado (novo) que ainda não foi ligado ao vetor */}
      {chain && vecLive && <ChainNodes mem={mem} ghosts={ghosts ?? {}} vars={vars} layout={layout} />}
      {!chain && Object.keys(mem.heap).filter((id) => !referenced.has(id)).map((id) => {
        const pos = marks.find((m) => m.name === 'pos');
        const y = (pos ? Y0 + pos.markIdx * SH : Y0) + 3;
        return (
          <g key={`u${id}`}>
            {intBox(id, INT_X, y, false)}
            {novo && novo.target === id && <Pill x={INT_X + 46} y={y - 9} name="novo" />}
          </g>
        );
      })}
    </svg>
  );
}


// ---------- hash com lista encadeada: cadeias de nós saindo de cada posição do vetor ----------

const CHAIN_ROW = 48;
const NODE_W = 92;
const NODE_H = 26;
const NODE_GAP = 34;
const NODE_X0 = VEC_X + VEC_W + 36;

// Calcula (linha, coluna) de cada nó: primeiro as cadeias alcançáveis pelo vetor; depois os nós "soltos"
// (recém-alocados ou já desligados) ao lado da linha em que o código está trabalhando.
function chainLayout(mem, ghosts, vars) {
  const look = (id) => mem.heap[id] ?? ghosts[id];
  const at = {};
  const cols = Array(mem.max).fill(0);
  mem.slots.forEach((slot, row) => {
    let id = slot;
    while (id && look(id) && !at[id]) {
      at[id] = { row, col: cols[row] };
      cols[row] += 1;
      id = look(id).prox;
    }
  });
  const loose = [...Object.keys(mem.heap), ...Object.keys(ghosts)].filter((id) => !at[id]);
  const targeted = new Set(loose.map((id) => look(id)?.prox).filter(Boolean));
  const heads = loose.filter((id) => !targeted.has(id));
  const mark = vars.find((v) => (v.name === 'pos' || v.name === 'i') && v.markIdx !== undefined && v.markIdx !== null);
  const row = mark ? Math.min(mark.markIdx, mem.max - 1) : 0;
  let col = cols[row] + (cols[row] > 0 ? 0 : 0);
  [...heads, ...loose].forEach((h) => {
    let id = h;
    while (id && look(id) && !at[id]) {
      at[id] = { row, col, loose: true };
      col += 1;
      id = look(id).prox;
    }
  });
  const maxCol = Math.max(0, ...Object.values(at).map((p) => p.col + 1));
  return { at, width: Math.max(780, NODE_X0 + maxCol * (NODE_W + NODE_GAP) + 30) };
}

function ChainNodes({ mem, ghosts, vars, layout }) {
  const look = (id) => mem.heap[id] ?? ghosts[id];
  const { at } = layout;
  const nx = (col) => NODE_X0 + col * (NODE_W + NODE_GAP);
  const ny = (row) => Y0 + row * CHAIN_ROW + (CHAIN_ROW - NODE_H) / 2;
  const ptrs = vars.filter((v) => v.kind === 'ptr' && v.role !== 'desc' && v.target);
  const out = [];
  // setas do vetor para o primeiro nó
  mem.slots.forEach((slot, row) => {
    if (!slot || !at[slot]) return;
    const ghost = !mem.heap[slot];
    out.push(<Arrow key={`sl${row}`} x1={VEC_X + VEC_W} y1={Y0 + row * CHAIN_ROW + CHAIN_ROW / 2} x2={nx(at[slot].col)} y2={Y0 + row * CHAIN_ROW + CHAIN_ROW / 2} color={ghost ? GRAY : '#374151'} dashed={ghost} id={ghost ? 'hArrowG' : 'hArrow'} />);
  });
  Object.entries(at).forEach(([id, p]) => {
    const n = look(id);
    const ghost = !mem.heap[id];
    const x = nx(p.col);
    const y = ny(p.row);
    const stroke = ghost ? GRAY : '#374151';
    const target = n.prox;
    const tp = target ? at[target] : null;
    const dangling = target && !tp;
    const cx = x + NODE_W * 0.75;
    out.push(
      <g key={`n${id}`}>
        <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={5} fill={ghost ? '#f3f4f6' : '#ffffff'} stroke={stroke} strokeWidth={2} strokeDasharray={ghost ? '5 3' : undefined} />
        <line x1={x + NODE_W / 2} y1={y} x2={x + NODE_W / 2} y2={y + NODE_H} stroke={stroke} strokeWidth={1.5} />
        <text x={x + NODE_W / 4} y={y + 18} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily={MONO} fill={ghost ? GRAY : '#1f2937'}>{n.valor === null || n.valor === undefined ? '?' : n.valor}</text>
        {target === null && <text x={cx} y={y + 17} textAnchor="middle" fontSize={11} fontFamily={MONO} fill={ghost ? GRAY : '#6b7280'}>NULL</text>}
        {target === undefined && <text x={cx} y={y + 17} textAnchor="middle" fontSize={12} fontFamily={MONO} fill="#6b7280">?</text>}
        {target && <circle cx={cx} cy={y + NODE_H / 2} r={3.5} fill={ghost || dangling ? GRAY : '#374151'} />}
        <text x={x + NODE_W / 2} y={y + NODE_H + 9} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={ghost ? '#dc2626' : '#9ca3af'}>{ghost ? 'liberado' : heapAddress(id)}</text>
      </g>,
    );
    if (tp) {
      if (tp.row === p.row && tp.col === p.col + 1) {
        out.push(<Arrow key={`e${id}`} x1={cx + 4} y1={y + NODE_H / 2} x2={nx(tp.col)} y2={y + NODE_H / 2} color={ghost ? GRAY : '#374151'} dashed={ghost} id={ghost ? 'hArrowG' : 'hArrow'} />);
      } else {
        const ty = ny(tp.row) + NODE_H;
        const yb = y + NODE_H + 12;
        out.push(
          <path key={`e${id}`} d={`M${cx},${y + NODE_H / 2} V${yb} H${nx(tp.col) + NODE_W * 0.82} V${ty + 1}`} fill="none" stroke={ghost ? GRAY : '#374151'} strokeWidth={2} strokeDasharray={ghost ? '5 3' : undefined} markerEnd={`url(#${ghost ? 'hArrowG' : 'hArrow'})`} />,
        );
      }
    }
  });
  // etiquetas dos ponteiros locais (aux, ant, prox, novo) sobre o nó que apontam
  const stacked = {};
  ptrs.forEach((v) => {
    const p = at[v.target];
    if (!p) return;
    const k = stacked[v.target] ?? 0;
    stacked[v.target] = k + 1;
    out.push(<Pill key={`p${v.name}`} x={nx(p.col) + NODE_W / 2 + k * 0} y={ny(p.row) - 7 - k * 17} name={v.name} />);
  });
  return <g>{out}</g>;
}

export function ArrayCanvas({ snapshot }) {
  const t = snapshot.mem.type;
  const svg = t === 'hashOpen' || t === 'hashChar' || t === 'hashChain';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', display: 'flex', alignItems: svg ? 'stretch' : 'center', justifyContent: 'center', padding: svg ? 8 : 16 }}>
      {svg && <HashView snapshot={snapshot} />}
      {!svg && <VectorStruct snapshot={snapshot} />}
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
  const fieldRows = ['hashChain', 'hashChar', 'hashOpen'].includes(mem.type)
    ? [['qtd', mem.fields.qtd], ['TABLE_SIZE', mem.fields.TABLE_SIZE]]
    : cfg.fields.map((f) => [f.name, mem.fields[f.name]]);
  const showFields = !mem.destroyed && (!mem.parts || mem.parts.desc === 'live');
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
            else if (v.kind === 'chr') value = `'${v.value}' (código ${v.value.charCodeAt(0)})`;
            else if (v.kind === 'out') value = `→ x do chamador = ${v.value ?? '?'}`;
            else if (v.kind === 'ptr') value = `${v.target ? heapAddress(v.target) : v.isNull ? 'NULL' : '?'}${v.pointee !== null && v.pointee !== undefined ? ` → ${v.pointee}` : ''}`;
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
