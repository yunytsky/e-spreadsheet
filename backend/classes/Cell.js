class Cell {
  constructor(value, formula, address) {
    this.value = value;
    this.formula = formula;
    this.address = address;
  }

  getValue() {
    return this.value;
  }

  setValue(value) {
    this.value = value;
  }

  getFormula() {
    return this.formula;
  }

  setFormula(formula) {
    this.formula = formula;
  }

  getAddress() {
    return this.address;
  }
}

module.exports = Cell;
