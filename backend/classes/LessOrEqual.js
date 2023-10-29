const Formula = require("./Formula.js");

class LessOrEqual extends Formula {
    calculate(cellsValues){
       let result = 0;
 
       if(cellsValues[0] <= cellsValues[1]){
          result = 1;
       }
 
       return result;
    }
 }

 module.exports = LessOrEqual;