import { Fragment, useEffect, useRef, useState } from 'react';
import { MONO, VarPill, colorOfVar } from './LinkedListNode';
import { DESC_ID, addressOf, describeObject } from './memoryModel';

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
const linkButton = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
};
const ACTIVE_BG = '#fde68a';
const ACTIVE_BORDER = '#f59e0b';
const CHANGED_BG = '#fef9c3';
const DANGLING = '#dc2626';

// Uma linha de código. O número exibido (`num`) sempre começa em 1 dentro do trecho mostrado;
// o número real da linha no arquivo (line.n) continua nos dados, só não é exibido.
function CodeLine({ line, num, active, lineRef }) {
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
        {num}
      </span>
      <span style={{ paddingRight: 8 }}>{line.text || ' '}</span>
    </div>
  );
}

// ---------- structs reais do código C ----------

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

export function StructPanel({ structure }) {
  const { listing } = structure;
  const block = (lines) => (
    <div style={{ ...codeBoxStyle, padding: '4px 0' }}>
      {lines.map((l, i) => (
        <CodeLine key={l.n} line={l} num={i + 1} active={false} />
      ))}
    </div>
  );
  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>Estruturas ({listing.SOURCE.file})</h3>
      {structure.structs.map((s, i) => (
        <div key={s.key} style={{ marginTop: i > 0 ? 12 : 0 }}>
          {block(listing.STRUCTS[s.key])}
          <div style={{ marginTop: 8 }}>
            <StructDiagram color={s.color} cells={s.cells} />
          </div>
        </div>
      ))}
      <p style={captionStyle}>{structure.structNote}</p>
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
        {addressOf(v.target)} <span style={{ color: DANGLING }}>(liberado)</span>
      </span>
    );
  }
  return (
    <span>
      {addressOf(v.target)} <span style={{ color: '#6b7280' }}>→ {v.pointee ?? '?'}</span>
    </span>
  );
}

function FieldsTable({ obj, previousObj }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: MONO, fontSize: 11.5 }}>
      <tbody>
        {obj.fields.map((f) => {
          const before = previousObj?.fields.find((p) => p.name === f.name);
          const changed = previousObj ? !before || before.text !== f.text : false;
          return (
            <tr key={f.name} style={{ background: changed ? CHANGED_BG : 'transparent' }}>
              <td style={{ padding: '2px 6px', fontWeight: 700 }}>{f.name}</td>
              <td style={{ padding: '2px 6px', color: '#6b7280' }}>{f.type}</td>
              <td style={{ padding: '2px 6px', textAlign: 'right' }}>
                <span style={f.dangling ? { color: DANGLING, textDecoration: 'line-through' } : undefined}>{f.text}</span>
                {f.dangling && <span style={{ color: DANGLING }}> pendente</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// O que há "dentro" do ponteiro: a struct completa para onde ele aponta.
function PointeeDetail({ v, list, ghosts, previousList }) {
  const note = { fontSize: 11, color: '#6b7280', lineHeight: 1.4 };
  if (v.uninit) return <div style={note}>Declarada sem valor: guarda lixo e ainda não aponta para nenhum objeto.</div>;
  if (v.target === null) return <div style={note}>NULL: não aponta para objeto nenhum. Acessar um campo por aqui ({'->'}) é erro.</div>;
  const obj = describeObject(list, v.target, ghosts);
  if (v.dangling) {
    return (
      <div style={{ ...note, color: DANGLING }}>
        Memória já liberada com free(): usar *{v.name} agora é comportamento indefinido.
        {obj ? ' (O conteúdo cinza no desenho é só para você ver o que estava lá.)' : ''}
      </div>
    );
  }
  if (!obj) return <div style={note}>Sem objeto neste endereço.</div>;
  const previousObj = previousList ? describeObject(previousList, v.target) : null;
  return (
    <div>
      <div style={{ fontSize: 11, color: '#374151', marginBottom: 2 }}>
        *{v.name} = {obj.type} @ {obj.address}
      </div>
      <FieldsTable obj={obj} previousObj={previousObj} />
    </div>
  );
}

export function VariablesPanel({ vars, previousVars, list, ghosts, previousList }) {
  const [open, setOpen] = useState({}); // nome da variável -> struct apontada expandida
  const isChanged = (v) => {
    const before = previousVars?.find((p) => p.name === v.name);
    return !before || !sameVar(before, v);
  };
  // variáveis que existiam no passo anterior e não existem mais (saíram do escopo)
  const gone = (previousVars ?? []).filter((p) => !vars.some((v) => v.name === p.name));
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
          {vars.map((v) => {
            const expandable = v.kind === 'ptr';
            const isOpen = Boolean(open[v.name]);
            return (
              <Fragment key={v.name}>
                <tr style={{ background: previousVars && isChanged(v) ? CHANGED_BG : 'transparent' }}>
                  <td style={td}>
                    {expandable ? (
                      <button
                        type="button"
                        title="Ver a struct completa para onde o ponteiro aponta"
                        aria-expanded={isOpen}
                        onClick={() => setOpen((o) => ({ ...o, [v.name]: !o[v.name] }))}
                        style={{ ...linkButton, color: '#6b7280', marginRight: 4, width: 12 }}
                      >
                        {isOpen ? '▾' : '▸'}
                      </button>
                    ) : (
                      <span style={{ display: 'inline-block', width: 16 }} />
                    )}
                    <VarPill name={v.name} />
                  </td>
                  <td style={{ ...td, color: '#6b7280' }}>{v.type}</td>
                  <td style={td}>
                    {v.kind === 'int' && v.value}
                    {v.kind === 'out' && <span>→ x do chamador = {v.value ?? '?'}</span>}
                    {v.kind === 'ptr' && <PointerValue v={v} />}
                  </td>
                </tr>
                {expandable && isOpen && (
                  <tr>
                    <td colSpan={3} style={{ padding: '2px 6px 8px 22px' }}>
                      <PointeeDetail v={v} list={list} ghosts={ghosts} previousList={previousList} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {gone.map((v) => (
            <tr key={`gone-${v.name}`} style={{ opacity: 0.55 }}>
              <td style={{ ...td, textDecoration: 'line-through' }}>
                <span style={{ display: 'inline-block', width: 16 }} />
                {v.name}
              </td>
              <td style={{ ...td, color: '#6b7280' }}>{v.type}</td>
              <td style={{ ...td, color: '#6b7280' }}>saiu do escopo</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={captionStyle}>Amarelo = mudou neste passo. Clique na seta ▸ para ver a struct inteira. Endereços são ilustrativos.</p>
    </section>
  );
}

// ---------- memória: todos os objetos, expansível ----------

export function MemoryPanel({ list, ghosts, previousList }) {
  const [expanded, setExpanded] = useState(false);
  const ids = [
    DESC_ID,
    ...Object.keys(list.nodes).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))),
    ...Object.keys(ghosts),
  ];
  const objects = ids.map((id) => describeObject(list, id, ghosts)).filter(Boolean);
  const liveNodes = Object.keys(list.nodes).length;
  const freedNow = Object.keys(ghosts).length;

  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ ...titleStyle, margin: 0 }}>Memória (heap)</h3>
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)} style={linkButton}>
          {expanded ? 'Recolher ▴' : 'Expandir ▾'}
        </button>
      </div>
      <p style={{ ...captionStyle, margin: '6px 0 0' }}>
        1 descritor + {liveNodes} {liveNodes === 1 ? 'nó' : 'nós'} alocados
        {freedNow ? ` · ${freedNow} liberado agora` : ''}
      </p>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {objects.map((obj) => {
            const previousObj = previousList ? describeObject(previousList, obj.id) : null;
            const isNew = previousList && !previousObj && !obj.freed;
            return (
              <div
                key={obj.id}
                style={{
                  border: `1px ${obj.freed ? 'dashed' : 'solid'} ${obj.freed ? '#9ca3af' : obj.id === DESC_ID ? '#1d4ed8' : '#d1d5db'}`,
                  borderRadius: 6,
                  padding: 6,
                  background: obj.freed ? '#f3f4f6' : '#fff',
                  opacity: obj.freed ? 0.8 : 1,
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 11, color: '#374151', marginBottom: 2 }}>
                  <strong>{obj.address}</strong> · {obj.type}
                  {obj.freed && <span style={{ color: DANGLING }}> · liberado</span>}
                  {isNew && <span style={{ color: '#16a34a' }}> · novo</span>}
                </div>
                <FieldsTable obj={obj} previousObj={obj.freed || isNew ? null : previousObj} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------- variáveis locais "vivas": um pontinho por ponteiro auxiliar ----------

// Mostra QUANDO cada ponteiro auxiliar (no, aux, ant) é criado e removido:
//  - pontinho cheio com anel pulsando = acabou de ser criado neste passo;
//  - pontinho vazado "?" = declarado, mas ainda sem valor (lixo);
//  - pontinho cinza riscado = saiu de escopo neste passo (some no passo seguinte).
export function LocalsStrip({ fn, vars, previousVars }) {
  const isAux = (v) => v.kind === 'ptr' && v.role !== 'desc';
  const alive = vars.filter(isAux);
  const before = (previousVars ?? []).filter(isAux);
  const born = (v) => previousVars !== null && previousVars !== undefined && !before.some((p) => p.name === v.name);
  const died = before.filter((p) => !alive.some((v) => v.name === p.name));

  const chip = { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 12 };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        minHeight: 34,
        padding: '4px 12px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fcfcfd',
        borderRadius: '10px 10px 0 0',
        fontSize: 12,
        color: '#6b7280',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
        Ponteiros auxiliares{fn ? ` de ${fn}()` : ''}:
      </span>
      {alive.length === 0 && died.length === 0 && <span style={{ fontSize: 11 }}>nenhum no momento</span>}
      {alive.map((v) => {
        const color = colorOfVar(v.name);
        const fresh = born(v);
        return (
          <span key={v.name} style={chip} title={v.uninit ? 'declarada, ainda sem valor (lixo)' : fresh ? 'criada neste passo' : 'em escopo'}>
            <span
              className={fresh ? 'edv-born' : undefined}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                boxSizing: 'border-box',
                background: v.uninit ? '#fff' : color,
                border: `2px solid ${color}`,
                color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#1f2937', fontWeight: 600 }}>{v.name}</span>
            {fresh && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>criada</span>}
            {v.uninit && <span style={{ fontSize: 10, color: '#b45309' }}>sem valor</span>}
          </span>
        );
      })}
      {died.map((v) => (
        <span key={`died-${v.name}`} className="edv-died" style={{ ...chip, color: '#9ca3af' }} title="saiu de escopo neste passo">
          <span style={{ width: 12, height: 12, borderRadius: '50%', boxSizing: 'border-box', border: '2px dashed #9ca3af', flexShrink: 0 }} />
          <span style={{ textDecoration: 'line-through' }}>{v.name}</span>
          <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>removida</span>
        </span>
      ))}
    </div>
  );
}

// ---------- função completa com a linha em execução destacada ----------

export function CodePanel({ listing, fn, line }) {
  const lines = fn ? listing.FUNCTIONS[fn] : null;
  const authored = fn ? listing.AUTHORED?.[fn] : null;
  const boxRef = useRef(null);
  const activeRef = useRef(null);

  // Rola a caixa de código (só ela, não a página) para manter a linha em execução no meio da vista.
  useEffect(() => {
    const box = boxRef.current;
    const el = activeRef.current;
    if (!box || !el) return;
    const target = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
    box.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [fn, line]);

  return (
    <section style={cardStyle}>
      <h3 style={titleStyle}>
        Código C{fn ? ` — ${fn}()` : ''}
        {fn && !authored && <span style={{ fontWeight: 400, color: '#6b7280' }}> · {listing.SOURCE.file}</span>}
        {authored && (
          <span style={{ fontWeight: 600, color: '#92400e', background: '#fef3c7', borderRadius: 6, padding: '1px 6px', marginLeft: 6, fontSize: 11 }}>
            autoral
          </span>
        )}
      </h3>
      {authored && (
        <p style={{ ...captionStyle, margin: '0 0 6px' }}>
          Esta função não está no repositório do professor: foi escrita no mesmo estilo (arquivo {authored.split('/').pop()}). Confira com o livro do Backes.
        </p>
      )}
      {lines ? (
        <div ref={boxRef} style={{ ...codeBoxStyle, position: 'relative', padding: '4px 0', fontSize: 12, maxHeight: 240, overflowY: 'auto' }}>
          {lines.map((l, i) => {
            const active = l.id !== null && l.id === line;
            return <CodeLine key={l.n} line={l} num={i + 1} active={active} lineRef={active ? activeRef : undefined} />;
          })}
        </div>
      ) : (
        <p style={{ ...captionStyle, margin: 0 }}>A função aparece aqui quando você executar uma operação.</p>
      )}
    </section>
  );
}

export { cardStyle, titleStyle, captionStyle };
