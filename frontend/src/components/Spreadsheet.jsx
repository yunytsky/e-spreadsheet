import { useEffect, useState } from "react";
import axios from "axios";

const Spreadsheet = ({
  spreadsheet,
  setSpreadsheet,
  selectedCell,
  setSelectedCell,
  setSelectedCellValue,
  valueChanged,
  setValueChanged,
  setSelectedFormulaName,
}) => {

  //Fetch the spreadsheet
  useEffect(() => {
    const fetchData = async () => {
      try{
        let res = await axios.get("http://localhost:3000/get-spreadsheet");
        if (res.data.spreadsheet == undefined) {
          res = await axios.post("http://localhost:3000/create-spreadsheet", {
            cellsNum: 260,
          });
        }
        setSpreadsheet(res.data.spreadsheet);
      }catch(error){
        console.log(error);
      }
    };

    fetchData();
  }, []);


  //Cell handler functions
  const handleChangeCellValue = (event) => {
    setSelectedCellValue(event.target.textContent);
    setValueChanged({changed: true, id: event.target.id});
  };

  const handleUpdateValue = async (event) => {
    window.onbeforeunload = undefined;
    try{
      const newValue = event.target.textContent;

      if (valueChanged.changed) {
        let res = await axios.post("http://localhost:3000/set-value", {
          cell: {
            value: newValue,
            address: {
              col: valueChanged.id.slice(0, 1),
              row: valueChanged.id.slice(1),
            },
          },
        });
  
        if(!res.data.success){
          res = await axios.post("http://localhost:3000/calculate-formula", {
              cell: {
                value: newValue,
                address: {
                  col: valueChanged.id.slice(0, 1),
                  row: valueChanged.id.slice(1),
                },
              },
            });

          let formulaNode;
          let valueTexNode;
    
          for (let i = 0; i < event.target.childNodes.length; i++) {
            const node = event.target.childNodes[i];
            if(node.id === "formula"){
              formulaNode = node;
            }else if(node.nodeType === 3){
              valueTexNode = node;
            }
          }

          formulaNode.innerText = newValue;
          valueTexNode.nodeValue = res.data.result;
        }
      }
  
      setValueChanged(false);
    }catch(error){
      console.log(error);
    }
  };

  const handleMouseDown = (event) => {
    const allCells = document.querySelectorAll(".cell");
    allCells.forEach((cell) => {
      cell.classList.remove("selected");
    });
    event.target.classList.add("selected");

    let formulaDOM;
    
    for (let i = 0; i < event.target.childNodes.length; i++) {
      const node = event.target.childNodes[i];
      if(node.id === "formula"){
        formulaDOM = node;
        break;
      }
    }
    console.log("FORMULA DM SELECTED CELL", event.target.childNodes)
    setSelectedCell({DOM: event.target, formula: formulaDOM.innerText});
    setSelectedFormulaName("");
    document.getElementById("select-function").value=""
  };

  const handleDoubleClick = (event) => {
    event.target.contentEditable = "true";
    event.target.focus();
  };

  const handleCellFocus = () => {
    window.onbeforeunload = function () {
      return "Data will be lost if you leave the page, are you sure?";
    };
  };

  //Render spreadsheet function
  const renderSpreadsheet = () => {
    if (spreadsheet) {
      const alphabet = [];
      const numbers = [];
      spreadsheet.cells.forEach((cell) => {
        if (!alphabet.includes(cell.address.col)) {
          alphabet.push(cell.address.col);
        }
        if (!numbers.includes(cell.address.row)) {
          numbers.push(cell.address.row);
        }
      });

      let rows = [{ index: selectedCell.DOM.id, values: alphabet }];

      for (let i = 0; i < numbers.length; i++) {
        let values = [];
        let formulas = [];
        let addresses = [];
        let row = { index: i + 1 };
        spreadsheet.cells.forEach((cell) => {
          if (cell.address.row == i + 1) {
            values.push(cell.value);
            formulas.push(cell.formula);
            addresses.push(cell.address.col + cell.address.row);
          }
        });
        row.values = values;
        row.formulas = formulas;
        row.addresses = addresses;

        rows.push(row);
      }

      const renderCells = (row, rowIndex) => {
        return row.values.map((value, index) => {
          return rowIndex == 0 ? (
            <h5 key={index} className="cell cell-letter-address">
              {value}
            </h5>
          ) : (
            <div
              key={row.addresses[index]}
              id={row.addresses[index]}
              className={"cell"}
              onInput={(e) => handleChangeCellValue(e)}
              onBlur={(e) => handleUpdateValue(e)}
              onMouseDownCapture={(e) => handleMouseDown(e)}
              onDoubleClick={(e) => handleDoubleClick(e)}
              onFocus={(e) => handleCellFocus(e)}
              suppressContentEditableWarning={true}
            >
              {value}
              <div id="formula">{row.formulas[index]}</div>
            </div>
          );
        });
      };

      return (
        <div className="spreadsheet">
          {rows.map((row, index) => {
            return (
              <div className="row" key={index}>
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
  };

  return spreadsheet && renderSpreadsheet();
};

export default Spreadsheet;