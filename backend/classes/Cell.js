class Cell {
    constructor(value, address){
       this.value = value;
       this.address = address; //required
    }
 
    getValue(){
       return this.value;
    }
 
    setValue(value){
       this.value = value;
    }
 }

 module.exports = Cell;