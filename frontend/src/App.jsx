import { useState, useEffect } from "react";
import axios from "axios";
//Components
import Toolbar from "./components/Toolbar";
import Spreadsheet from "./components/Spreadsheet";

const App = () => {   
  const [spreadsheet, setSpreadsheet] = useState(null);
  const [selectedCell, setSelectedCell] = useState("");
  const [selectedCellValue, setSelectedCellValue] = useState(selectedCell.innerText);
  const [valueChanged, setValueChanged] = useState({changed: false, id: ""});
  const [selectedFormulaName, setSelectedFormulaName] = useState("");

  useEffect(() => {
    setSelectedCellValue(selectedCell.innerText)
 }, [selectedCell])

   return (
     <div className="App">
       <header className="header">
         <h4>Spreadsheet</h4>
       </header>
       <Toolbar
         spreadsheet={spreadsheet}
         setSpreadsheet={setSpreadsheet}
         selectedCell={selectedCell}
         setSelectedCell={setSelectedCell}
         selectedCellValue={selectedCellValue}
         setSelectedCellValue={setSelectedCellValue}
         valueChanged={valueChanged}
         setValueChanged={setValueChanged}
         selectedFormulaName={selectedFormulaName}
         setSelectedFormulaName={setSelectedFormulaName}
       />
       <Spreadsheet
         spreadsheet={spreadsheet}
         setSpreadsheet={setSpreadsheet}
         selectedCell={selectedCell}
         setSelectedCell={setSelectedCell}
         selectedCellValue={selectedCellValue}
         setSelectedCellValue={setSelectedCellValue}
         valueChanged={valueChanged}
         setValueChanged={setValueChanged}
         setSelectedFormulaName={setSelectedFormulaName}
       />
     </div>
   );
}

export default App
