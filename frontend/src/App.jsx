import { useState, useEffect } from "react";
import axios, { spread } from "axios";
//Components
import Toolbar from "./components/Toolbar";
import Spreadsheet from "./components/Spreadsheet";

const App = () => {
   const [value, setValue] = useState("");
   const handleSubmit = async (e) => {
      try{
         e.preventDefault();
         const res = await axios.post("http://localhost:3000/set-cell", {value: value});
         console.log("res sent");
      }catch(err){
         console.log(err);
      }
   }

   const [spreadsheet, setSpreadsheet] = useState(null);

   useEffect(() => {
      console.log("Rendered")
      const fetchData = async () => {
         const res = await axios.post("http://localhost:3000/create-spreadsheet", {
            cellsNum: 260
         })

         setSpreadsheet(res.data.spreadsheet)
      }

      fetchData();

   }, [])


   const renderSpreadsheet = () => {
      if(spreadsheet){
         const alphabet = [];
         const numbers = [];
         spreadsheet.cells.forEach(cell => {
            if(!alphabet.includes(cell.address.col)){
               alphabet.push(cell.address.col);
            }
            if(!numbers.includes(cell.address.row)){
               numbers.push(cell.address.row);
            }
         })

         let rows = [{index: "", values: alphabet}];
         
         for(let i = 0; i < numbers.length; i++){
            let values = [];
            let row = {index: i+1};
            spreadsheet.cells.forEach(cell => {
               if(cell.address.row == i+1) {
                  values.push(cell.value);
               }
            })
            row.values = values;
            rows.push(row);
         }

         const renderCells = (row, rowIndex) => {
            return row.values.map((value, index) => {
                  return rowIndex==0 ? (
                  <h5 key={index} className="cell">{value}</h5>
                  )
                  : (
                  <span key={index} className="cell">{value}</span>
                  );
            })
         }

         return (
           <div className="spreadsheet">
             {rows.map((row, index) => {
               return (
                 <div className="row">
                   <div className="row-cells">
                      <h5 className="cell cell-num-address">{row.index}</h5>
                      {renderCells(row, index)}
                   </div>
                 </div>
               );
             })}
           </div>
         );
      }
   }

   return (
     <div className="App">
       <header className="header">
         <h4>Spreadsheet</h4>
       </header>
       <Toolbar />

       {spreadsheet && renderSpreadsheet()}

       {/* <form onSubmit={handleSubmit}>
         <label htmlFor="cell"></label>
         <input type="text" id="cell" onChange={(e) => setValue(e.target.value)}/>
         <button type="submit">SET</button>
      </form> */}
     </div>
   );
}

export default App
