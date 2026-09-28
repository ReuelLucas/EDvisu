import { useCallback, useEffect, useState } from 'react';
import { createList, idleSnapshot, runOperation } from './linkedListSteps';

const PLAY_INTERVAL_MS = 900;

function makeInitialModel(values) {
  const list = createList(values);
  return { list, steps: [idleSnapshot(list)] };
}

// Guarda a lista "confirmada" e os passos da operação atual.
// Avançar/voltar = mover o índice sobre o array de snapshots (nada é desfeito).
export function useStepper(initialValues) {
  const [model, setModel] = useState(() => makeInitialModel(initialValues));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const { steps } = model;
  const last = steps.length - 1;
  const isPlaying = playing && index < last;

  // operation = nome da função C (ver OPERATIONS em linkedListSteps.js)
  const run = useCallback((operation, valor) => {
    setModel((prev) => {
      const result = runOperation(operation, prev.list, valor);
      return { list: result.list, steps: result.steps };
    });
    setIndex(0);
    setPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setModel(makeInitialModel(initialValues));
    setIndex(0);
    setPlaying(false);
  }, [initialValues]);

  const next = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(i + 1, last));
  }, [last]);

  const prev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback(
    (target) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(target, last)));
    },
    [last],
  );

  const togglePlay = useCallback(() => {
    if (index >= last) {
      setIndex(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }, [index, last]);

  // Reprodução automática: avança um passo por vez enquanto isPlaying for true.
  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setTimeout(() => setIndex((i) => i + 1), PLAY_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, index]);

  return {
    snapshot: steps[index],
    previousSnapshot: index > 0 ? steps[index - 1] : null,
    index,
    total: steps.length,
    isPlaying,
    run,
    reset,
    next,
    prev,
    goTo,
    togglePlay,
  };
}
