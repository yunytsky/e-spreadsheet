const Formula = require("./Formula.js");

class Product extends Formula{
    calculate(cellsValues) {
       let result = 1;
 
       cellsValues.forEach(value => {
          result = result * value;
       })
 
       return result;
    }
 }

 module.exports = Product;