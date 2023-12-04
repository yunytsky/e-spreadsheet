const fs = require("fs");
const Address = require("./Address");
const Cell = require("./Cell")

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
      //Add lacking rows
      const additionalRows = 100 - Math.ceil(this.cells.length / 26);
      const cols = [];
      for (let i = 0; i < this.cells.length; i++) {
         const cell = this.cells[i];
         if(cols.includes(cell.address.col)){
            break;
         }
         cols.push(cell.address.col);
      }

      const startRow = this.cells[this.cells.length - 1].address.row + 1;
      
      let newCells = [];

      for (let i = 0; i < additionalRows; i++) {
         cols.forEach(col => {
            const row = startRow + i
            const address = new Address(col, row);
            const cell = new Cell(null, null, address)
            this.cells.push(cell);
         })

      }

      // Reset values, formulas, and references
      this.cells.forEach(cell => {
        cell.setValue(null);
        cell.setFormula(null);
        cell.setReference(null);
      });
    }

    expand(rowsNum) {
      let success = true;
      if(rowsNum < 0){
         success = false;
         return success;
      }

      if(rowsNum > 1000){
         success = false;
         return success;
      }

      const cols = [];
      for (let i = 0; i < this.cells.length; i++) {
         const cell = this.cells[i];
         if(cols.includes(cell.address.col)){
            break;
         }
         cols.push(cell.address.col);
      }

      const startRow = this.cells[this.cells.length - 1].address.row + 1;
      
      let newCells = [];

      for (let i = 0; i < rowsNum; i++) {
         cols.forEach(col => {
            const row = startRow + i
            const address = new Address(col, row);
            const cell = new Cell(null, null, address)
            this.cells.push(cell);
         })

      }

      return success;
   
    }

    reduce(rowsNum) {
      let success = true;
      if (rowsNum < 0) {
        success = false;
        return success;
      }
    
      const lastRow = this.cells[this.cells.length - 1].address.row;
    
      // Collect cells to be deleted
      const cellsToDelete = [];
      for (let i = 0; i < rowsNum; i++) {
        if (this.cells.length === 26) {
          break;
        } else {
          for (let index = this.cells.length - 1; index >= 0; index--) {
            const cell = this.cells[index];
            if (cell.address.row === lastRow - i) {
              cellsToDelete.push(cell);
              this.cells.splice(index, 1);
            }
          }
        }
      }
    
      // Update references in remaining cells
      this.cells.forEach((cell) => {
        if (cell.reference !== null) {
          const referencedCol = cell.reference.slice(1, 2);
          const referencedRow = cell.reference.slice(2);
    
          // Check if the referenced cell is in the rows being deleted
          if (referencedRow > lastRow - rowsNum && referencedRow <= lastRow) {
            // Update the reference to null
            cell.setReference(null);
          }
        }
      });
    
      return success;
    }
    
 }

 module.exports = Spreadsheet;
