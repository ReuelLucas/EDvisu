// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um `id` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: 'PauloHARocha/EDL-2026-1',
  commit: '8e45a405aef1407eb690c5d8ce0fc49d862bbc8e',
  path: 'estruturas-de-dados/Fila/Fila-dinamica/fila_int.c',
  file: 'fila_int.c',
};

export const STRUCTS = {
  elemento: [
    { n: 4, text: 'typedef struct elemento{' },
    { n: 5, text: '    int valor;' },
    { n: 6, text: '    struct elemento *prox;' },
    { n: 7, text: '}Elem;' },
  ],
  desc: [
    { n: 9, text: 'typedef struct fila {' },
    { n: 10, text: '    struct elemento *inicio;' },
    { n: 11, text: '    struct elemento *final;' },
    { n: 12, text: '    int qtd;' },
    { n: 13, text: '}*Fila;' },
  ],
};

export const FUNCTIONS = {
  enqueue: [
    { n: 25, id: 'sig', text: 'int enqueue(Fila f, int dado){' },
    { n: 26, id: 'iff', text: '    if(f == NULL) return 1;' },
    { n: 27, id: null, text: '' },
    { n: 28, id: 'malloc', text: '    Elem *no = malloc(sizeof(Elem));' },
    { n: 29, id: 'setvalor', text: '    no->valor = dado;' },
    { n: 30, id: 'setprox', text: '    no->prox = NULL;' },
    { n: 31, id: null, text: '' },
    { n: 32, id: 'iffinal', text: '    if(f->final == NULL){' },
    { n: 33, id: 'setinicio', text: '        f->inicio = no;' },
    { n: 34, id: null, text: '    }else{' },
    { n: 35, id: 'linkfinal', text: '        f->final->prox = no;' },
    { n: 36, id: null, text: '    }' },
    { n: 37, id: 'setfinal', text: '    f->final = no;' },
    { n: 38, id: 'qtdinc', text: '    f->qtd++;' },
    { n: 39, id: 'ret0', text: '    return 0;' },
    { n: 40, id: null, text: '}' },
  ],
  dequeue: [
    { n: 42, id: 'sig', text: 'int dequeue(Fila f){' },
    { n: 43, id: 'ifguard', text: '    if(f == NULL || f->qtd == 0) return 1;' },
    { n: 44, id: null, text: '' },
    { n: 45, id: 'auxinit', text: '    Elem *aux = f->inicio;' },
    { n: 46, id: 'setinicio', text: '    f->inicio = aux->prox; // f->inicio->prox' },
    { n: 47, id: 'ifvazio', text: '    if(f->inicio == NULL)' },
    { n: 48, id: 'setfinal', text: '        f->final = NULL;' },
    { n: 49, id: null, text: '' },
    { n: 50, id: 'free', text: '    free(aux);' },
    { n: 51, id: 'qtddec', text: '    f->qtd--;' },
    { n: 52, id: 'ret0', text: '    return 0;' },
    { n: 53, id: null, text: '}' },
  ],
};
