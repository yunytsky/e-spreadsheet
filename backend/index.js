//Imports, configs
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const app = express();
const fs = require("fs");
const path = require('path');

//Storage configurations
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
     cb(null, './public')
   },
   filename: (req, file, cb) => {
     cb(null, "spreadsheet.json")
   },
 })

 const upload = multer({ storage: storage })

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//Classes
class Spreadsheet {
   constructor(cells){
      this.cells = cells;
   }
   save(){
   }
   reset() {
      this.cells.forEach(cell => {
         cell.setValue(null);
      })
   }
}

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

class Address{
   constructor(col, row) {
      this.col = col;
      this.row = row;
   }
}

class Formula{
   constructor(name, type){
      this.name = name;
      this.format = new RegExp(`^=SUM\\(${this.name}[A-Z]{1,3}\\d{1,}: [A-Z]{1,3}\\d{1,}\\)$`);
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
}

class Sum extends Formula{
   calculate(cellsValues) {
      let result = 0;

      cellsValues.forEach(value => {
         result = result + value;
      })

      return result;
   }
}

class Product extends Formula{
   calculate(cellsValues) {
      let result = 1;

      cellsValues.forEach(value => {
         result = result * value;
      })

      return result;
   }
}

class Difference extends Formula{
   calculate(cellsValues) {
      let result = 0;

      result = cellsValues[0]-cellsValues[1]

      return result;
   }
}

class Fraction extends Formula{
   calculate(cellsValues) {
      let result = 0;

      if(cellsValues[1] === 0){
         //return invalid
      }
      result = cellsValues[0]/cellsValues[1]

      return result;
   }
}

class Max extends Formula{
   calculate(cellsValues) {
      let result = 0;

      result = Math.max(...cellsValues);
      return result;
   }
}

class Min extends Formula{
   calculate(cellsValues) {
      let result = 0;

      result = Math.min(...cellsValues);

      return result;
   }
}

class Modulus extends Formula{
   calculate(cellsValues) {
      let result = 0;

      result = cellsValues[0]%cellsValues[1]

      return result;
   }
}

class integerDivision extends Formula {
   calculate(cellsValues){
      let result = 0;
      result = Math.floor(cellsValues[0]/cellsValues[1]);
      return result;
   }
}

class Equals extends Formula{
   calculate(cellsValues){
      let result = 0;

      if(cellsValues[0] === cellsValues[1]){
         result = 1;
      }

      return result;
   }
}

class Greater extends Formula {
   calculate(cellsValues){
      let result = 0;

      if(cellsValues[0] > cellsValues [1]){
         result = 1;
      }

      return result;
   }
}

class Less extends Formula {
   calculate(cellsValues){
      let result = 0;

      if(cellsValues[0] < cellsValues [1]){
         result = 1;
      }

      return resultvalues;
   }
}

class GreaterOrEqual extends Formula {
   calculate(cellsValues){
      let result = 0;

      if(cellsValues[0] >= cellsValues[1]){
         result = 1;
      }

      return result;
   }
}

class LessOrEqual extends Formula {
   calculate(cellsValues){
      let result = 0;

      if(cellsValues[0] <= cellsValues[1]){
         result = 1;
      }

      return result;
   }
}

class NotEqual extends Formula {
   calculate(cellsValues){
      let result = 0;

      if(cellsValues[0] !== cellsValues[1]){
         result = 1;
      }

      return result;
   }
}

//Global spreadsheet object
let spreadsheet;

if (fs.existsSync('./public/spreadsheet.json')) {
   console.log('The file exists.')
   const fileContent = fs.readFileSync('./public/spreadsheet.json', 'utf8');
   const jsonObject = JSON.parse(fileContent);
   let cells = [];
   jsonObject.cells.forEach((cellObject) => {
     const address = new Address(
       cellObject.address.col,
       cellObject.address.row
     );
     const value = cellObject.value;
     const cell = new Cell(value, address);
     cells.push(cell);
   });
   spreadsheet = new Spreadsheet(cells);
 }

 //Formulas
const formulas = [
  new Sum("SUM", "n-ary"),
  new Product("PROD", "n-ary"),
  new Difference("DIFF", "binary"),
  new Fraction("FRAC", "binary"),
  new Max("MMAX", "n-ary"),
  new Min("MMIN", "n-ary"),
  new Modulus("MOD", "binary"),
  new Equals("EQUALS", "binary"),
  new Greater("GREATER", "binary"),
  new Less("LESS", "binary"),
  new GreaterOrEqual("GREATER_OR_EQ", "binary"),
  new LessOrEqual("LESS_OR_EQ", "binary"),
  new NotEqual("NOT_EQUAL", "binary"),
  new integerDivision("DIV", "binary"),
];


//Routes
app.get("/get-spreadsheet", (req, res) => {
   if(spreadsheet){
      res.json({spreadsheet: spreadsheet});
   }else{
      res.json({spreadsheet: undefined});
   }
})

app.post("/create-spreadsheet", (req, res) => {
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
         const cell = new Cell(null, address);
         cells.push(cell);
      })
   });

   //Create new spreadsheet
   spreadsheet = new Spreadsheet(cells);
   res.redirect("/get-spreadsheet")
})

app.post("/save-spreadsheet", (req, res) => {
   req.body.cells.forEach(cell => {
      spreadsheet.cells.forEach(prevCell => {
         if(prevCell.address.row == cell.address.row && prevCell.address.col == cell.address.col){
            prevCell.setValue(cell.value);
         }
      })
   })

   const writeStream = fs.createWriteStream("./public/spreadsheet.json");
   writeStream.write(JSON.stringify(spreadsheet));
   writeStream.end();
   res.json({data: "data"})
})

app.post("/set-value", (req ,res) => {
   if(req.body.cell.value.startsWith("=")){
      return res.json({success: false})
   }
   spreadsheet.cells.forEach(prevCell => {
      if(prevCell.address.row == req.body.cell.address.row && prevCell.address.col == req.body.cell.address.col){
         prevCell.setValue(req.body.cell.value);
      }
   });

   const writeStream = fs.createWriteStream("./public/spreadsheet.json");
   writeStream.write(JSON.stringify(spreadsheet));
   writeStream.end();

   return res.json({success: true});
})

app.get('/download', (req, res)=>{
   res.download("./public/spreadsheet.json");
 });

app.post("/upload-spreadsheet", upload.single("file"), (req, res) => {
   const fileContent = fs.readFileSync(req.file.path, 'utf8');
   const jsonObject = JSON.parse(fileContent);
   let cells = [];
   jsonObject.cells.forEach((cellObject) => {
     const address = new Address(
       cellObject.address.col,
       cellObject.address.row
     );
     const value = cellObject.value;
     const cell = new Cell(value, address);
     cells.push(cell);
   });
   spreadsheet = new Spreadsheet(cells);
  res.redirect("/get-spreadsheet");

})

app.post("/calculate-formula", (req, res) => {
   // Regular expression pattern to match cell range (A1:B1)
   const regexPattern = /\b([A-Z]+\d+:[A-Z]+\d+)\b/g;
   // Extract cell range using regular expression
   const match = regexPattern.exec(req.body.cell.value);
   const cellRange = match ? match[1] : null;

   const rangeStart = cellRange.split(":")[0];
   const rangeEnd = cellRange.split(":")[1];

   const colStart = rangeStart.slice(0, 1)
   const colEnd = rangeEnd.slice(0, 1);

   const rowStart = rangeStart.slice(1);
   const rowEnd = rangeEnd.slice(1);

   const colToNumber = col => col.charCodeAt(0) - 65; // Convert column letter to number (A=0, B=1, ..., Z=25)
   const colStartNumber = colToNumber(colStart);
   const colEndNumber = colToNumber(colEnd);

   const cells = spreadsheet.cells.filter(cell => cell.address.row >= rowStart && cell.address.row <= rowEnd).filter((cell) => {
      const cellColNumber = colToNumber(cell.address.col);
      return cellColNumber >= colStartNumber && cellColNumber <= colEndNumber;
    });

    const values = cells.map(cell => {
      if(cell.value === null || cell.value === ""){
         return 0;
      }else{
         return parseFloat(cell.value);
      }
   });

    const formulaName = req.body.cell.value.split("=")[1].split("(")[0];
    let formulaIndex;

    formulas.forEach((formula, index) => {
      if(formula.name == formulaName){
        formulaIndex = index;
      }
    })

   if(!formulas[formulaIndex].checkValidity(values)){
      return res.json({result: "Invalid values"});
   }

   const operationResult = formulas[formulaIndex].calculate(values);
   spreadsheet.cells.forEach(prevCell => {
      if(prevCell.address.row == req.body.cell.address.row && prevCell.address.col == req.body.cell.address.col){
         prevCell.setValue(operationResult);
      }
   });

   const writeStream = fs.createWriteStream("./public/spreadsheet.json");
   writeStream.write(JSON.stringify(spreadsheet));
   writeStream.end();

   return res.json({result: operationResult});
   
})

app.get("/new-spreadsheet", (req, res) => {
   spreadsheet.reset();

   const writeStream = fs.createWriteStream("./public/spreadsheet.json");
   writeStream.write(JSON.stringify(spreadsheet));
   writeStream.end();
   
   res.json({spreadsheet: spreadsheet})
})

app.get("/formulas",(req, res) => {
   res.json({formulas: formulas});
})

// app.post("/set-cell", (req, res) => {
//    const cell = new Cell(req.body.value);
//    console.log(cell)
// })



app.listen(3000, () => {
   console.log("App is listening on PORT", 3000)
});
