class Cell {
    constructor(value, address){
       this.value = value;
       this.address = address;
    }
 
    getValue(){
       return this.value;
    }
 
    setValue(value){
       this.value = value;
    }
     
    getAddress(){
      return this.address;
   }
 }

 module.exports = Cell;