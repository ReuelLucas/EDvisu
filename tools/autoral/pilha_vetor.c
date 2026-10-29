// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Escritas no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

int busca_valor(Pilha p, int valor, int* pos){
    if(p == NULL || p->topo == 0)
        return 1;
    int i = p->topo - 1;
    while(i >= 0){
        if(p->dados[i] == valor){
            *pos = i;
            return 0;
        }
        i--;
    }
    return 1;
}

int remove_valor(Pilha p, int valor){
    if(p == NULL || p->topo == 0)
        return 1;
    int i = p->topo - 1;
    while(i >= 0 && p->dados[i] != valor)
        i--;
    if(i < 0)
        return 1;
    while(i < p->topo - 1){
        p->dados[i] = p->dados[i + 1];
        i++;
    }
    p->topo--;
    return 0;
}
