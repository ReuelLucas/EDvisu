import { DESC_ID, KINDS, NULL_ID, addressOf, eid, pointerText } from './memoryModel';

const FLOATING_OFFSET_Y = 130; // quanto um nó "solto" desce em relação à fileira
const STACK_STEP_Y = 120; // distância vertical entre nós da pilha
const STACK_BOX_W = 132; // largura fixa dos nós da pilha (alinha as setas verticais)
const STACK_NULL_W = 28;
const STACK_FLOAT_X = 230; // nó solto da pilha sai para a direita
const NULL_LEFT_ID = 'nullL'; // NULL à esquerda (campo ant do primeiro nó da lista dupla)

const COLOR_EDGE = '#374151';
const COLOR_EDGE_FOCUS = '#16a34a';
const COLOR_EDGE_DETACHED = '#9ca3af';
const COLOR_EDGE_DANGLING = '#dc2626';
const U_PATH = { offset: 26, borderRadius: 12 }; // setas que contornam a fileira por baixo

// Traduz um snapshot (ver memoryModel.js) para o formato do React Flow.
// A tela é sempre DERIVADA do snapshot: nada de estado visual paralelo.
export function snapshotToFlow(snapshot) {
  const { list, order, floating, vars, focusEdge, focusField } = snapshot;
  const ghosts = snapshot.ghosts ?? {};
  const cfg = KINDS[list.kind];
  const stack = cfg.layout === 'stack';
  const inline = cfg.layout === 'inline' || stack;
  const out = stack ? 'down' : 'prox'; // alça de saída do campo prox
  const inn = stack ? 'up' : 'in'; // alça de entrada
  const doubly = cfg.nodeFields.includes('ant');
  const circular = cfg.head === 'circular';

  const nodeOf = (id) => list.nodes[id] ?? ghosts[id];
  const exists = (id) => Boolean(nodeOf(id));
  const indexOf = Object.fromEntries(order.map((id, i) => [id, i]));

  const rowX0 = cfg.rowX0;
  const posX = (i) => rowX0 + i * cfg.spacing;
  const descHeight = 22 + 22 + 28 * cfg.fields.length + 18;
  const descPos = inline ? { x: 0, y: -10 } : { x: 0, y: -(descHeight + 80) };

  // Variáveis-ponteiro viram "etiquetas" sobre o objeto para o qual apontam
  // (li -> descritor, NULL -> nó NULL). Não-inicializadas não têm alvo; pendentes só aparecem
  // enquanto o nó liberado ainda está desenhado (passo do free).
  const tagsByNode = {};
  vars.forEach((v) => {
    if (v.kind !== 'ptr' || v.uninit) return;
    if (v.dangling && !ghosts[v.target]) return;
    const key = v.target ?? NULL_ID;
    tagsByNode[key] = [...(tagsByNode[key] ?? []), { name: v.name, dangling: Boolean(v.dangling) }];
  });

  // ---------- arestas ----------
  const edges = [];
  let rightNullUsed = false;
  let leftNullUsed = false;

  const addEdge = ({ source, sourceHandle, field, logicalTarget, target, targetHandle, type, detached = false, dangling = false }) => {
    const id = eid(source, field, logicalTarget);
    const focused = id === focusEdge;
    const color = focused ? COLOR_EDGE_FOCUS : dangling ? COLOR_EDGE_DANGLING : detached ? COLOR_EDGE_DETACHED : COLOR_EDGE;
    edges.push({
      id,
      source,
      sourceHandle,
      target,
      targetHandle,
      type,
      pathOptions: type === 'smoothstep' ? U_PATH : undefined,
      animated: focused,
      zIndex: focused ? 10 : 0,
      style: { stroke: color, strokeWidth: focused ? 3 : 2, strokeDasharray: dangling || detached ? '6 4' : undefined },
      markerEnd: { type: 'arrowclosed', color }, // 'arrowclosed' = MarkerType.ArrowClosed
    });
  };

  // campos ponteiro do descritor
  list.desc.fields.forEach((f) => {
    if (f.kind !== 'ptr' || f.value === undefined) return;
    const t = f.value;
    if (t !== null && !exists(t)) return;
    if (t === null) rightNullUsed = true;
    addEdge({
      source: DESC_ID,
      sourceHandle: f.name,
      field: f.name,
      logicalTarget: t,
      target: t ?? NULL_ID,
      targetHandle: inline ? 'in' : f.name === 'final' ? 'topB' : 'topA',
      dangling: t !== null && Boolean(ghosts[t]),
    });
  });

  // campos ponteiro dos nós vivos (o nó liberado não desenha setas de saída)
  Object.values(list.nodes).forEach((node) => {
    const detached = floating[node.id] === 'removendo';
    cfg.nodeFields.forEach((field) => {
      const t = node[field];
      if (t === undefined || (t !== null && !exists(t))) return;
      const dangling = t !== null && Boolean(ghosts[t]);

      if (field === 'ant') {
        if (t === null) leftNullUsed = true;
        addEdge({
          source: node.id, sourceHandle: 'back', field, logicalTarget: t,
          target: t ?? NULL_LEFT_ID, targetHandle: 'backIn', type: 'smoothstep', detached, dangling,
        });
        return;
      }
      if (t === null) {
        rightNullUsed = true;
        addEdge({ source: node.id, sourceHandle: out, field, logicalTarget: null, target: NULL_ID, targetHandle: inn, detached });
      } else if (indexOf[t] > indexOf[node.id]) {
        addEdge({ source: node.id, sourceHandle: out, field, logicalTarget: t, target: t, targetHandle: inn, detached, dangling });
      } else {
        // seta de volta (anel da lista circular): contorna a fileira por baixo
        addEdge({
          source: node.id, sourceHandle: 'back', field, logicalTarget: t, target: t, targetHandle: 'backIn',
          type: 'smoothstep', detached, dangling,
        });
      }
    });
  });

  // ---------- nós ----------
  const nodes = [
    {
      id: DESC_ID,
      type: 'descNode',
      position: descPos,
      draggable: false,
      data: {
        title: cfg.descStruct,
        address: addressOf(DESC_ID),
        tags: tagsByNode[DESC_ID] ?? [],
        fields: list.desc.fields.map((f) => {
          const label = f.kind === 'ptr' ? pointerText(list, f.value) : { text: String(f.value), dangling: false };
          return { name: f.name, kind: f.kind, text: label.text, dangling: label.dangling, focused: f.name === focusField };
        }),
      },
    },
  ];

  const backOut = doubly ? '17%' : circular ? '75%' : null;
  const backIn = doubly ? '83%' : circular ? '25%' : null;

  order.forEach((id, index) => {
    const node = nodeOf(id);
    const ptrCell = (field) => ({ key: field, label: field, kind: 'ptr', ...pointerText(list, node[field]) });
    const cells = [
      ...(doubly ? [ptrCell('ant')] : []),
      { key: 'valor', label: 'valor', kind: 'int', text: node.valor === null ? '?' : String(node.valor), dangling: false },
      ptrCell('prox'),
    ];
    nodes.push({
      id,
      type: 'listNode',
      position: stack
        ? { x: rowX0 + (floating[id] ? STACK_FLOAT_X : 0), y: index * STACK_STEP_Y }
        : { x: posX(index), y: floating[id] ? FLOATING_OFFSET_Y : 0 },
      draggable: false,
      data: {
        cells,
        address: addressOf(id),
        tags: tagsByNode[id] ?? [],
        state: ghosts[id] ? 'liberado' : (floating[id] ?? null),
        backOut,
        backIn,
        vertical: stack,
        boxWidth: stack ? STACK_BOX_W : null,
      },
    });
  });

  // NULL à direita: sempre nas listas/pilha/fila; na circular só quando alguém aponta para NULL
  const nullTags = tagsByNode[NULL_ID] ?? [];
  if (!circular || rightNullUsed || nullTags.length) {
    nodes.push({
      id: NULL_ID,
      type: 'nullNode',
      position: stack
        ? { x: rowX0 + 0.8 * STACK_BOX_W - STACK_NULL_W / 2, y: order.length * STACK_STEP_Y }
        : { x: posX(order.length), y: 0 },
      draggable: false,
      data: { tags: nullTags, orient: stack ? 'down' : 'right' },
    });
  }
  if (cfg.leftNull && (leftNullUsed || doubly)) {
    nodes.push({ id: NULL_LEFT_ID, type: 'nullNode', position: { x: 0, y: 0 }, draggable: false, data: { tags: [] } });
  }

  return { nodes, edges };
}
