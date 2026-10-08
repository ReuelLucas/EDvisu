import { useEffect, useRef } from 'react';
import { FUNCTIONS, SOURCE, STRUCTS } from './cListings';
import { MONO, VarPill } from './LinkedListNode';
import { addressOf } from './linkedListSteps';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 12,
  color: '#1f2937',
  textAlign: 'left',
};
const titleStyle = { margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#374151' };
const codeBoxStyle = {
  margin: 0,
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontFamily: MONO,
  fontSize: 12,
  overflowX: 'auto',
};
const captionStyle = { margin: '8px 0 0', fontSize: 11, color: '#6b7280', lineHeight: 1.4 };
const ACTIVE_BG = '#fde68a';
const ACTIVE_BORDER = '#f59e0b';

// Uma linha de código com número de linha do arquivo original; destaca a linha ativa.
function CodeLine({ line, active, lineRef }) {
  return (
    <div
      ref={lineRef}
      style={{
        display: 'flex',
        whiteSpace: 'pre',
        background: active ? ACTIVE_BG : 'transparent',
        borderLeft: `3px solid ${active ? ACTIVE_BORDER : 'transparent'}`,
        fontWeight: active ? 700 : 400,
      }}
    >
      <span style={{ width: 30, flexShrink: 0, textAlign: 'right', paddingRight: 8, color: '#9ca3af', userSelect: 'none', fontWeight: 400 }}>
        {line.n}
      </span>
      <span style={{ paddingRight: 8 }}>{line.text || ' '}</span>
    </div>
  );
}

// ---------- structs reais do lista_int.c ----------

function StructDiagram({ cells, color }) {
  return (
    <div style={{ display: 'flex', border: `2px solid ${color}`, borderRadius: 8, width: 'fit-content', fontFamily: MONO }}>
      {cells.map((c, i) => (
        <div key={c.name} style={{ padding: '6px 12px', textAlign: 'center', borderLeft: i > 0 ? `1px solid ${color}` : 'none' }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>{c.type}</div>
          <div style={{ fontWeight: 700 }}>{c.name}</div>
        </div>
      ))}
    </div>
  );
}

export function StructPanel() {
  const block = (lines) => (
    <div style={{ ...codeBoxStyle, padding: '4px 0' }}>
      {lines.map((l) => (
        <CodeLine key={l.n} line={l} active={false} />
      ))}
    </div>
  );
  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>Estruturas ({SOURCE.file})</h3>
      {block(STRUCTS.elemento)}
      <div style={{ marginTop: 8 }}>
        <StructDiagram color="#374151" cells={[{ type: 'int', name: 'valor' }, { type: 'struct elemento*', name: 'prox' }]} />
      </div>
      <div style={{ marginTop: 12 }}>{block(STRUCTS.lista)}</div>
      <div style={{ marginTop: 8 }}>
        <StructDiagram color="#1d4ed8" cells={[{ type: 'Elem*', name: 'inicio' }, { type: 'int', name: 'qtd' }]} />
      </div>
      <p style={captionStyle}>
        Lista é um ponteiro para a struct lista (o descritor). Ela guarda onde a cadeia de Elem começa e quantos nós existem.
      </p>
    </section>
  );
}

// ---------- variáveis locais da função em execução ----------

function sameVar(a, b) {
  return a.kind === b.kind && a.target === b.target && a.value === b.value && a.dangling === b.dangling && a.uninit === b.uninit;
}

function PointerValue({ v }) {
  if (v.uninit) return <span style={{ color: '#b45309' }}>? (lixo)</span>;
  if (v.target === null) return <span>NULL</span>;
  if (v.dangling) {
    return (
      <span>
        {addressOf(v.target)} <span style={{ color: '#dc2626' }}>(liberado)</span>
      </span>
    );
  }
  return (
    <span>
      {addressOf(v.target)} <span style={{ color: '#6b7280' }}>→ {v.pointee ?? '?'}</span>
    </span>
  );
}

export function VariablesPanel({ vars, previousVars }) {
  // linhas alteradas em relação ao passo anterior ficam destacadas
  const isChanged = (v) => {
    const before = previousVars?.find((p) => p.name === v.name);
    return !before || !sameVar(before, v);
  };
  const th = { textAlign: 'left', fontSize: 10, color: '#6b7280', fontWeight: 600, padding: '0 6px 4px' };
  const td = { padding: '4px 6px', verticalAlign: 'middle' };

  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>Variáveis</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 12 }}>
        <thead>
          <tr>
            <th style={th}>nome</th>
            <th style={th}>tipo</th>
            <th style={th}>valor</th>
          </tr>
        </thead>
        <tbody>
          {vars.map((v) => (
            <tr key={v.name} style={{ background: previousVars && isChanged(v) ? '#fef9c3' : 'transparent' }}>
              <td style={td}>
                <VarPill name={v.name} />
              </td>
              <td style={{ ...td, color: '#6b7280' }}>{v.type}</td>
              <td style={td}>{v.kind === 'int' ? v.value : <PointerValue v={v} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={captionStyle}>Amarelo = mudou neste passo. Endereços são ilustrativos.</p>
    </section>
  );
}

// ---------- trecho em execução (fica ao lado da explicação de cada passo) ----------

const CONTEXT_LINES = 2;

export function SnippetBar({ fn, line }) {
  const lines = fn ? FUNCTIONS[fn] : null;
  const activeIndex = lines ? lines.findIndex((l) => l.id === line) : -1;

  if (!lines || activeIndex < 0) {
    return (
      <div style={{ ...cardStyle, fontSize: 13, color: '#6b7280' }}>
        O trecho de código em execução aparece aqui a cada passo.
      </div>
    );
  }
  const from = Math.max(0, activeIndex - CONTEXT_LINES);
  const to = Math.min(lines.length - 1, activeIndex + CONTEXT_LINES);
  const slice = lines.slice(from, to + 1);

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '6px 12px', fontSize: 11, color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontFamily: MONO }}>
        {SOURCE.file} · {fn}() · linhas {slice[0].n}–{slice[slice.length - 1].n}
      </div>
      <div style={{ ...codeBoxStyle, border: 'none', borderRadius: 0, fontSize: 12.5, padding: '4px 0' }}>
        {slice.map((l) => (
          <CodeLine key={l.n} line={l} active={l.id === line} />
        ))}
      </div>
    </div>
  );
}

// ---------- função completa com a linha em execução destacada ----------

export function CodePanel({ fn, line }) {
  const lines = fn ? FUNCTIONS[fn] : null;
  const activeRef = useRef(null);

  // mantém a linha ativa visível quando a função é longa
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [fn, line]);

  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>Código C{fn ? ` — ${fn}()` : ''}</h3>
      {lines ? (
        <div style={{ ...codeBoxStyle, padding: '4px 0', fontSize: 11 }}>
          {lines.map((l) => {
            const active = l.id !== null && l.id === line;
            return <CodeLine key={l.n} line={l} active={active} lineRef={active ? activeRef : undefined} />;
          })}
        </div>
      ) : (
        <p style={{ ...captionStyle, margin: 0 }}>A função aparece aqui quando você executar uma operação.</p>
      )}
    </section>
  );
}
