//Imports, configs
const express = require("express");
const cors = require("cors");

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

// Classes
class Spreadsheet {
   constructor(cells){
      this.cells = cells;
   }
}

class Cell {
   constructor(address){
      // this.formula = formula;
      this.value = null;
      this.address = address; //required
   }

   getValue(){
      return this.value;
   }

   setValue(value){
      this.value = value;
   }
}

class Address{
   constructor(col, row) {
      this.col = col;
      this.row = row;
   }
}

app.post("/create-spreadsheet", (req, res) => {
   console.log(req.body)

   //Rows
   const rows = [];
   for(let i = 1; i <= 100; i++){
      rows.push(i);
   }

   //Cols
   const alphabetNum = Array.from(Array(26)).map((e, i) => i + 65);
   const cols = alphabetNum.map(e => String.fromCharCode(e));


   //Addresses
   const addresses = rows.map((row) => {
     const set = [];
     for (let i = 0; i <= cols.length - 1; i++) {
       set.push(new Address(cols[i], row));
     }
     return set;
   });

   //Cells
   const cells = [];
   addresses.forEach(set => {
      set.forEach(address => {
         const cell = new Cell(address);
         cells.push(cell);
      })
   });

  const spreadsheet = new Spreadsheet(cells);

   res.json({spreadsheet: spreadsheet});
})


app.post("/set-cell", (req, res) => {
   const cell = new Cell(req.body.value);
   console.log(cell)
})

app.listen(3000, () => {
   console.log("App is listening on PORT", 3000)
});
