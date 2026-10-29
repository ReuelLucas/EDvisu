// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Escritas no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

int busca_valor(Fila f, int valor, int* pos){
    if(f == NULL || f->qtd == 0)
        return 1;
    int i = 0;
    while(i < f->qtd){
        if(f->dados[(f->inicio + i) % MAX] == valor){
            *pos = i;
            return 0;
        }
        i++;
    }
    return 1;
}

int remove_valor(Fila f, int valor){
    if(f == NULL || f->qtd == 0)
        return 1;
    int i = 0;
    while(i < f->qtd && f->dados[(f->inicio + i) % MAX] != valor)
        i++;
    if(i == f->qtd)
        return 1;
    while(i < f->qtd - 1){
        f->dados[(f->inicio + i) % MAX] = f->dados[(f->inicio + i + 1) % MAX];
        i++;
    }
    f->final = (f->final - 1 + MAX) % MAX;
    f->qtd--;
    return 0;
}
