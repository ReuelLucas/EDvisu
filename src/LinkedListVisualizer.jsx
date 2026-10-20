import { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './LinkedListNode';
import { CodePanel, LocalsStrip, MemoryPanel, StructPanel, VariablesPanel } from './Panels';
import { snapshotToFlow } from './snapshotToFlow';
import { STRUCTURES, getStructure } from './structures';
import { useStepper } from './useStepper';

const buttonStyle = {
  padding: '6px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  background: '#ffffff',
  color: '#1f2937',
  fontSize: 13,
  cursor: 'pointer',
};
const disabledStyle = { opacity: 0.45, cursor: 'not-allowed' };
const cardStyle = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10 };

const ANIMATIONS = `
.react-flow__node { transition: transform 0.45s ease; }
@keyframes edv-pop {
  0%   { transform: scale(0.2); box-shadow: 0 0 0 0 rgba(22,163,74,0.55); }
  55%  { transform: scale(1.35); box-shadow: 0 0 0 7px rgba(22,163,74,0.18); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22,163,74,0); }
}
@keyframes edv-fade { from { opacity: 1; } to { opacity: 0.55; } }
.edv-born { animation: edv-pop 0.6s ease-out; }
.edv-died { animation: edv-fade 0.6s ease-out forwards; }
`;

function Btn({ disabled, style, mono, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        ...buttonStyle,
        ...(mono ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 12 } : {}),
        ...(disabled ? disabledStyle : {}),
        ...style,
      }}
      {...props}
    />
  );
}

// Desenha o snapshot atual. Precisa estar dentro de <ReactFlowProvider> para usar fitView.
function Canvas({ snapshot }) {
  const { nodes, edges } = useMemo(() => snapshotToFlow(snapshot), [snapshot]);
  const { fitView } = useReactFlow();
  const nodeCount = nodes.length;

  // Reenquadra quando a quantidade de nós muda (inserção/remoção)
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.12, duration: 300, maxZoom: 1 }), 60);
    return () => clearTimeout(timer);
  }, [nodeCount, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

// Uma estrutura de dados completa: botões, desenho, passo a passo e painéis laterais.
function StructureView({ structure }) {
  const stepper = useStepper(structure);
  const { snapshot, previousSnapshot, index, total, isPlaying, next, prev } = stepper;
  const [input, setInput] = useState('60');

  const parsed = input.trim() === '' ? Number.NaN : Number(input);
  const validInput = Number.isInteger(parsed);
  const stepping = total > 1;
  const { listing } = structure;
  const hasValueButtons = structure.buttons.withValue.length > 0;

  // Setas ← → navegam pelos passos (exceto quando o foco está num campo de entrada)
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.tagName === 'INPUT') return;
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [next, prev]);

  return (
    <>
      <main style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {hasValueButtons && (
            <>
              <label htmlFor="valor" style={{ fontSize: 13 }}>
                valor:
              </label>
              <input
                id="valor"
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ width: 70, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, color: '#1f2937', background: '#fff' }}
              />
              {structure.buttons.withValue.map((name) => (
                <Btn key={name} mono disabled={!validInput} onClick={() => stepper.run(name, parsed)}>
                  {name}
                </Btn>
              ))}
              <span style={{ width: 1, alignSelf: 'stretch', background: '#d1d5db', margin: '0 4px' }} />
            </>
          )}
          {structure.buttons.without.map((name) => (
            <Btn key={name} mono onClick={() => stepper.run(name)}>
              {name}
            </Btn>
          ))}
          <Btn onClick={stepper.reset} style={{ marginLeft: 'auto' }}>
            Reiniciar estrutura
          </Btn>
        </div>

        <div style={{ ...cardStyle, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <LocalsStrip fn={snapshot.fn} vars={snapshot.vars} previousVars={previousSnapshot?.vars ?? null} />
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <div style={{ position: 'absolute', inset: 0 }}>
              <ReactFlowProvider>
                <Canvas snapshot={snapshot} />
              </ReactFlowProvider>
            </div>
          </div>
        </div>

        {/* A cada passo: a explicação do que a linha em execução faz (o código fica no painel lateral) */}
        <div
          style={{
            ...cardStyle,
            padding: '10px 12px',
            fontSize: 14,
            lineHeight: 1.45,
            ...(snapshot.crash ? { borderColor: '#dc2626', background: '#fef2f2' } : {}),
          }}
        >
          {stepping && (
            <div style={{ fontSize: 11, fontWeight: 700, color: snapshot.crash ? '#dc2626' : '#6b7280', marginBottom: 4 }}>
              PASSO {index + 1} DE {total}
              {snapshot.crash ? ' · FALHA DE SEGMENTAÇÃO' : ''}
            </div>
          )}
          {snapshot.message}
          {!stepping && structure.initialNote && <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>{structure.initialNote}</div>}
          {!stepping && structure.limitation && <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>{structure.limitation}</div>}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn disabled={!stepping || index === 0} onClick={prev}>
            ◀ Voltar
          </Btn>
          <Btn disabled={!stepping} onClick={stepper.togglePlay}>
            {isPlaying ? '⏸ Pausar' : '▶ Reproduzir'}
          </Btn>
          <Btn disabled={!stepping || index >= total - 1} onClick={next}>
            Avançar ▶
          </Btn>
          <input
            type="range"
            min={0}
            max={Math.max(total - 1, 0)}
            value={index}
            disabled={!stepping}
            onChange={(e) => stepper.goTo(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </main>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minHeight: 0 }}>
        <CodePanel listing={listing} fn={snapshot.fn} line={snapshot.line} />
        <VariablesPanel
          vars={snapshot.vars}
          previousVars={previousSnapshot?.vars ?? null}
          list={snapshot.list}
          ghosts={snapshot.ghosts}
          previousList={previousSnapshot?.list ?? null}
        />
        <MemoryPanel list={snapshot.list} ghosts={snapshot.ghosts} previousList={previousSnapshot?.list ?? null} />
        <StructPanel structure={structure} />
      </aside>
    </>
  );
}

export function LinkedListVisualizer() {
  const [structureId, setStructureId] = useState(STRUCTURES[0].id);
  const structure = getStructure(structureId);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 400px',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        gap: 12,
        padding: 16,
        // ocupa a janela inteira, ignorando limites de largura/margem do #root do template do Vite
        position: 'fixed',
        inset: 0,
        boxSizing: 'border-box',
        background: '#f9fafb',
        color: '#1f2937',
        textAlign: 'left',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <style>{ANIMATIONS}</style>

      {/* seletor de estrutura: cada uma traz o seu código C e as suas funções */}
      <nav style={{ gridColumn: '1 / -1', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }} aria-label="Estruturas de dados">
        <strong style={{ fontSize: 14, marginRight: 8 }}>EDvisu</strong>
        {STRUCTURES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === structureId}
            onClick={() => setStructureId(s.id)}
            style={{
              ...buttonStyle,
              ...(s.id === structureId ? { background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8', fontWeight: 600 } : {}),
            }}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <StructureView key={structure.id} structure={structure} />
    </div>
  );
}
