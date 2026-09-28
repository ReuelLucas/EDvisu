import { Handle, Position } from 'reactflow';

export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Cor de cada variável (etiquetas sobre os nós e painel de variáveis)
const VAR_COLORS = {
  li: '#2563eb',
  no: '#16a34a',
  aux: '#ea580c',
  ant: '#7c3aed',
  count: '#0f766e',
};
export const colorOfVar = (name) => VAR_COLORS[name] ?? '#6b7280';

export function VarPill({ name }) {
  return (
    <span
      style={{
        background: colorOfVar(name),
        color: '#fff',
        borderRadius: 10,
        padding: '1px 8px',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: MONO,
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
        <VarPill key={tag.name} name={tag.name} />
      ))}
    </div>
  );
}

const handleStyle = { width: 8, height: 8, background: '#374151', border: 'none' };
const cellStyle = { padding: '5px 10px', textAlign: 'center', minWidth: 56 };
const labelStyle = { fontSize: 9, color: '#6b7280' };
const addressStyle = { textAlign: 'center', fontSize: 10, color: '#6b7280', marginTop: 4 };
const DANGLING = '#dc2626';
// ponteiro para memória liberada: vermelho e riscado
const danglingStyle = { color: DANGLING, textDecoration: 'line-through' };

const STATE_STYLES = {
  removendo: { border: '#dc2626', background: '#fef2f2', dash: 'dashed' },
  novo: { border: '#16a34a', background: '#f0fdf4', dash: 'solid' },
  normal: { border: '#374151', background: '#ffffff', dash: 'solid' },
};

// Elem: desenhado como a struct [ valor | prox ] + endereço abaixo.
export function ListNode({ data }) {
  const look = STATE_STYLES[data.state] ?? STATE_STYLES.normal;
  return (
    <div style={{ fontFamily: MONO, color: '#1f2937' }}>
      <Tags tags={data.tags} />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          height: 52,
          boxSizing: 'border-box',
          border: `2px ${look.dash} ${look.border}`,
          borderRadius: 8,
          background: look.background,
        }}
      >
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <div style={{ ...cellStyle, borderRight: `1px solid ${look.border}` }}>
          <div style={labelStyle}>valor</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{data.valor ?? '?'}</div>
        </div>
        <div style={cellStyle}>
          <div style={{ ...labelStyle, ...(data.proxDangling ? { color: DANGLING, fontWeight: 700 } : {}) }}>
            {data.proxDangling ? 'pendente' : 'prox'}
          </div>
          <div style={{ fontSize: 12, marginTop: 2, ...(data.proxDangling ? danglingStyle : {}) }}>{data.proxText}</div>
        </div>
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </div>
      <div style={addressStyle}>{data.address}</div>
    </div>
  );
}

// Descritor (struct lista): campos inicio e qtd. Cada campo ponteiro tem a sua saída (Handle).
export function DescNode({ data }) {
  const rowStyle = { position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 14, height: 28, alignItems: 'center', padding: '0 10px' };
  return (
    <div style={{ fontFamily: MONO, color: '#1f2937', width: 160 }}>
      <Tags tags={data.tags} />
      <div style={{ border: '2px solid #1d4ed8', borderRadius: 8, background: '#eff6ff' }}>
        <div style={{ height: 22, lineHeight: '22px', padding: '0 10px', fontSize: 10, color: '#1d4ed8', borderBottom: '1px solid #1d4ed8' }}>
          struct lista
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

// Nó especial que representa NULL (fim da lista)
export function NullNode({ data }) {
  return (
    <div style={{ fontFamily: MONO, color: '#6b7280' }}>
      <Tags tags={data.tags} />
      <div
        style={{
          position: 'relative',
          height: 52,
          boxSizing: 'border-box',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          border: '2px solid #9ca3af',
          borderRadius: 8,
          background: '#f3f4f6',
          fontWeight: 700,
        }}
      >
        <Handle type="target" position={Position.Left} style={handleStyle} />
        NULL
      </div>
    </div>
  );
}

// Registro dos tipos de nó — passado para <ReactFlow nodeTypes={...} />
export const nodeTypes = { listNode: ListNode, descNode: DescNode, nullNode: NullNode };
