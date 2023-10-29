const Formula = require("./Formula.js");

class Sum extends Formula{
    calculate(cellsValues) {
       let result = 0;
 
       cellsValues.forEach(value => {
          result = result + value;
       })
 
       return result;
    }
 }

 module.exports = Sum;