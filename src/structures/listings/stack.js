// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um `id` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: 'PauloHARocha/EDL-2026-1',
  commit: '8e45a405aef1407eb690c5d8ce0fc49d862bbc8e',
  path: 'estruturas-de-dados/Pilha/Dinamica/pilha_int.c',
  file: 'pilha_int.c',
};

export const STRUCTS = {
  elemento: [
    { n: 4, text: 'typedef struct elemento{' },
    { n: 5, text: '    int valor;' },
    { n: 6, text: '    struct elemento *prox;' },
    { n: 7, text: '}Elem;' },
  ],
  desc: [
    { n: 9, text: 'typedef struct pilha {' },
    { n: 10, text: '    struct elemento *topo;' },
    { n: 11, text: '    int qtd;' },
    { n: 12, text: '}*Pilha;' },
  ],
};

export const FUNCTIONS = {
  push: [
    { n: 23, id: 'sig', text: 'int push(Pilha p, int valor) {' },
    { n: 24, id: 'ifp', text: '    if (p == NULL) return 1;' },
    { n: 25, id: 'malloc', text: '    Elem *no = malloc(sizeof(struct elemento));' },
    { n: 26, id: 'ifno', text: '    if (no == NULL) return 1;' },
    { n: 27, id: 'setvalor', text: '    no->valor = valor;' },
    { n: 28, id: 'ifvazia', text: '    if (p->qtd == 0) {' },
    { n: 29, id: 'proxnull', text: '        no->prox = NULL;' },
    { n: 30, id: null, text: '    } else {' },
    { n: 31, id: 'proxtopo', text: '        no->prox = p->topo;' },
    { n: 32, id: null, text: '    }' },
    { n: 33, id: 'settopo', text: '    p->topo = no;' },
    { n: 34, id: 'qtdinc', text: '    p->qtd++;' },
    { n: 35, id: 'ret0', text: '    return 0;' },
    { n: 36, id: null, text: '}' },
  ],
  pop: [
    { n: 38, id: 'sig', text: 'int pop(Pilha p){' },
    { n: 39, id: 'auxinit', text: '    Elem* aux = p->topo;' },
    { n: 40, id: null, text: '' },
    { n: 41, id: 'iftopo', text: '    if(p->topo != NULL){' },
    { n: 42, id: 'settopo', text: '        p->topo = p->topo->prox;' },
    { n: 43, id: null, text: '    }' },
    { n: 44, id: null, text: '    else{' },
    { n: 45, id: 'ret1', text: '        return 1;' },
    { n: 46, id: null, text: '    }' },
    { n: 47, id: null, text: '' },
    { n: 48, id: 'qtddec', text: '    p->qtd--;' },
    { n: 49, id: null, text: '' },
    { n: 50, id: 'free', text: '    free(aux);' },
    { n: 51, id: null, text: '' },
    { n: 52, id: 'ret0', text: '    return 0;' },
    { n: 53, id: null, text: '}' },
  ],
  peek: [
    { n: 55, id: 'sig', text: 'int peek(Pilha p, int *valor){' },
    { n: 56, id: 'ifguard', text: '    if(p == NULL || p->topo == NULL){' },
    { n: 57, id: 'ret1', text: '        return 1;' },
    { n: 58, id: null, text: '    }' },
    { n: 59, id: 'setvalor', text: '    *valor = p->topo->valor;' },
    { n: 60, id: 'ret0', text: '    return 0;' },
    { n: 61, id: null, text: '}' },
  ],
  size: [
    { n: 63, id: 'sig', text: 'int size(Pilha p){' },
    { n: 64, id: null, text: '' },
    { n: 65, id: 'ifp', text: '    if(p ==NULL){' },
    { n: 66, id: 'retz', text: '        return 0;' },
    { n: 67, id: null, text: '    }' },
    { n: 68, id: 'ret', text: '    return p->qtd;' },
    { n: 69, id: null, text: '}' },
  ],
};
