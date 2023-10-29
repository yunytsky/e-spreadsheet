const Formula = require("./Formula.js");

class integerDivision extends Formula {
    calculate(cellsValues){
       let result = 0;
       result = Math.floor(cellsValues[0]/cellsValues[1]);
       return result;
    }
 }

 module.exports = integerDivision;