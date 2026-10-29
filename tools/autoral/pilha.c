// FUNÇÕES AUTORAIS do EDvisu: NÃO estão no repositório do professor (PauloHARocha/EDL-2026-1).
// Escritas no mesmo estilo do repositório. Conferir/substituir pela versão do livro
// "Algoritmos e Estruturas de Dados em Linguagem C" (André Ricardo Backes), se desejado.

int busca_valor(Pilha p, int valor, int* pos){
    if(p == NULL || p->topo == NULL)
        return 1;
    Elem* aux = p->topo;
    int i = 0;
    while(aux != NULL){
        if(aux->valor == valor){
            *pos = i;
            return 0;
        }
        aux = aux->prox;
        i++;
    }
    return 1;
}

int remove_valor(Pilha p, int valor){
    if(p == NULL || p->topo == NULL)
        return 1;
    Elem* aux = p->topo;
    Elem* ant = NULL;
    while(aux != NULL && aux->valor != valor){
        ant = aux;
        aux = aux->prox;
    }
    if(aux == NULL)
        return 1;
    if(ant == NULL)
        p->topo = aux->prox;
    else
        ant->prox = aux->prox;
    free(aux);
    p->qtd--;
    return 0;
}
