class Cell {
  constructor(value, formula, address, reference) {
    this.value = value;
    this.formula = formula;
    this.address = address;
    this.reference = reference;
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
  setReference(reference){
    this.reference = reference;
  }
}

module.exports = Cell;
