const { SudokuBinario, TAMANHO } = require('../src/sudokuBinario');

// Tabuleiro 6x6 totalmente preenchido e valido (usado como "gabarito" nos testes).
const RESOLVIDO = ['010110', '011001', '100101', '101010', '010011', '101100'];
// Mesmo tabuleiro com a ultima linha em branco (solucao unica: cada coluna precisa de 3 zeros e 3 uns).
const ULTIMA_LINHA_VAZIA = ['010110', '011001', '100101', '101010', '010011', '......'];

// Cria um tabuleiro vazio e preenche as celulas informadas: [[linha, coluna, valor], ...]
function comValores(valores) {
  const sudoku = SudokuBinario.vazio();
  valores.forEach(([l, c, v]) => sudoku.definir(l, c, v));
  return sudoku;
}

describe('Tabuleiro 6x6', () => {
  test('o tamanho do tabuleiro e 6', () => {
    expect(TAMANHO).toBe(6);
  });

  test('um tabuleiro vazio tem 36 celulas vazias', () => {
    const sudoku = SudokuBinario.vazio();
    expect(sudoku.paraTexto()).toEqual(Array(6).fill('......'));
    expect(sudoku.valor(0, 0)).toBeNull();
    expect(sudoku.valor(5, 5)).toBeNull();
  });

  test('o tabuleiro inicial usa "0", "1" e "." (vazio) e marca as celulas dadas como fixas', () => {
    const sudoku = new SudokuBinario(['0.....', '.1....', '......', '......', '......', '.....1']);
    expect(sudoku.valor(0, 0)).toBe(0);
    expect(sudoku.valor(1, 1)).toBe(1);
    expect(sudoku.valor(0, 1)).toBeNull();
    expect(sudoku.ehFixa(0, 0)).toBe(true);
    expect(sudoku.ehFixa(0, 1)).toBe(false);
  });

  test.each([
    ['nao e uma lista', 'abc'],
    ['tem 5 linhas', ['......', '......', '......', '......', '......']],
    ['tem 7 linhas', Array(7).fill('......')],
    ['tem linha com 5 colunas', ['......', '.....', '......', '......', '......', '......']],
    ['tem linha com 7 colunas', ['.......', '......', '......', '......', '......', '......']],
    ['tem caractere invalido', ['..2...', '......', '......', '......', '......', '......']],
    ['tem linha que nao e texto', [123456, '......', '......', '......', '......', '......']],
  ])('rejeita tabuleiro inicial invalido: %s', (_nome, entrada) => {
    expect(() => new SudokuBinario(entrada)).toThrow(RangeError);
  });

  test('valor() e ehFixa() rejeitam coordenadas fora do tabuleiro', () => {
    const sudoku = SudokuBinario.vazio();
    expect(() => sudoku.valor(6, 0)).toThrow(RangeError);
    expect(() => sudoku.valor(0, -1)).toThrow(RangeError);
    expect(() => sudoku.ehFixa(0, 6)).toThrow(RangeError);
    expect(() => sudoku.valor(0.5, 0)).toThrow(RangeError);
  });
});

describe('Preenchimento das celulas', () => {
  test('definir coloca 0 ou 1 em uma celula livre', () => {
    const sudoku = SudokuBinario.vazio();
    sudoku.definir(2, 3, 1);
    sudoku.definir(4, 4, 0);
    expect(sudoku.valor(2, 3)).toBe(1);
    expect(sudoku.valor(4, 4)).toBe(0);
  });

  test('uma celula livre pode ser sobrescrita', () => {
    const sudoku = SudokuBinario.vazio();
    sudoku.definir(0, 0, 1);
    sudoku.definir(0, 0, 0);
    expect(sudoku.valor(0, 0)).toBe(0);
  });

  test('limpar esvazia uma celula preenchida', () => {
    const sudoku = SudokuBinario.vazio();
    sudoku.definir(1, 1, 1);
    sudoku.limpar(1, 1);
    expect(sudoku.valor(1, 1)).toBeNull();
  });

  test('nao e possivel alterar nem limpar uma celula fixa', () => {
    const sudoku = new SudokuBinario(['0.....', '......', '......', '......', '......', '......']);
    expect(() => sudoku.definir(0, 0, 1)).toThrow('Celula fixa');
    expect(() => sudoku.definir(0, 0, 0)).toThrow('Celula fixa');
    expect(() => sudoku.limpar(0, 0)).toThrow('Celula fixa');
    expect(sudoku.valor(0, 0)).toBe(0);
  });

  test.each([[2], ['1'], [null], [undefined], [0.5]])(
    'rejeita o valor %p (so 0 ou 1 sao permitidos)',
    (valor) => {
      expect(() => SudokuBinario.vazio().definir(0, 0, valor)).toThrow(RangeError);
    },
  );

  test('definir e limpar rejeitam coordenadas fora do tabuleiro', () => {
    const sudoku = SudokuBinario.vazio();
    expect(() => sudoku.definir(6, 0, 1)).toThrow(RangeError);
    expect(() => sudoku.definir(0, 6, 1)).toThrow(RangeError);
    expect(() => sudoku.limpar(-1, 0)).toThrow(RangeError);
  });
});

describe('Regra 1: no maximo dois numeros iguais seguidos', () => {
  test('tres zeros seguidos em uma linha violam a regra', () => {
    const sudoku = comValores([[0, 0, 0], [0, 1, 0], [0, 2, 0]]);
    expect(sudoku.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 0 });
  });

  test('tres uns seguidos em uma coluna violam a regra', () => {
    const sudoku = comValores([[1, 2, 1], [2, 2, 1], [3, 2, 1]]);
    expect(sudoku.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'coluna', indice: 2 });
  });

  test('a violacao e detectada no meio e no fim da linha', () => {
    const meio = comValores([[3, 1, 1], [3, 2, 1], [3, 3, 1]]);
    const fim = comValores([[4, 3, 0], [4, 4, 0], [4, 5, 0]]);
    expect(meio.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 3 });
    expect(fim.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 4 });
  });

  test('dois iguais seguidos sao permitidos', () => {
    const sudoku = comValores([[0, 0, 0], [0, 1, 0], [0, 2, 1], [0, 3, 1]]);
    expect(sudoku.conflitos()).toEqual([]);
  });

  test('uma celula vazia ou um valor diferente no meio quebra a sequencia', () => {
    const comVazio = comValores([[0, 0, 0], [0, 1, 0], [0, 3, 0], [0, 4, 0]]); // 0 0 . 0 0
    const comOutro = comValores([[1, 0, 1], [1, 1, 1], [1, 2, 0], [1, 3, 1]]); // 1 1 0 1
    expect(comVazio.conflitos()).toEqual([]);
    expect(comOutro.conflitos()).toEqual([]);
  });

  test('quatro iguais seguidos geram um unico conflito para a linha', () => {
    const sudoku = comValores([[0, 0, 1], [0, 1, 1], [0, 2, 1], [0, 3, 1]]);
    const tres = sudoku.conflitos().filter((c) => c.regra === 'TRES_SEGUIDOS');
    expect(tres).toEqual([{ regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 0 }]);
  });
});

describe('Regra 2: mesma quantidade de 0s e 1s em cada linha e coluna', () => {
  test('mais de tres zeros em uma linha violam a regra', () => {
    // 0 0 . 0 . 0 -> quatro zeros, sem tres seguidos
    const sudoku = comValores([[2, 0, 0], [2, 1, 0], [2, 3, 0], [2, 5, 0]]);
    expect(sudoku.conflitos()).toEqual([{ regra: 'EXCESSO', tipo: 'linha', indice: 2, valor: 0 }]);
  });

  test('mais de tres uns em uma coluna violam a regra', () => {
    const sudoku = comValores([[0, 4, 1], [1, 4, 1], [3, 4, 1], [5, 4, 1]]);
    expect(sudoku.conflitos()).toEqual([{ regra: 'EXCESSO', tipo: 'coluna', indice: 4, valor: 1 }]);
  });

  test('tres zeros e tres uns em uma linha estao corretos', () => {
    const sudoku = comValores([[0, 0, 0], [0, 1, 1], [0, 2, 0], [0, 3, 1], [0, 4, 0], [0, 5, 1]]);
    expect(sudoku.conflitos()).toEqual([]);
  });

  test('ate tres de cada valor e permitido enquanto a linha ainda esta incompleta', () => {
    const sudoku = comValores([[0, 0, 0], [0, 2, 0], [0, 4, 0]]);
    expect(sudoku.conflitos()).toEqual([]);
  });
});

describe('Regra 3: nao pode haver duas linhas (ou colunas) iguais', () => {
  test('duas linhas completas iguais violam a regra', () => {
    const linha = [0, 1, 0, 1, 0, 1];
    const sudoku = SudokuBinario.vazio();
    linha.forEach((v, c) => {
      sudoku.definir(0, c, v);
      sudoku.definir(1, c, v);
    });
    expect(sudoku.conflitos()).toEqual([{ regra: 'DUPLICADA', tipo: 'linha', indices: [0, 1] }]);
  });

  test('duas colunas completas iguais violam a regra', () => {
    const coluna = [0, 1, 0, 1, 0, 1];
    const sudoku = SudokuBinario.vazio();
    coluna.forEach((v, l) => {
      sudoku.definir(l, 0, v);
      sudoku.definir(l, 1, v);
    });
    expect(sudoku.conflitos()).toEqual([{ regra: 'DUPLICADA', tipo: 'coluna', indices: [0, 1] }]);
  });

  test('linhas incompletas iguais nao sao conflito', () => {
    const sudoku = comValores([[0, 0, 0], [0, 1, 1], [1, 0, 0], [1, 1, 1]]);
    expect(sudoku.conflitos()).toEqual([]);
  });

  test('linhas completas diferentes nao sao conflito', () => {
    const sudoku = SudokuBinario.vazio();
    [0, 1, 0, 1, 0, 1].forEach((v, c) => sudoku.definir(0, c, v));
    [1, 0, 1, 0, 1, 0].forEach((v, c) => sudoku.definir(1, c, v));
    expect(sudoku.conflitos()).toEqual([]);
  });
});

describe('Fim de jogo', () => {
  test('o gabarito de teste respeita todas as regras', () => {
    const sudoku = new SudokuBinario(RESOLVIDO);
    expect(sudoku.conflitos()).toEqual([]);
  });

  test('completo() e falso enquanto houver celula vazia e verdadeiro quando tudo esta preenchido', () => {
    expect(SudokuBinario.vazio().completo()).toBe(false);
    expect(new SudokuBinario(ULTIMA_LINHA_VAZIA).completo()).toBe(false);
    expect(new SudokuBinario(RESOLVIDO).completo()).toBe(true);
  });

  test('resolvido() exige tabuleiro completo e sem conflitos', () => {
    expect(new SudokuBinario(RESOLVIDO).resolvido()).toBe(true);
    // completo, mas invalido:
    expect(new SudokuBinario(Array(6).fill('000000')).resolvido()).toBe(false);
    // valido, mas incompleto:
    expect(new SudokuBinario(ULTIMA_LINHA_VAZIA).resolvido()).toBe(false);
  });

  test('uma partida: o jogador preenche a ultima linha e vence', () => {
    const sudoku = new SudokuBinario(ULTIMA_LINHA_VAZIA);
    expect(sudoku.resolvido()).toBe(false);
    [...RESOLVIDO[5]].forEach((ch, c) => sudoku.definir(5, c, Number(ch)));
    expect(sudoku.conflitos()).toEqual([]);
    expect(sudoku.resolvido()).toBe(true);
  });

  test('uma jogada errada e apontada como conflito', () => {
    const sudoku = new SudokuBinario(ULTIMA_LINHA_VAZIA);
    // 1 na coluna 0 da ultima linha: a coluna ficaria 0,0,1,1,0,1 (ok) -> usar 0 gera tres zeros? nao;
    // a linha 5 com "000" no inicio viola a regra 1:
    sudoku.definir(5, 0, 0);
    sudoku.definir(5, 1, 0);
    sudoku.definir(5, 2, 0);
    expect(sudoku.conflitos()).toContainEqual({ regra: 'TRES_SEGUIDOS', tipo: 'linha', indice: 5 });
    expect(sudoku.resolvido()).toBe(false);
  });
});

describe('Solucionador', () => {
  test('resolve um tabuleiro com a ultima linha em branco', () => {
    const solucao = new SudokuBinario(ULTIMA_LINHA_VAZIA).resolver();
    expect(solucao.resolvido()).toBe(true);
    expect(solucao.paraTexto()).toEqual(RESOLVIDO);
  });

  test('nao altera o tabuleiro original', () => {
    const sudoku = new SudokuBinario(ULTIMA_LINHA_VAZIA);
    sudoku.resolver();
    expect(sudoku.paraTexto()).toEqual(ULTIMA_LINHA_VAZIA);
  });

  test('um tabuleiro ja resolvido e devolvido como esta', () => {
    expect(new SudokuBinario(RESOLVIDO).resolver().paraTexto()).toEqual(RESOLVIDO);
  });

  test('um tabuleiro vazio tem solucao valida', () => {
    const solucao = SudokuBinario.vazio().resolver();
    expect(solucao.resolvido()).toBe(true);
    expect(solucao.paraTexto().every((linha) => !linha.includes('.'))).toBe(true);
  });

  test('a solucao respeita as celulas fixas', () => {
    const solucao = new SudokuBinario(['01....', '......', '......', '......', '......', '......']).resolver();
    expect(solucao.paraTexto()[0].startsWith('01')).toBe(true);
  });

  test('devolve null quando as celulas iniciais ja violam as regras', () => {
    expect(new SudokuBinario(['000...', '......', '......', '......', '......', '......']).resolver()).toBeNull();
  });

  test('devolve null quando nao existe solucao (celulas fixas contraditorias)', () => {
    // Linha 0 com quatro zeros (nao ha como completar com 3 zeros e 3 uns).
    expect(new SudokuBinario(['00.0.0', '......', '......', '......', '......', '......']).resolver()).toBeNull();
  });

  test('contarSolucoes: 1 para a ultima linha em branco, 1 para tabuleiro resolvido, 0 para impossivel', () => {
    expect(new SudokuBinario(ULTIMA_LINHA_VAZIA).contarSolucoes()).toBe(1);
    expect(new SudokuBinario(RESOLVIDO).contarSolucoes()).toBe(1);
    expect(new SudokuBinario(['000...', '......', '......', '......', '......', '......']).contarSolucoes()).toBe(0);
  });

  test('contarSolucoes respeita o limite informado (padrao 2)', () => {
    expect(SudokuBinario.vazio().contarSolucoes()).toBe(2);
    expect(SudokuBinario.vazio().contarSolucoes(5)).toBe(5);
  });

  test('solucaoUnica: verdadeira so quando existe exatamente uma solucao', () => {
    expect(new SudokuBinario(ULTIMA_LINHA_VAZIA).solucaoUnica()).toBe(true);
    expect(SudokuBinario.vazio().solucaoUnica()).toBe(false);
    expect(new SudokuBinario(['000...', '......', '......', '......', '......', '......']).solucaoUnica()).toBe(false);
  });
});
