class Spreadsheet {
    constructor(cells){
       this.cells = cells;
    }
    saveIntoFile(){
       const writeStream = fs.createWriteStream("./public/spreadsheet.json");
       writeStream.write(JSON.stringify(this));
       writeStream.end();
    }
    reset() {
       this.cells.forEach(cell => {
          cell.setValue(null);
       })
    }
 }

 module.exports = Spreadsheet;
