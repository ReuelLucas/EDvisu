// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Tabela hash com ENCADEAMENTO SEPARADO (lista encadeada em cada posição). Usa chaveDivisao do repositório.
// Escrita no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

typedef struct no {
    int valor;
    struct no *prox;
} No;

typedef struct hash {
    int qtd;
    int TABLE_SIZE;
    No **itens;
} Hash;

Hash* criaHash(int TABLE_SIZE) {
    Hash *ha = malloc(sizeof(Hash));
    if (ha != NULL) {
        ha->TABLE_SIZE = TABLE_SIZE;
        ha->qtd = 0;
        ha->itens = malloc(TABLE_SIZE * sizeof(No*));
        if (ha->itens == NULL) {
            free(ha);
            return NULL;
        }
        for (int i = 0; i < TABLE_SIZE; i++) {
            ha->itens[i] = NULL;
        }
    }
    return ha;
}

void liberaHash(Hash *ha) {
    if (ha == NULL)
        return;

    for (int i = 0; i < ha->TABLE_SIZE; i++) {
        No *aux = ha->itens[i];
        while (aux != NULL) {
            No *prox = aux->prox;
            free(aux);
            aux = prox;
        }
    }
    free(ha->itens);
    free(ha);
}

int insereHash_Encadeada(Hash *ha, int valor) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(valor, ha->TABLE_SIZE);
    No *aux = ha->itens[pos];
    while (aux != NULL) {
        if (aux->valor == valor)
            return 0;
        aux = aux->prox;
    }

    No *novo = malloc(sizeof(No));
    if (novo == NULL)
        return 0;
    novo->valor = valor;
    novo->prox = ha->itens[pos];
    ha->itens[pos] = novo;
    ha->qtd++;
    return 1;
}

int buscaHash_Encadeada(Hash *ha, int valor, int *out) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(valor, ha->TABLE_SIZE);
    No *aux = ha->itens[pos];
    while (aux != NULL) {
        if (aux->valor == valor) {
            *out = aux->valor;
            return 1;
        }
        aux = aux->prox;
    }
    return 0;
}

int removeHash_Encadeada(Hash *ha, int valor) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(valor, ha->TABLE_SIZE);
    No *ant = NULL;
    No *aux = ha->itens[pos];
    while (aux != NULL && aux->valor != valor) {
        ant = aux;
        aux = aux->prox;
    }
    if (aux == NULL)
        return 0;

    if (ant == NULL)
        ha->itens[pos] = aux->prox;
    else
        ant->prox = aux->prox;
    free(aux);
    ha->qtd--;
    return 1;
}
