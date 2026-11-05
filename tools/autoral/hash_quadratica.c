// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Tabela hash com endereçamento aberto (vetor de int): sondagem quadrática.
// Segue os slides da aula (04-EDL-Aula-Tabela Hash): posição vazia (o "NULL" dos slides) e a marcação REMOVIDO.
// As chaves são inteiros >= 0, para que -1 e -2 possam ser usados como marcações. chaveDivisao é a do repositório.
// Conferir/substituir pela versão do livro "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes).

#define VAZIO -1
#define REMOVIDO -2

typedef struct hash {
    int qtd;
    int TABLE_SIZE;
    int *itens;
} Hash;

Hash* criaHash(int TABLE_SIZE) {
    Hash *ha = malloc(sizeof(Hash));
    if (ha != NULL) {
        ha->TABLE_SIZE = TABLE_SIZE;
        ha->qtd = 0;
        ha->itens = malloc(TABLE_SIZE * sizeof(int));
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

int sondagemQuadratica(int pos, int i, int TABLE_SIZE) {
    pos = pos + 2*i + 5*i*i;
    return pos % TABLE_SIZE;
}

int insereHash_SondagemQuadratica(Hash *ha, int valor) {
    if (ha == NULL || ha->qtd == ha->TABLE_SIZE)
        return 0;

    int pos = chaveDivisao(valor, ha->TABLE_SIZE);
    int livre = -1;
    for (int i = 0; i < ha->TABLE_SIZE; i++) {
        int novaPos = sondagemQuadratica(pos, i, ha->TABLE_SIZE);
        if (ha->itens[novaPos] == VAZIO || ha->itens[novaPos] == REMOVIDO) {
            if (livre == -1)
                livre = novaPos;
            if (ha->itens[novaPos] == VAZIO)
                break;
        } else if (ha->itens[novaPos] == valor)
            return 0;
    }
    if (livre == -1)
        return 0;

    ha->itens[livre] = valor;
    ha->qtd++;
    return 1;
}

int buscaHash_SondagemQuadratica(Hash *ha, int valor, int *out) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(valor, ha->TABLE_SIZE);
    for (int i = 0; i < ha->TABLE_SIZE; i++) {
        int novaPos = sondagemQuadratica(pos, i, ha->TABLE_SIZE);
        if (ha->itens[novaPos] == VAZIO)
            return 0;
        if (ha->itens[novaPos] == valor) {
            *out = novaPos;
            return 1;
        }
    }
    return 0;
}

int removeHash_SondagemQuadratica(Hash *ha, int valor) {
    if (ha == NULL)
        return 0;

    int pos = chaveDivisao(valor, ha->TABLE_SIZE);
    for (int i = 0; i < ha->TABLE_SIZE; i++) {
        int novaPos = sondagemQuadratica(pos, i, ha->TABLE_SIZE);
        if (ha->itens[novaPos] == VAZIO)
            return 0;
        if (ha->itens[novaPos] == valor) {
            ha->itens[novaPos] = REMOVIDO;
            ha->qtd--;
            return 1;
        }
    }
    return 0;
}
