// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Tabela hash SEM tratamento de colisão, com vetor de char (a hash do repositório guarda int*; aqui o vetor guarda
// o próprio char). A struct Hash, chaveDivisao e a ideia (Rejeita / Sobrescreve) são as do repositório.
// Conferir/substituir pela versão do livro "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes).

#define VAZIO '\0'

typedef struct hash {
    int qtd;
    int TABLE_SIZE;
    char *itens;
} Hash;

Hash* criaHash(int TABLE_SIZE) {
    Hash *ha = malloc(sizeof(Hash));
    if (ha != NULL) {
        ha->TABLE_SIZE = TABLE_SIZE;
        ha->qtd = 0;
        ha->itens = malloc(TABLE_SIZE * sizeof(char));
        if (ha->itens == NULL) {
            free(ha);
            return NULL;
        }
        for (int i = 0; i < TABLE_SIZE; i++) {
            ha->itens[i] = VAZIO;
        }
    }
    return ha;
}

void liberaHash(Hash *ha) {
    if (ha == NULL)
        return;

    free(ha->itens);
    free(ha);
}

int insereHash_SemColisao_Rejeita(Hash *ha, char c) {
    if (ha == NULL || ha->qtd == ha->TABLE_SIZE)
        return 0;

    int pos = chaveDivisao(c, ha->TABLE_SIZE);
    if (ha->itens[pos] != VAZIO)
        return 0;

    ha->itens[pos] = c;
    ha->qtd++;
    return 1;
}

int insereHash_SemColisao_Sobrescreve(Hash *ha, char c) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(c, ha->TABLE_SIZE);
    if (ha->itens[pos] == VAZIO)
        ha->qtd++;
    ha->itens[pos] = c;
    return 1;
}

int buscaHash_SemColisao(Hash *ha, char c, char *out) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(c, ha->TABLE_SIZE);
    if (ha->itens[pos] != c)
        return 0;

    *out = ha->itens[pos];
    return 1;
}

int removeHash_SemColisao(Hash *ha, char c) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(c, ha->TABLE_SIZE);
    if (ha->itens[pos] != c)
        return 0;

    ha->itens[pos] = VAZIO;
    ha->qtd--;
    return 1;
}
