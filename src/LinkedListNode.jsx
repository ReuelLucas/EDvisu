import { Handle, Position } from 'reactflow';

export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Cor de cada variável (etiquetas sobre os nós, pontinhos de escopo e painel de variáveis)
const VAR_COLORS = {
  li: '#2563eb',
  p: '#2563eb',
  f: '#2563eb',
  no: '#16a34a',
  aux: '#ea580c',
  ant: '#7c3aed',
  count: '#0f766e',
};
export const colorOfVar = (name) => VAR_COLORS[name] ?? '#6b7280';

// `dangling`: a variável guarda o endereço de memória já liberada (contorno tracejado vermelho)
export function VarPill({ name, dangling = false }) {
  return (
    <span
      title={dangling ? 'ponteiro pendente: aponta para memória liberada' : undefined}
      style={{
        background: colorOfVar(name),
        color: '#fff',
        borderRadius: 10,
        padding: '1px 8px',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: MONO,
        outline: dangling ? '2px dashed #dc2626' : 'none',
        outlineOffset: 1,
      }}
    >
      {name}
    </span>
  );
}

function Tags({ tags }) {
  return (
    <div style={{ height: 22, display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'flex-start' }}>
      {tags.map((tag) => (
        <VarPill key={tag.name} name={tag.name} dangling={tag.dangling} />
      ))}
    </div>
  );
}

const BOX_HEIGHT = 56;
const handleStyle = { width: 8, height: 8, background: '#374151', border: 'none' };
const hiddenHandle = { width: 8, height: 8, background: 'transparent', border: 'none', opacity: 0 };
const DANGLING = '#dc2626';
const danglingStyle = { color: DANGLING, textDecoration: 'line-through' };
const addressStyle = { textAlign: 'center', fontSize: 10, lineHeight: '14px', color: '#6b7280', marginTop: 4 };

const STATE_STYLES = {
  removendo: { border: '#dc2626', background: '#fef2f2', dash: 'dashed', text: '#1f2937' },
  novo: { border: '#16a34a', background: '#f0fdf4', dash: 'solid', text: '#1f2937' },
  liberado: { border: '#9ca3af', background: '#f3f4f6', dash: 'dashed', text: '#9ca3af' },
  normal: { border: '#374151', background: '#ffffff', dash: 'solid', text: '#1f2937' },
};

// Uma célula da struct: rótulo pequeno em cima, valor embaixo, tudo centralizado na caixa.
function Cell({ cell, look, first, compact }) {
  const ptr = cell.kind === 'ptr';
  const isNull = ptr && cell.text === 'NULL' && !cell.dangling;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        padding: compact ? '0 8px' : '0 10px',
        minWidth: compact ? 56 : 62,
        flex: 1,
        borderLeft: first ? 'none' : `1px solid ${look.border}`,
        // ponteiro NULL: célula riscada na diagonal (aponta para lugar nenhum)
        ...(isNull
          ? { background: `linear-gradient(to top right, transparent calc(50% - 0.75px), #cbd5e1 calc(50% - 0.75px), #cbd5e1 calc(50% + 0.75px), transparent calc(50% + 0.75px))` }
          : {}),
      }}
    >
      <div style={{ fontSize: 9, lineHeight: '12px', color: cell.dangling ? DANGLING : '#6b7280', fontWeight: cell.dangling ? 700 : 400 }}>
        {cell.dangling ? 'pendente' : cell.label}
      </div>
      <div
        style={{
          fontSize: ptr ? 12 : 16,
          fontWeight: ptr ? 400 : 700,
          lineHeight: '20px',
          color: look.text,
          ...(cell.dangling ? danglingStyle : {}),
        }}
      >
        {cell.text}
      </div>
    </div>
  );
}

// Elem: desenhado como a struct [ valor | prox ] (ou [ ant | valor | prox ]) + endereço abaixo.
export function ListNode({ data }) {
  const look = STATE_STYLES[data.state] ?? STATE_STYLES.normal;
  const compact = data.cells.length > 2;
  return (
    <div style={{ fontFamily: MONO, color: look.text }}>
      <Tags tags={data.tags} />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          height: BOX_HEIGHT,
          width: data.boxWidth ?? undefined,
          boxSizing: 'border-box',
          border: `2px ${look.dash} ${look.border}`,
          borderRadius: 8,
          background: look.background,
        }}
      >
        <Handle type="target" position={Position.Left} id="in" style={handleStyle} />
        {data.vertical && <Handle type="target" position={Position.Top} id="up" style={{ ...hiddenHandle, left: '80%' }} />}
        {data.vertical && <Handle type="source" position={Position.Bottom} id="down" style={{ ...handleStyle, left: '80%' }} />}
        <Handle type="target" position={Position.Top} id="topA" style={{ ...hiddenHandle, left: '28%' }} />
        <Handle type="target" position={Position.Top} id="topB" style={{ ...hiddenHandle, left: '72%' }} />
        {data.backOut && <Handle type="source" position={Position.Bottom} id="back" style={{ ...handleStyle, left: data.backOut }} />}
        {data.backIn && <Handle type="target" position={Position.Bottom} id="backIn" style={{ ...hiddenHandle, left: data.backIn }} />}
        {data.cells.map((cell, i) => (
          <Cell key={cell.key} cell={cell} look={look} first={i === 0} compact={compact} />
        ))}
        <Handle type="source" position={Position.Right} id="prox" style={data.vertical ? hiddenHandle : handleStyle} />
      </div>
      <div style={{ ...addressStyle, ...(data.state === 'liberado' ? { color: DANGLING, fontWeight: 700 } : {}) }}>
        {data.address}
        {data.state === 'liberado' ? ' · liberado' : ''}
      </div>
    </div>
  );
}

// Descritor (struct lista/pilha/fila). Cada campo ponteiro tem a sua saída (Handle).
export function DescNode({ data }) {
  const rowStyle = { position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 14, height: 28, alignItems: 'center', padding: '0 10px' };
  return (
    <div style={{ fontFamily: MONO, color: '#1f2937', width: 160 }}>
      <Tags tags={data.tags} />
      <div style={{ border: '2px solid #1d4ed8', borderRadius: 8, background: '#eff6ff' }}>
        <div style={{ height: 22, lineHeight: '22px', padding: '0 10px', fontSize: 10, color: '#1d4ed8', borderBottom: '1px solid #1d4ed8' }}>
          {data.title}
        </div>
        {data.fields.map((f, i) => (
          <div
            key={f.name}
            style={{
              ...rowStyle,
              background: f.focused ? '#fde68a' : 'transparent',
              borderTop: i > 0 ? '1px solid #bfdbfe' : 'none',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700 }}>{f.name}</span>
            <span
              title={f.dangling ? 'aponta para memória já liberada (ponteiro pendente)' : undefined}
              style={{ fontSize: 12, whiteSpace: 'nowrap', ...(f.dangling ? danglingStyle : {}) }}
            >
              {f.text}
            </span>
            {f.kind === 'ptr' && <Handle type="source" position={Position.Right} id={f.name} style={handleStyle} />}
          </div>
        ))}
      </div>
      <div style={addressStyle}>{data.address}</div>
    </div>
  );
}

// NULL não é um objeto: é a ausência de alvo. Por isso é desenhado como o símbolo de "terra" (⏚),
// sem caixa, onde a seta termina, com a legenda NULL embaixo.
export function NullNode({ data }) {
  const down = data.orient === 'down'; // seta chegando de cima (pilha); senão chega da esquerda
  const bar = { stroke: '#6b7280', strokeWidth: 2.5, strokeLinecap: 'round' };
  return (
    <div style={{ fontFamily: MONO, color: '#6b7280' }}>
      <Tags tags={data.tags} />
      <div
        style={{
          position: 'relative',
          width: 28,
          height: down ? 28 : BOX_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Handle type="target" position={Position.Left} id="in" style={hiddenHandle} />
        <Handle type="target" position={Position.Top} id="up" style={hiddenHandle} />
        <Handle type="target" position={Position.Top} id="topA" style={{ ...hiddenHandle, left: '28%' }} />
        <Handle type="target" position={Position.Top} id="topB" style={{ ...hiddenHandle, left: '72%' }} />
        <Handle type="target" position={Position.Bottom} id="backIn" style={hiddenHandle} />
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: down ? 'rotate(90deg)' : undefined }} aria-hidden="true">
          <line x1="4" y1="2" x2="4" y2="26" {...bar} />
          <line x1="11" y1="7" x2="11" y2="21" {...bar} />
          <line x1="18" y1="11" x2="18" y2="17" {...bar} />
        </svg>
      </div>
      <div style={{ ...addressStyle, marginTop: down ? 4 : -4, fontWeight: 700 }}>NULL</div>
    </div>
  );
}

// Registro dos tipos de nó — passado para <ReactFlow nodeTypes={...} />
export const nodeTypes = { listNode: ListNode, descNode: DescNode, nullNode: NullNode };
