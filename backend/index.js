//Imports
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const app = express();
const fs = require("fs");
//Classes
const Spreadsheet = require("./classes/Spreadsheet.js");
const Cell = require("./classes/Cell.js");
const Address = require("./classes/Address.js");
const Formula = require("./classes/Formula.js");
const Sum = require("./classes/Sum.js");
const Difference = require("./classes/Difference.js");
const Fraction = require("./classes/Fraction.js");
const Product = require("./classes/Product.js");
const Max = require("./classes/Max.js");
const Min = require("./classes/Min.js");
const Modulus = require("./classes/Modulus.js");
const IntegerDivision = require("./classes/IntegerDivision.js");
const Equals = require("./classes/Equals.js");
const Greater = require("./classes/Greater.js");
const Less = require("./classes/Greater.js");
const GreaterOrEqual = require("./classes/Greater.js");
const LessOrEqual = require("./classes/Greater.js");
const NotEqual = require("./classes/Greater.js");

//Global variables
const NUM_ALPHABETS = 26;
const ASCII_UPPERCASE_A = 65;
const ASCII_ALPHABET  = Array.from(Array(NUM_ALPHABETS)).map((e, i) => i + ASCII_UPPERCASE_A);
const ALPHABET = ASCII_ALPHABET .map(e => String.fromCharCode(e));

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

//Global spreadsheet object
let spreadsheet;

if (fs.existsSync('./public/spreadsheet.json')) {
   const fileContent = fs.readFileSync('./public/spreadsheet.json', 'utf8');
   const jsonObject = JSON.parse(fileContent);
   let cells = [];
   jsonObject.cells.forEach((cellObject) => {
     const address = new Address(
       cellObject.address.col,
       cellObject.address.row
     );
     const value = cellObject.value;
     const formula = cellObject.formula;
     const reference = cellObject.reference;

     const cell = new Cell(value, formula, address, reference);
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
  new IntegerDivision("DIV", "binary"),
];

function updateDependentCells(changedCell, newValue) {
  for (let i = 0; i < spreadsheet.cells.length; i++) {
    let cell = spreadsheet.cells[i];

    if (cell.reference != null) {
      let cellReferenceCol = cell.reference.slice(1, 2);
      let cellReferenceRow = cell.reference.slice(2);

      if (
        cellReferenceCol == changedCell.address.col &&
        cellReferenceRow == changedCell.address.row
      ) {
        cell.value = newValue;
        // Recursively update cells that depend on the current cell
        updateDependentCells(cell, newValue);
      }
    }
  }
}

//Routes
app.get("/get-spreadsheet", (req, res) => {
   if(spreadsheet){
      return res.status(200).json({spreadsheet: spreadsheet});
   }else{
      return res.status(200).json({spreadsheet: undefined});
   }
});

app.post("/create-spreadsheet", (req, res) => {
   //Rows
   const rows = [];
   for(let i = 1; i <= 100; i++){
      rows.push(i);
   }

   //Cols
   const cols = ALPHABET;
   
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
         const cell = new Cell(null, null, address, null);
         cells.push(cell);
      })
   });

   //Create new spreadsheet
   spreadsheet = new Spreadsheet(cells);
   return res.status(200).json({spreadsheet: spreadsheet});

});

app.post("/set-value", (req ,res) => {

   if(req.body.cell.value.startsWith("=")){
    const pattern = /^=[A-Z]\d+$/;

    //Handle references
    if(pattern.test(req.body.cell.value)){
      const col = req.body.cell.value.slice(1, 2);
      const row = req.body.cell.value.slice(2);

      let referencedCell = null;
      //Get referenced cell
      for (let i = 0; i < spreadsheet.cells.length; i++) {
        let cell = spreadsheet.cells[i];
        
        if (cell.getAddress().col == col && cell.getAddress().row == row) {
          referencedCell = cell;
          break; 
        }
      }

      if(referencedCell.address.row == req.body.cell.address.row && referencedCell.address.col == req.body.cell.address.col){
        return res.status(400).json({success: false, message: "Invalid reference"});
 
      }

      let newRefValue = 0;
      if(referencedCell !== null){
        spreadsheet.cells.forEach(prevCell => {
          if(prevCell.getAddress().row == req.body.cell.address.row && prevCell.getAddress().col == req.body.cell.address.col){
            if(referencedCell.value == null){
              prevCell.setValue(0);
            }else{
              newRefValue = referencedCell.value;
              prevCell.setValue(referencedCell.value);
            }
             prevCell.setFormula(null);
             prevCell.setReference(req.body.cell.value);
          }
       });

       const saveResult = spreadsheet.saveIntoFile();
       if(!saveResult) {
          return res.status(505).json({success: false});
       }

       return res.status(200).json({success: true, value: newRefValue});

      }


    }

    return res.status(200).json({success: false, message: "Value is a formula"});
   }

 // Check if referenced anywhere
  for (let i = 0; i < spreadsheet.cells.length; i++) {
  let cell = spreadsheet.cells[i];

  if (cell.reference != null) {
    let cellReferenceCol = cell.reference.slice(1, 2);
    let cellReferenceRow = cell.reference.slice(2);

    if (
      cellReferenceCol == req.body.cell.address.col &&
      cellReferenceRow == req.body.cell.address.row
    ) {
      cell.value = req.body.cell.value;
      // Recursively update cells that depend on the current cell
      updateDependentCells(cell, req.body.cell.value);
    }
  }
}

   spreadsheet.cells.forEach(prevCell => {
      if(prevCell.getAddress().row == req.body.cell.address.row && prevCell.getAddress().col == req.body.cell.address.col){
         prevCell.setValue(req.body.cell.value);
         prevCell.setFormula(null);
      }
   });

   const saveResult = spreadsheet.saveIntoFile();
   if(!saveResult) {
      return res.status(505).json({success: false});
   }

   return res.status(200).json({success: true});
});

app.post("/save-spreadsheet", (req, res) => {
   req.body.cells.forEach(cell => {
      spreadsheet.cells.forEach(prevCell => {
         if(prevCell.getAddress().row == cell.address.row && prevCell.getAddress().col == cell.address.col){
            prevCell.setValue(cell.value);
         }
      })
   })

   const saveResult = spreadsheet.saveIntoFile();
   if(!saveResult) {
      return res.status(505).json({success: false});
   }

   return res.status(200).json({success: true});

});

app.get('/download-spreadsheet', (req, res)=>{
   return res.download("./public/spreadsheet.json");
 });

app.post("/upload-spreadsheet", upload.single("file"), (req, res) => {
   const fileContent = fs.readFileSync(req.file.path, 'utf8');
   const jsonObject = JSON.parse(fileContent);
   //Check if the data is valid
   if(!jsonObject.cells){
      fs.unlinkSync(req.file.path);
      return res.status(400).json({spreadsheet: undefined, message: "Invalid data"});
   }
   let cells = [];
   jsonObject.cells.forEach((cellObject) => {
     const address = new Address(
       cellObject.address.col,
       cellObject.address.row
     );
     const value = cellObject.value;
     const formula = cellObject.formula;
     const reference = cellObject.reference;

     const cell = new Cell(value, formula, address, reference);
     cells.push(cell);
   });
   spreadsheet = new Spreadsheet(cells);
   return res.status(200).json({spreadsheet: spreadsheet});
});

app.post("/expand-spreadsheet", (req, res) => {
  if(spreadsheet){
    const expandResult = spreadsheet.expand(req.body.rowNum);
    if(!expandResult){
      console.log("invalid value")
      return res.status(404).json({ success: false, message: "Invalid value" });

    }
    const saveResult = spreadsheet.saveIntoFile();
    if (!saveResult) {
      return res.status(505).json({ success: false });
    }
    return res.status(200).json({success:true, spreadsheet: spreadsheet})
  }else{
    return res.status(404).json({success: false, message: "Spreadsheet is undefined"})
  }
})

app.post("/reduce-spreadsheet", (req, res) => {
  if(spreadsheet){
    const reduceResult = spreadsheet.reduce(req.body.rowNum);
    if(!reduceResult){
      return res.status(404).json({ success: false, message: "Invalid value" });
    }
    const saveResult = spreadsheet.saveIntoFile();
    if (!saveResult) {
      return res.status(505).json({ success: false });
    }
    return res.status(200).json({success:true, spreadsheet: spreadsheet})
  }else{
    return res.status(404).json({success: false, message: "Spreadsheet is undefined"})
  }
})

app.post("/calculate-formula", (req, res) => {
  let rangeError = false;

  const formulaName = req.body.cell.value.split("=")[1].split("(")[0];
  let formulaIndex = null;

  formulas.forEach((formula, index) => {
    if (formula.name == formulaName) {
      formulaIndex = index;
    }
  });

  //Check if formula exists
  if(formulaIndex === null){
   return res.json({ result: "Invalid formula" });
  }

  // Regular expression pattern to match cell range i.e. (A1:B1)
  const regexPattern = /\b([A-Z]+\d+:[A-Z]+\d+)\b/g;
  // Extract cell range
  const match = regexPattern.exec(req.body.cell.value);
  const cellRange = match ? match[1] : null;

   //Validate range (col)
   if(cellRange === null){
      rangeError = true;
      return res.json({ result: "Invalid range" });
   }

  const rangeStart = cellRange.split(":")[0];
  const rangeEnd = cellRange.split(":")[1];
  const colStart = rangeStart.slice(0, 1);
  const colEnd = rangeEnd.slice(0, 1);

  const rowStart = rangeStart.slice(1);
  const rowEnd = rangeEnd.slice(1);

  const numSpreadsheetRows = spreadsheet.cells.length/NUM_ALPHABETS;


  //Validate range (row)
  if(rowEnd < rowStart){
   rangeError = true;
  }else if(rowEnd <= 0 || rowStart <= 0){
   rangeError = true;
  }else if(rowEnd > numSpreadsheetRows || rowStart > numSpreadsheetRows){
   rangeError = true;
  }

  // Convert column letter to number (A=0, B=1, ..., Z=25)
  const colToNumber = (col) => col.charCodeAt(0) - ASCII_UPPERCASE_A;
  const colStartNumber = colToNumber(colStart);
  const colEndNumber = colToNumber(colEnd);

  const cells = spreadsheet.cells
    .filter(
      (cell) =>
        cell.getAddress().row >= rowStart && cell.getAddress().row <= rowEnd
    )
    .filter((cell) => {
      const cellColNumber = colToNumber(cell.getAddress().col);
      return cellColNumber >= colStartNumber && cellColNumber <= colEndNumber;
    });

  //Check if a cell the formula set in is included in the range
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (
      String(cell.address.row) === req.body.cell.address.row &&
      String(cell.address.col) === req.body.cell.address.col
    ) {
      rangeError = true;
      break;
    }
  }

  if (rangeError) {
    return res.json({ result: "Invalid range" });
  }

  const digitPattern = /^-?\d+(\.\d+)?$/;
  //Get values from the cell range
  const values = cells.map((cell) => {
    if (cell.getValue() === null || cell.getValue() === "") {
      return 0;
    }else if(!digitPattern.test(cell.getValue())){
      return cell.getValue();
    } else {
      return parseFloat(cell.getValue());
    }
  });

  if (!formulas[formulaIndex].checkValidity(values)) {
    return res.json({ result: "Invalid values" });
  }

  const operationResult = formulas[formulaIndex].calculate(values);
  spreadsheet.cells.forEach((prevCell) => {
    if (
      prevCell.getAddress().row == req.body.cell.address.row &&
      prevCell.getAddress().col == req.body.cell.address.col
    ) {
      prevCell.setValue(operationResult);
      prevCell.setFormula(req.body.cell.value);
    }
  });

  const saveResult = spreadsheet.saveIntoFile();
  if (!saveResult) {
    return res.status(505).json({ success: false });
  }

  return res.status(200).json({ success: true, result: operationResult });
});

app.get("/new-spreadsheet", (req, res) => {
   spreadsheet.reset();
   const saveResult = spreadsheet.saveIntoFile();
   if(!saveResult) {
      return res.status(505).json({success: false});
   }
   return res.status(200).json({success: true, spreadsheet: spreadsheet})
});

app.get("/get-formulas",(req, res) => {
   if(formulas){
      return  res.status(200).json({formulas: formulas});
   }else{
      return res.status(505).json({formulas: undefined, message: "Couldn't get formulas"})
   }
});


//Server
const PORT = 3000;
app.listen(PORT, () => {
   console.log("App is listening on PORT", 3000);
});
