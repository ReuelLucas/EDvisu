// GERADO a partir do código C real da disciplina. Não edite à mão: regenere com tools/gen-listings.mjs.
// Texto verbatim, com o nº da linha no arquivo (n). Cada linha executável tem um `id` que os passos usam
// para dizer "esta é a linha em execução".

export const SOURCE = {
  repo: 'PauloHARocha/EDL-2026-1',
  commit: '8e45a405aef1407eb690c5d8ce0fc49d862bbc8e',
  path: 'estruturas-de-dados/Tabela-hash/1_tabela_hash.c',
  file: '1_tabela_hash.c',
};

export const STRUCTS = {
  desc: [
    { n: 6, text: '#define VAZIO \'\\0\'' },
    { n: 7, text: '' },
    { n: 8, text: 'typedef struct hash {' },
    { n: 9, text: '    int qtd;' },
    { n: 10, text: '    int TABLE_SIZE;' },
    { n: 11, text: '    char *itens;' },
    { n: 12, text: '} Hash;' },
  ],
};

// funções que NÃO vêm do repositório do professor (escritas pelo EDvisu; arquivo-fonte em tools/autoral)
export const AUTHORED = {"criaHash":"tools/autoral/hash_char.c","liberaHash":"tools/autoral/hash_char.c","insereHash_SemColisao_Rejeita":"tools/autoral/hash_char.c","insereHash_SemColisao_Sobrescreve":"tools/autoral/hash_char.c","buscaHash_SemColisao":"tools/autoral/hash_char.c","removeHash_SemColisao":"tools/autoral/hash_char.c"};

// funções do repositório cujo NOME foi trocado no EDvisu: { nome usado aqui: nome original }
export const RENAMED = {};

export const FUNCTIONS = {
  chaveDivisao: [
    { n: 15, id: 'sig', text: 'int chaveDivisao(int chave, int TABLE_SIZE) {' },
    { n: 16, id: null, text: '    // O operador & 0x7FFFFFFF remove o bit de sinal do inteiro.' },
    { n: 17, id: null, text: '    // Isso garante que o resultado da função seja sempre não negativo, mesmo que a chave seja um número negativo.' },
    { n: 18, id: null, text: '    // Exemplo:' },
    { n: 19, id: null, text: '    //  chave = -10 (em binário começa com 1, indicando sinal negativo)' },
    { n: 20, id: null, text: '    //  chave & 0x7FFFFFFF zera o bit de sinal e resulta no valor positivo equivalente.' },
    { n: 21, id: null, text: '    // Depois disso, aplicamos o operador módulo (%), que devolve o resto da divisão da chave pelo tamanho da tabela.' },
    { n: 22, id: null, text: '    // Isso garante que o índice final sempre esteja dentro dos limites do vetor.' },
    { n: 23, id: 'ret', text: '    return (chave & 0x7FFFFFFF) % TABLE_SIZE;' },
    { n: 24, id: null, text: '}' },
  ],
  criaHash: [
    { n: 14, id: 'sig', text: 'Hash* criaHash(int TABLE_SIZE) {' },
    { n: 15, id: 'mallocha', text: '    Hash *ha = malloc(sizeof(Hash));' },
    { n: 16, id: 'ifha', text: '    if (ha != NULL) {' },
    { n: 17, id: 'settable', text: '        ha->TABLE_SIZE = TABLE_SIZE;' },
    { n: 18, id: 'setqtd', text: '        ha->qtd = 0;' },
    { n: 19, id: 'mallocitens', text: '        ha->itens = malloc(TABLE_SIZE * sizeof(char));' },
    { n: 20, id: 'ifitens', text: '        if (ha->itens == NULL) {' },
    { n: 21, id: 'freefail', text: '            free(ha);' },
    { n: 22, id: 'retnull', text: '            return NULL;' },
    { n: 23, id: null, text: '        }' },
    { n: 24, id: 'for', text: '        for (int i = 0; i < TABLE_SIZE; i++) {' },
    { n: 25, id: 'setvazio', text: '            ha->itens[i] = VAZIO;' },
    { n: 26, id: null, text: '        }' },
    { n: 27, id: null, text: '    }' },
    { n: 28, id: 'ret', text: '    return ha;' },
    { n: 29, id: null, text: '}' },
  ],
  liberaHash: [
    { n: 31, id: 'sig', text: 'void liberaHash(Hash *ha) {' },
    { n: 32, id: 'ifnull', text: '    if (ha == NULL)' },
    { n: 33, id: 'retnull', text: '        return;' },
    { n: 34, id: null, text: '' },
    { n: 35, id: 'freeitens', text: '    free(ha->itens);' },
    { n: 36, id: 'freeha', text: '    free(ha);' },
    { n: 37, id: null, text: '}' },
  ],
  insereHash_SemColisao_Rejeita: [
    { n: 39, id: 'sig', text: 'int insereHash_SemColisao_Rejeita(Hash *ha, char c) {' },
    { n: 40, id: 'ifguard', text: '    if (ha == NULL || ha->qtd == ha->TABLE_SIZE)' },
    { n: 41, id: 'retguard', text: '        return 0;' },
    { n: 42, id: null, text: '' },
    { n: 43, id: 'pos', text: '    int pos = chaveDivisao(c, ha->TABLE_SIZE);' },
    { n: 44, id: 'ifcol', text: '    if (ha->itens[pos] != VAZIO)' },
    { n: 45, id: 'retcol', text: '        return 0;' },
    { n: 46, id: null, text: '' },
    { n: 47, id: 'setitem', text: '    ha->itens[pos] = c;' },
    { n: 48, id: 'qtdinc', text: '    ha->qtd++;' },
    { n: 49, id: 'ret1', text: '    return 1;' },
    { n: 50, id: null, text: '}' },
  ],
  insereHash_SemColisao_Sobrescreve: [
    { n: 52, id: 'sig', text: 'int insereHash_SemColisao_Sobrescreve(Hash *ha, char c) {' },
    { n: 53, id: 'ifnull', text: '    if (ha == NULL)' },
    { n: 54, id: 'retnull', text: '        return 0;' },
    { n: 55, id: null, text: '' },
    { n: 56, id: 'pos', text: '    int pos = chaveDivisao(c, ha->TABLE_SIZE);' },
    { n: 57, id: 'ifvazio', text: '    if (ha->itens[pos] == VAZIO)' },
    { n: 58, id: 'qtdinc', text: '        ha->qtd++;' },
    { n: 59, id: 'setitem', text: '    ha->itens[pos] = c;' },
    { n: 60, id: 'ret1', text: '    return 1;' },
    { n: 61, id: null, text: '}' },
  ],
  buscaHash_SemColisao: [
    { n: 63, id: 'sig', text: 'int buscaHash_SemColisao(Hash *ha, char c, char *out) {' },
    { n: 64, id: 'ifnull', text: '    if (ha == NULL)' },
    { n: 65, id: 'retnull', text: '        return 0;' },
    { n: 66, id: null, text: '' },
    { n: 67, id: 'pos', text: '    int pos = chaveDivisao(c, ha->TABLE_SIZE);' },
    { n: 68, id: 'ifdiff', text: '    if (ha->itens[pos] != c)' },
    { n: 69, id: 'retdiff', text: '        return 0;' },
    { n: 70, id: null, text: '' },
    { n: 71, id: 'setout', text: '    *out = ha->itens[pos];' },
    { n: 72, id: 'ret1', text: '    return 1;' },
    { n: 73, id: null, text: '}' },
  ],
  removeHash_SemColisao: [
    { n: 75, id: 'sig', text: 'int removeHash_SemColisao(Hash *ha, char c) {' },
    { n: 76, id: 'ifnull', text: '    if (ha == NULL)' },
    { n: 77, id: 'retnull', text: '        return 0;' },
    { n: 78, id: null, text: '' },
    { n: 79, id: 'pos', text: '    int pos = chaveDivisao(c, ha->TABLE_SIZE);' },
    { n: 80, id: 'ifdiff', text: '    if (ha->itens[pos] != c)' },
    { n: 81, id: 'retdiff', text: '        return 0;' },
    { n: 82, id: null, text: '' },
    { n: 83, id: 'setvazio', text: '    ha->itens[pos] = VAZIO;' },
    { n: 84, id: 'qtddec', text: '    ha->qtd--;' },
    { n: 85, id: 'ret1', text: '    return 1;' },
    { n: 86, id: null, text: '}' },
  ],
};
