import { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, ReactFlowProvider, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './LinkedListNode';
import { CodePanel, SnippetBar, StructPanel, VariablesPanel } from './Panels';
import { snapshotToFlow } from './snapshotToFlow';
import { useStepper } from './useStepper';

const INITIAL_VALUES = [10, 20, 30, 40, 50];

// Botões = funções do lista_int.c (o nome do botão é o nome da função em C)
const INSERTS = ['inserir_inicio', 'inserir_final'];
const OTHERS = ['remover_inicio', 'remover_final', 'tamanho_lista'];

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
    const timer = setTimeout(() => fitView({ padding: 0.2, duration: 300, maxZoom: 1 }), 60);
    return () => clearTimeout(timer);
  }, [nodeCount, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function LinkedListVisualizer() {
  const stepper = useStepper(INITIAL_VALUES);
  const { snapshot, previousSnapshot, index, total, isPlaying, next, prev } = stepper;
  const [input, setInput] = useState('60');

  const parsed = input.trim() === '' ? Number.NaN : Number(input);
  const validInput = Number.isInteger(parsed);
  const stepping = total > 1;

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 400px',
        gap: 16,
        padding: 16,
        height: '100vh',
        boxSizing: 'border-box',
        background: '#f9fafb',
        color: '#1f2937',
        textAlign: 'left',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Efeito de deslizar quando os nós mudam de posição */}
      <style>{'.react-flow__node { transition: transform 0.45s ease; }'}</style>

      <main style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
          {INSERTS.map((name) => (
            <Btn key={name} mono disabled={!validInput} onClick={() => stepper.run(name, parsed)}>
              {name}
            </Btn>
          ))}
          <span style={{ width: 1, alignSelf: 'stretch', background: '#d1d5db', margin: '0 4px' }} />
          {OTHERS.map((name) => (
            <Btn key={name} mono onClick={() => stepper.run(name)}>
              {name}
            </Btn>
          ))}
          <Btn onClick={stepper.reset} style={{ marginLeft: 'auto' }}>
            Reiniciar lista
          </Btn>
        </div>

        <div style={{ position: 'relative', flex: 1, minHeight: 0, ...cardStyle }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <ReactFlowProvider>
              <Canvas snapshot={snapshot} />
            </ReactFlowProvider>
          </div>
        </div>

        {/* A cada passo: o trecho de código em execução + a explicação do que ele faz */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: 12, alignItems: 'stretch' }}>
          <SnippetBar fn={snapshot.fn} line={snapshot.line} />
          <div style={{ ...cardStyle, padding: '10px 12px', fontSize: 14, lineHeight: 1.45 }}>
            {stepping && (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
                PASSO {index + 1} DE {total}
              </div>
            )}
            {snapshot.message}
          </div>
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
        <VariablesPanel vars={snapshot.vars} previousVars={previousSnapshot?.vars ?? null} />
        <CodePanel fn={snapshot.fn} line={snapshot.line} />
        <StructPanel />
      </aside>
    </div>
  );
}
