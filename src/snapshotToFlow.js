import { DESC_ID, NULL_ID, addressOf } from './linkedListSteps';

const SPACING_X = 185; // distância horizontal entre nós
const FIRST_NODE_X = 215; // o descritor ocupa o começo da linha
const FLOATING_OFFSET_Y = 120; // quanto um nó "solto" desce em relação à fileira
const DESC_OFFSET_Y = -12; // alinha a linha "inicio" do descritor com o centro dos nós

const COLOR_EDGE = '#374151';
const COLOR_EDGE_FOCUS = '#16a34a';
const COLOR_EDGE_DETACHED = '#9ca3af';

// Rótulo de um ponteiro: NULL, ? (lixo) ou endereço. `dangling` = aponta para memória já liberada
// (a tela mostra o endereço em vermelho e riscado, sem mudar a largura do nó).
function pointerLabel(list, target) {
  if (target === undefined) return { text: '?', dangling: false };
  if (target === null) return { text: 'NULL', dangling: false };
  return { text: addressOf(target), dangling: list.freed.includes(target) };
}

// Traduz um snapshot (ver linkedListSteps.js) para o formato do React Flow.
// A tela é sempre DERIVADA do snapshot: nada de estado visual paralelo.
export function snapshotToFlow(snapshot) {
  const { list, order, floating, vars, focusEdge, focusField } = snapshot;

  // Variáveis-ponteiro viram "etiquetas" sobre o objeto para o qual apontam
  // (li -> descritor, NULL -> nó NULL). Não-inicializadas e pendentes não têm alvo visível.
  const tagsByNode = {};
  vars.forEach((v) => {
    if (v.kind !== 'ptr' || v.uninit || v.dangling) return;
    const key = v.target ?? NULL_ID;
    tagsByNode[key] = [...(tagsByNode[key] ?? []), { name: v.name }];
  });

  // descritor (struct lista)
  const nodes = [
    {
      id: DESC_ID,
      type: 'descNode',
      position: { x: 0, y: DESC_OFFSET_Y },
      draggable: false,
      data: {
        address: addressOf(DESC_ID),
        tags: tagsByNode[DESC_ID] ?? [],
        fields: list.desc.fields.map((f) => {
          const label = f.kind === 'ptr' ? pointerLabel(list, f.value) : { text: String(f.value), dangling: false };
          return { name: f.name, kind: f.kind, text: label.text, dangling: label.dangling, focused: f.name === focusField };
        }),
      },
    },
  ];

  // nós Elem
  order.forEach((id, index) => {
    const node = list.nodes[id];
    const prox = pointerLabel(list, node.prox);
    nodes.push({
      id,
      type: 'listNode',
      position: { x: FIRST_NODE_X + index * SPACING_X, y: floating[id] ? FLOATING_OFFSET_Y : 0 },
      draggable: false,
      data: {
        valor: node.valor,
        proxText: prox.text,
        proxDangling: prox.dangling,
        address: addressOf(id),
        tags: tagsByNode[id] ?? [],
        state: floating[id] ?? null,
      },
    });
  });

  nodes.push({
    id: NULL_ID,
    type: 'nullNode',
    position: { x: FIRST_NODE_X + order.length * SPACING_X, y: 0 },
    draggable: false,
    data: { tags: tagsByNode[NULL_ID] ?? [] },
  });

  // Uma aresta por ponteiro já inicializado que aponta para algo visível
  // (NULL ou um nó vivo). Ponteiro para memória liberada não desenha aresta.
  const edges = [];
  const addEdge = (source, sourceHandle, target, { detached = false } = {}) => {
    const id = sourceHandle ? `${source}.${sourceHandle}->${target}` : `${source}->${target}`;
    const focused = id === focusEdge;
    const color = focused ? COLOR_EDGE_FOCUS : detached ? COLOR_EDGE_DETACHED : COLOR_EDGE;
    edges.push({
      id,
      source,
      sourceHandle: sourceHandle ?? undefined,
      target,
      animated: focused,
      style: { stroke: color, strokeWidth: focused ? 3 : 2, strokeDasharray: detached ? '6 4' : undefined },
      markerEnd: { type: 'arrowclosed', color }, // 'arrowclosed' = MarkerType.ArrowClosed
    });
  };
  const visible = (target) => target === null || Boolean(list.nodes[target]);

  list.desc.fields.forEach((f) => {
    if (f.kind === 'ptr' && f.value !== undefined && visible(f.value)) addEdge(DESC_ID, f.name, f.value ?? NULL_ID);
  });
  Object.values(list.nodes).forEach((node) => {
    if (node.prox === undefined || !visible(node.prox)) return;
    addEdge(node.id, null, node.prox ?? NULL_ID, { detached: floating[node.id] === 'removendo' });
  });

  return { nodes, edges };
}
