// Funções iguais em mais de uma estrutura (o código C é idêntico, só muda o arquivo).
import { createRecorder, descVar, elemVar, getField, intVar } from '../memoryModel';

// tamanho_lista(Lista li): percorre a lista contando os nós
export function buildTamanhoLista(list) {
  const rec = createRecorder('tamanho_lista', list);
  const valorDe = (id) => rec.state.nodes[id].valor;
  let countDeclared = false;
  let auxDeclared = false;
  let count = 0;
  let aux = null;

  rec.makeVars = () => {
    const vars = [descVar(rec.state)];
    if (countDeclared) vars.push(intVar('count', count));
    if (auxDeclared) vars.push(elemVar('aux', aux, rec.state));
    return vars;
  };

  rec.push('sig', 'Chamada tamanho_lista(li): vamos contar os nós percorrendo a lista.');
  rec.push('ifli', 'li == NULL? Não: o descritor da lista existe.');

  countDeclared = true;
  rec.push('count', 'count = 0: o contador começa em zero.');

  auxDeclared = true;
  aux = getField(rec.state, 'inicio');
  rec.push('auxinit', aux === null ? 'aux = li->inicio: a lista está vazia, então aux vale NULL.' : `aux = li->inicio: aux aponta para o primeiro nó (${valorDe(aux)}).`);

  while (aux !== null) {
    rec.push('while', `aux != NULL? Sim: ainda há nós para contar (nó ${valorDe(aux)}).`);
    count += 1;
    rec.push('inc', `count++: o nó ${valorDe(aux)} foi contado, count vale ${count}.`);
    aux = rec.state.nodes[aux].prox;
    rec.push('avanca', aux === null ? 'aux = aux->prox: chegou ao fim da lista, aux vale NULL.' : `aux = aux->prox: aux avança para o nó ${valorDe(aux)}.`);
  }
  rec.push('while', 'aux != NULL? Não: chegamos ao fim da lista. O laço termina.');
  rec.ret('ret', `return count: a lista tem ${count} ${count === 1 ? 'nó' : 'nós'}.`);
  return { steps: rec.steps, list: rec.state };
}
