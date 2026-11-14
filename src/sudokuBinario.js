'use strict';

const TAMANHO = 6;
const METADE = TAMANHO / 2;

/**
 * Sudoku binario (Binairo / Takuzu) 6 x 6.
 *
 * Regras:
 *  1. Nao pode haver tres numeros iguais seguidos em nenhuma linha ou coluna.
 *  2. Cada linha e cada coluna tem a mesma quantidade de 0s e 1s (3 de cada).
 *  3. Nao pode haver duas linhas iguais nem duas colunas iguais.
 *
 * O tabuleiro inicial e uma lista de 6 textos de 6 caracteres: "0", "1" ou "." (vazio).
 * As celulas preenchidas no tabuleiro inicial sao fixas e nao podem ser alteradas.
 */
class SudokuBinario {
  constructor(inicial) {
    const valido = Array.isArray(inicial)
      && inicial.length === TAMANHO
      && inicial.every((linha) => typeof linha === 'string' && /^[01.]{6}$/.test(linha));
    if (!valido) throw new RangeError('Tabuleiro inicial invalido: use 6 linhas de 6 caracteres 0, 1 ou .');

    this._grade = inicial.map((linha) => [...linha].map((ch) => (ch === '.' ? null : Number(ch))));
    this._fixas = this._grade.map((linha) => linha.map((v) => v !== null));
  }

  /** Tabuleiro 6x6 sem nenhuma celula preenchida. */
  static vazio() {
    return new SudokuBinario(Array(TAMANHO).fill('.'.repeat(TAMANHO)));
  }

  /** Valor da celula: 0, 1 ou null (vazia). */
  valor(linha, coluna) {
    this._validarCoordenada(linha, coluna);
    return this._grade[linha][coluna];
  }

  /** Verdadeiro se a celula veio preenchida no tabuleiro inicial. */
  ehFixa(linha, coluna) {
    this._validarCoordenada(linha, coluna);
    return this._fixas[linha][coluna];
  }

  definir(linha, coluna, valor) {
    this._validarCoordenada(linha, coluna);
    this._validarNaoFixa(linha, coluna);
    if (valor !== 0 && valor !== 1) throw new RangeError('Valor invalido: use 0 ou 1');
    this._grade[linha][coluna] = valor;
  }

  limpar(linha, coluna) {
    this._validarCoordenada(linha, coluna);
    this._validarNaoFixa(linha, coluna);
    this._grade[linha][coluna] = null;
  }

  /** O tabuleiro como lista de textos ("." = vazio). */
  paraTexto() {
    return this._grade.map((linha) => linha.map((v) => (v === null ? '.' : String(v))).join(''));
  }

  /** Verdadeiro se nao ha celulas vazias. */
  completo() {
    return this._grade.every((linha) => linha.every((v) => v !== null));
  }

  /** Verdadeiro se o tabuleiro esta completo e respeita todas as regras. */
  resolvido() {
    return this.completo() && this.conflitos().length === 0;
  }

  /**
   * Lista as violacoes das regras (vazia = nenhum conflito). Formatos:
   *  { regra: 'TRES_SEGUIDOS', tipo, indice }
   *  { regra: 'EXCESSO', tipo, indice, valor }
   *  { regra: 'DUPLICADA', tipo, indices: [i, j] }
   * onde tipo e 'linha' ou 'coluna'.
   */
  conflitos() {
    return [...this._conflitosDe('linha', this._linhas()), ...this._conflitosDe('coluna', this._colunas())];
  }

  /** Resolve o tabuleiro por tentativa e erro. Devolve um novo SudokuBinario ou null se nao ha solucao. */
  resolver() {
    let encontrada = null;
    this._percorrerSolucoes(1, (texto) => {
      encontrada = texto;
    });
    return encontrada ? new SudokuBinario(encontrada) : null;
  }

  /** Conta as solucoes, parando ao chegar em `limite` (padrao 2: basta para saber se e unica). */
  contarSolucoes(limite = 2) {
    return this._percorrerSolucoes(limite, () => {});
  }

  solucaoUnica() {
    return this.contarSolucoes(2) === 1;
  }

  // ---------------------------------------------------------------- privados

  _validarCoordenada(linha, coluna) {
    const valida = Number.isInteger(linha) && Number.isInteger(coluna)
      && linha >= 0 && linha < TAMANHO && coluna >= 0 && coluna < TAMANHO;
    if (!valida) throw new RangeError('Coordenada invalida');
  }

  _validarNaoFixa(linha, coluna) {
    if (this._fixas[linha][coluna]) throw new Error('Celula fixa');
  }

  _linhas() {
    return this._grade;
  }

  _colunas() {
    return this._grade[0].map((_, c) => this._grade.map((linha) => linha[c]));
  }

  _conflitosDe(tipo, linhas) {
    const conflitos = [];
    linhas.forEach((linha, indice) => {
      if (this._temTresSeguidos(linha)) conflitos.push({ regra: 'TRES_SEGUIDOS', tipo, indice });
      [0, 1].forEach((valor) => {
        if (linha.filter((v) => v === valor).length > METADE) {
          conflitos.push({ regra: 'EXCESSO', tipo, indice, valor });
        }
      });
    });
    const completas = linhas.map((linha, indice) => ({ linha, indice })).filter(({ linha }) => !linha.includes(null));
    for (let i = 0; i < completas.length; i++) {
      for (let j = i + 1; j < completas.length; j++) {
        if (completas[i].linha.join('') === completas[j].linha.join('')) {
          conflitos.push({ regra: 'DUPLICADA', tipo, indices: [completas[i].indice, completas[j].indice] });
        }
      }
    }
    return conflitos;
  }

  _temTresSeguidos(linha) {
    return linha.some((v, k) => v !== null && v === linha[k + 1] && v === linha[k + 2]);
  }

  // Busca por backtracking: testa 0 e 1 em cada celula vazia e poda quando ha conflito.
  _percorrerSolucoes(limite, aoEncontrar) {
    if (this.conflitos().length > 0) return 0;
    const trabalho = new SudokuBinario(this.paraTexto());
    let total = 0;

    const buscar = (posicao) => {
      if (posicao === TAMANHO * TAMANHO) {
        total++;
        aoEncontrar(trabalho.paraTexto());
        return;
      }
      const l = Math.floor(posicao / TAMANHO);
      const c = posicao % TAMANHO;
      if (trabalho._grade[l][c] !== null) {
        buscar(posicao + 1);
        return;
      }
      for (const valor of [0, 1]) {
        trabalho._grade[l][c] = valor;
        if (trabalho.conflitos().length === 0) buscar(posicao + 1);
        if (total >= limite) return;
      }
      trabalho._grade[l][c] = null;
    };

    buscar(0);
    return total;
  }
}

module.exports = { SudokuBinario, TAMANHO };
