import { useEffect, useState } from "react";
import axios, { all } from "axios";

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
  const [refChanged, setRefChanged] = useState(false);

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
  }, [refChanged]);

  //Recalculate function
  const recalculate = async (matchingFormulas) => {
    if(matchingFormulas.length > 0) {
      try{
        const delay = 300;

        matchingFormulas.forEach(async (formula) => {
          const value = formula.getAttribute("data-formula");

         setTimeout(async() => {
            const recalcRes = await axios.post(
              "http://localhost:3000/calculate-formula",
              {
                cell: {
                  value: value,
                  address: {
                    col: formula.id.slice(0, 1),
                    row: formula.id.slice(1),
                  },
                },
              }
            );

            formula.innerText = recalcRes.data.result;
            
          }, delay)
        
          
        })
  
      }catch(err){
        console.log(err)
      }
    }

  }

  // Recursive function to update all dependent cells
const updateDependentCells = (targetId, newValue) => {
  // Find all cells that reference the target cell
  const dependentCells = document.querySelectorAll('[data-reference]');
  
  dependentCells.forEach((cell) => {
    const referenceCol = cell.getAttribute('data-reference').slice(1, 2);
    const referenceRow = cell.getAttribute('data-reference').slice(2);

    if (
      cell.getAttribute('data-reference') !== null &&
      cell.getAttribute('data-reference') !== '' &&
      referenceCol === targetId.slice(0, 1) &&
      referenceRow === targetId.slice(1)
    ) {
      // Update the displayed value
      cell.innerText = newValue;

      // Recursively update dependent cells
      updateDependentCells(cell.id, newValue);
    }
  });
};


  //Cell handler functions
  const handleChangeCellValue = (event) => {
    if (event.target.hasAttribute('data-formula')) {
      event.target.setAttribute('data-formula', "");
      selectedCell.formula = ""
    }

    if (event.target.hasAttribute('data-reference')) {
      event.target.setAttribute('data-reference', "");
      selectedCell.reference = ""
    }

    setSelectedCellValue(event.target.innerText);
    setValueChanged({changed: true, id: event.target.id});
  };

  const handleUpdateValue = async (event) => {
    window.onbeforeunload = undefined;

    try {
      const newValue = event.target.textContent;

      if (valueChanged.changed) {
        const resSetValue = await axios.post(
          "http://localhost:3000/set-value",
          {
            cell: {
              value: newValue,
              address: {
                col: valueChanged.id.slice(0, 1),
                row: valueChanged.id.slice(1),
              },
            },
          }
        );

        if (resSetValue.data.value !== undefined) {
          await event.target.setAttribute("data-reference", newValue);
          document.getElementById(valueChanged.id).innerText =
            resSetValue.data.value;
        }

        if (!resSetValue.data.success) {
          const resCalculate = await axios.post(
            "http://localhost:3000/calculate-formula",
            {
              cell: {
                value: newValue,
                address: {
                  col: valueChanged.id.slice(0, 1),
                  row: valueChanged.id.slice(1),
                },
              },
            }
          );

          await event.target.setAttribute("data-formula", newValue);
          document.getElementById(valueChanged.id).innerText =
            resCalculate.data.result;
        }

        //Check if this cell is included in any formula
        const cells = document.querySelectorAll("div.cell");
        let allFormulas = [];
        let matchingRanges = [];
        let matchingFormulas = [];

        cells.forEach((cell) => {
          if (
            cell.getAttribute("data-formula") !== null &&
            cell.getAttribute("data-formula") !== ""
          ) {
            allFormulas.push(cell);
          }
        });

        const targetCellId = event.target.id;
        const targetCellCol = targetCellId.slice(0, 1);
        const targetCellRow = parseInt(targetCellId.slice(1));

        // Regex pattern to match cell range
        const regexPattern = /\b([A-Z]+\d+:[A-Z]+\d+)\b/g;

        allFormulas.forEach((formula) => {
          const matches = formula
            .getAttribute("data-formula")
            .match(regexPattern);
          if (matches) {
            matches.forEach((match) => {
              const [rangeStart, rangeEnd] = match.split(":");
              const colStart = rangeStart.slice(0, 1);
              const colEnd = rangeEnd.slice(0, 1);
              const rowStart = parseInt(rangeStart.slice(1));
              const rowEnd = parseInt(rangeEnd.slice(1));

              if (
                targetCellCol >= colStart &&
                targetCellCol <= colEnd &&
                targetCellRow >= rowStart &&
                targetCellRow <= rowEnd
              ) {
                matchingRanges.push(match);
                matchingFormulas.push(formula);
              }
            });
          }
        });

        const recalcRes = await recalculate(matchingFormulas);

        //Check if cell is referenced anywhere
        cells.forEach((cell) => {
          if (
            cell.getAttribute("data-reference") !== null &&
            cell.getAttribute("data-reference") !== "" &&
            cell.getAttribute("data-reference").slice(1, 2) == event.target.id.slice(0, 1) &&
            cell.getAttribute("data-reference").slice(2) == event.target.id.slice(1)
          ) {
            updateDependentCells(targetCellId, newValue);
          }
          
        });
      }



      setValueChanged(false);
      

    } catch (error) {
      if(error.response.data.message){
        event.target.innerText = error.response.data.message;
      }
    }
  };

  const handleMouseDown = (event) => {
    const allCells = document.querySelectorAll(".cell");
    allCells.forEach((cell) => {
      cell.classList.remove("selected");
    });
    event.target.classList.add("selected");

    let formula;
    if(event.target.getAttribute("data-formula") != null){
      formula = event.target.getAttribute("data-formula");
    }else{
      formula = ""
    }   
  
    let reference;
    if(event.target.getAttribute("data-reference") != null){
      reference = event.target.getAttribute("data-reference");
    }else{
      reference = ""
    }   

    setSelectedCell({DOM: event.target, formula: formula, reference: reference});
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
        let references = [];
        let row = { index: i + 1 };
        spreadsheet.cells.forEach((cell) => {
          if (cell.address.row == i + 1) {
            values.push(cell.value);
            formulas.push(cell.formula);
            addresses.push(cell.address.col + cell.address.row);
            references.push(cell.reference);
          }
        });
        row.values = values;
        row.formulas = formulas;
        row.addresses = addresses;
        row.references = references;
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
              data-formula={row.formulas[index]}
              data-reference={row.references[index]}
            >
              {value}
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