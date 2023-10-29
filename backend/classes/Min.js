const Formula = require("./Formula.js");

class Min extends Formula{
    calculate(cellsValues) {
       let result = 0;
 
       result = Math.min(...cellsValues);
 
       return result;
    }
 }

 module.exports = Min;