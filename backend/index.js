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
const integerDivision = require("./classes/integerDivision.js");
const Equals = require("./classes/Equals.js");
const Greater = require("./classes/Greater.js");
const Less = require("./classes/Greater.js");
const GreaterOrEqual = require("./classes/Greater.js");
const LessOrEqual = require("./classes/Greater.js");
const NotEqual = require("./classes/Greater.js");


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
      return res.status(200).json({spreadsheet: spreadsheet});
   }else{
      return res.status(505).json({spreadsheet: undefined});
   }
});

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
});

app.post("/set-value", (req ,res) => {
   if(req.body.cell.value.startsWith("=")){
      return res.status(200).json({success: false, message: "Value is a formula"});
   }

   spreadsheet.cells.forEach(prevCell => {
      if(prevCell.address.row == req.body.cell.address.row && prevCell.address.col == req.body.cell.address.col){
         prevCell.setValue(req.body.cell.value);
      }
   });

   const writeStream = fs.createWriteStream("./public/spreadsheet.json");
   writeStream.write(JSON.stringify(spreadsheet));
   writeStream.end();

   return res.status(200).json({success: true});
});

app.post("/save-spreadsheet", (req, res) => {
   req.body.cells.forEach(cell => {
      spreadsheet.cells.forEach(prevCell => {
         if(prevCell.address.row == cell.address.row && prevCell.address.col == cell.address.col){
            prevCell.setValue(cell.value);
         }
      })
   })

   spreadsheet.saveIntoFile();

   return res.status(200).json({success: true});
});

app.get('/download-spreadsheet', (req, res)=>{
   return res.download("./public/spreadsheet.json");
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
   return res.status(200).json({spreadsheet: spreadsheet});
});

app.post("/calculate-formula", (req, res) => {
   const formulaName = req.body.cell.value.split("=")[1].split("(")[0];
   let formulaIndex;

   formulas.forEach((formula, index) => {
      if(formula.name == formulaName){
        formulaIndex = index;
      }
   })
   //check if there's even such a formula


   // Regular expression pattern to match cell range i.e. (A1:B1)
   const regexPattern = /\b([A-Z]+\d+:[A-Z]+\d+)\b/g;
   // Extract cell range
   const match = regexPattern.exec(req.body.cell.value);
   const cellRange = match ? match[1] : null;

   const rangeStart = cellRange.split(":")[0];
   const rangeEnd = cellRange.split(":")[1];

   const colStart = rangeStart.slice(0, 1)
   const colEnd = rangeEnd.slice(0, 1);

   const rowStart = rangeStart.slice(1);
   const rowEnd = rangeEnd.slice(1);

   // Convert column letter to number (A=0, B=1, ..., Z=25)
   const colToNumber = col => col.charCodeAt(0) - 65;
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

   if(!formulas[formulaIndex].checkValidity(values)){
      return res.json({result: "Invalid values"});
   }

   const operationResult = formulas[formulaIndex].calculate(values);
   spreadsheet.cells.forEach(prevCell => {
      if(prevCell.address.row == req.body.cell.address.row && prevCell.address.col == req.body.cell.address.col){
         prevCell.setValue(operationResult);
      }
   });

   spreadsheet.saveIntoFile();

   return res.json({result: operationResult});
   
});

app.get("/new-spreadsheet", (req, res) => {
   spreadsheet.reset();
   spreadsheet.saveIntoFile();
   return res.status(200).json({spreadsheet: spreadsheet})
});

app.get("/get-formulas",(req, res) => {
   if(formulas){
      return  res.status(200).json({formulas: formulas});
   }else{
      return res.status(505).json({formulas: undefined, message: "Couldn't get formulas"})
   }
});

app.listen(3000, () => {
   console.log("App is listening on PORT", 3000);
});
