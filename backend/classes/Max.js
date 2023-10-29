const Formula = require("./Formula.js");

class Max extends Formula{
    calculate(cellsValues) {
       let result = 0;
 
       result = Math.max(...cellsValues);
       return result;
    }
 }

 module.exports = Max;