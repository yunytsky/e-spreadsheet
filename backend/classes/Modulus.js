const Formula = require("./Formula.js");

class Modulus extends Formula{
    calculate(cellsValues) {
       let result = 0;
 
       result = cellsValues[0]%cellsValues[1]
 
       return result;
    }
 }

 module.exports = Modulus;