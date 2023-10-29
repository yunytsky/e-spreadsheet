const Formula = require("./Formula.js");

class Greater extends Formula {
    calculate(cellsValues){
       let result = 0;
 
       if(cellsValues[0] > cellsValues [1]){
          result = 1;
       }
 
       return result;
    }
 }

 module.exports = Greater;