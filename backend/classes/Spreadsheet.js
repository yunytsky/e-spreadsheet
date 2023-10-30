const fs = require("fs");

class Spreadsheet {
    constructor(cells){
       this.cells = cells;
    }
    saveIntoFile(){
      let success = true;
       const writeStream = fs.createWriteStream("./public/spreadsheet.json");
       writeStream.on('error', (err) => {
         success = false;
       });
       writeStream.write(JSON.stringify(this), (err) => {
         if (err) {
             success = false;
         }
         writeStream.end();
      });
      return success
    }
    reset() {
       this.cells.forEach(cell => {
          cell.setValue(null);
       }) 
    }
 }

 module.exports = Spreadsheet;
