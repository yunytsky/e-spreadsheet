class Formula{
    constructor(name, type){
       if (this.constructor == Formula) {
          throw new Error("Abstract classes can't be instantiated.");
        }
       this.name = name;
       this.type = type;
    }
    
    checkValidity(cellsValues) {
       let isValid = true;
 
       if(this.type == "binary" && cellsValues.length != 2){
          isValid = false;
          return isValid;
       }
 
       if(this.name === "FRAC" || this.name === "DIV" || this.name === "MOD") {
          if(cellsValues[1] === 0){
             isValid = false;
             return isValid;
          }
       }
 
       for(let i = 0; i<cellsValues.length; i++){
          if(isNaN(cellsValues[i])){
             isValid = false;
             return;
          }
       }
 
       return isValid;
    }
    
    calculate(){
       throw new Error("Method 'calculate()' must be implemented.");
    }
 }

 module.exports = Formula;