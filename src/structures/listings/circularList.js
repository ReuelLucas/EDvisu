// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um `id` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: 'PauloHARocha/EDL-2026-1',
  commit: '8e45a405aef1407eb690c5d8ce0fc49d862bbc8e',
  path: 'estruturas-de-dados/Lista/Lista-Unicamente-Encadeada-Circular/lista_int.c',
  file: 'lista_int.c',
};

export const STRUCTS = {
  elemento: [
    { n: 4, text: 'typedef struct elemento{' },
    { n: 5, text: '    int valor;' },
    { n: 6, text: '    struct elemento* prox;' },
    { n: 7, text: '} Elem;' },
  ],
  desc: [
    { n: 9, text: 'typedef struct lista{' },
    { n: 10, text: '    Elem* final;' },
    { n: 11, text: '    int qtd;' },
    { n: 12, text: '}* Lista;' },
  ],
};

export const FUNCTIONS = {
  inserir_inicio: [
    { n: 23, id: 'sig', text: 'int inserir_inicio(Lista li, int valor){' },
    { n: 24, id: 'malloc', text: '    Elem* no = malloc(sizeof(Elem));' },
    { n: 25, id: 'ifno', text: '    if(no != NULL){' },
    { n: 26, id: 'setvalor', text: '        no->valor = valor;' },
    { n: 27, id: 'ifvazia', text: '        if(li->final == NULL){' },
    { n: 28, id: 'selfprox', text: '            no->prox = no;' },
    { n: 29, id: 'setfinal', text: '            li->final = no;' },
    { n: 30, id: null, text: '        }else{' },
    { n: 31, id: 'setprox', text: '            no->prox = li->final->prox;' },
    { n: 32, id: 'finalprox', text: '            li->final->prox = no;' },
    { n: 33, id: null, text: '        }' },
    { n: 34, id: 'qtdinc', text: '        li->qtd++;' },
    { n: 35, id: 'ret0', text: '        return 0;' },
    { n: 36, id: null, text: '    }' },
    { n: 37, id: 'ret1', text: '    return 1;' },
    { n: 38, id: null, text: '}' },
  ],
  inserir_final: [
    { n: 41, id: 'sig', text: 'int inserir_final(Lista li, int valor){' },
    { n: 42, id: 'ifli', text: '    if(li == NULL)' },
    { n: 43, id: 'retli', text: '        return 1;' },
    { n: 44, id: 'malloc', text: '    Elem* no = malloc(sizeof(Elem));' },
    { n: 45, id: 'ifno', text: '    if(no == NULL)' },
    { n: 46, id: 'retno', text: '        return 1;' },
    { n: 47, id: 'setvalor', text: '    no->valor = valor;' },
    { n: 48, id: 'ifvazia', text: '    if(li->final == NULL){' },
    { n: 49, id: 'setfinal', text: '        li->final = no;' },
    { n: 50, id: 'selfprox', text: '        no->prox = no;' },
    { n: 51, id: null, text: '    }else{' },
    { n: 52, id: 'setprox', text: '        no->prox = li->final->prox;' },
    { n: 53, id: 'finalprox', text: '        li->final->prox = no;' },
    { n: 54, id: 'setfinal2', text: '        li->final = no;' },
    { n: 55, id: null, text: '    }' },
    { n: 56, id: 'qtdinc', text: '    li->qtd++;' },
    { n: 57, id: 'ret0', text: '    return 0;' },
    { n: 58, id: null, text: '}' },
  ],
};
