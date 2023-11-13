import { useEffect, useState } from "react";
import axios, { spread } from "axios";

import functionLogo from "../assets/fx.svg"

const Toolbar = ({
  setSpreadsheet,
  selectedCell,
  selectedCellValue,
  setSelectedCellValue,
  valueChanged,
  setValueChanged,
  selectedFormulaName,
  setSelectedFormulaName,
  spreadsheet,
  setSelectedCell
}) => {

  const [formulas, setFormulas] = useState([]);
  
  useEffect(() => {

    //Fetch formulas
    const fetchData = async () => {
      try{
        let res = await axios.get("http://localhost:3000/get-formulas");
        setFormulas(res.data.formulas);
      }catch(error){
        console.log(error)
      }
    };

    fetchData();

    //Hide menu if clicked elsewhere
    const handleClickOutsideMenu = (event) => {
      const fileMenu = document.querySelector(".file-menu");
      const fileButton = document.querySelector(".file-button");

      const editMenu = document.querySelector(".edit-menu");
      const editButton = document.querySelector(".edit-button");
      const editForm =
        document.getElementById("edit-form-expand").style.display !== "none"
          ? document.getElementById("edit-form-expand")
          : document.getElementById("edit-form-reduce");

      if (
        fileMenu &&
        fileButton &&
        !fileMenu.contains(event.target) &&
        !fileButton.contains(event.target)
      ) {
        fileMenu.style.display = "none";
      }
      if (
        editMenu &&
        editButton &&
        editForm &&
        !editMenu.contains(event.target) &&
        !editButton.contains(event.target) &&
        !editForm.contains(event.target)
      ) {
        editMenu.style.display = "none";
        editForm.style.display = "none";
      }
    };

    document.body.addEventListener("click", handleClickOutsideMenu);
  }, []);

  //Toggle menu function
  const toggleMenu = (e) => {
    if (e.target.nextSibling.style.display == "none") {
      e.target.nextSibling.style.display = "block";
    } else {
      e.target.nextSibling.style.display = "none";
    }

    const editForm = document.getElementById("edit-form-expand").style.display !== "none"
      ? document.getElementById("edit-form-expand")
      : document.getElementById("edit-form-reduce");

    if(editForm && editForm.style.display !== "none"){
      editForm.style.display = "none";
    }
  };

  //Menu functions
  const handleSave = async () => {
    if(document.querySelector(".file-menu").style.display != "none"){
      document.querySelector(".file-menu").style.display = "none";
    }
    try{
      const rows = document.querySelectorAll(".row");
      let cellsWithValues = [];
  
      rows.forEach((row) => {
        const cells = row.firstElementChild.childNodes;
        cells.forEach((cell) => {
          if (cell.nodeName == "DIV" && cell.textContent != "") {
            cellsWithValues.push({
              value: cell.textContent,
              address: { col: cell.id.slice(0, 1), row: cell.id.slice(1) },
            });
          }
        });
      });
  
      const saveRes = await axios.post("http://localhost:3000/save-spreadsheet", {
        cells: cellsWithValues,
      });
  
      const filename = "spreadsheet.json";
  
      const res = await axios.get("http://localhost:3000/download-spreadsheet", {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      });
  
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      if (typeof window.navigator.msSaveBlob === "function") {
        window.navigator.msSaveBlob(res.data, filename);
      } else {
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
      }
    }catch(error){
      console.log(error);
    }
  };

  const handleFileUpload = async (event) => {
    if(document.querySelector(".file-menu").style.display != "none"){
      document.querySelector(".file-menu").style.display = "none";
    }
    try {
      const selectedFile = event.target.files[0];

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await axios.post(
        "http://localhost:3000/upload-spreadsheet",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSpreadsheet(res.data.spreadsheet);
      event.target.value = null;
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  const handleCreateNew = async () => {
    if(document.querySelector(".file-menu").style.display != "none"){
      document.querySelector(".file-menu").style.display = "none";
    }

    if (
      confirm(
        "Are you sure you want to create a new spreadsheet? If you haven't saved changes, the information will be lost."
      )
    ) {
      try{
        const res = await axios.get("http://localhost:3000/new-spreadsheet");
        setSpreadsheet(res.data.spreadsheet);


      // Select all cells and clear up their content
      const cells = document.querySelectorAll("div.cell");
      cells.forEach(cell => {
        cell.innerText = "";
        cell.setAttribute('data-formula', "");
      });

      //Clear up everything else
      setSelectedCellValue("");
      setSelectedCell({DOM: "", formula: ""});
      setSelectedFormulaName("");
      document.getElementById("select-function").value = "";


      }catch(error){
        console.log(error);
      }
    }
  };

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

  //Cell handler functions
  const handleChangeCellValue = (event) => {
    if (!selectedCell.DOM) {
      event.target.value = "";
      alert("Select a cell");
      return;
    }

    const cell = document.querySelector(`.cell#${event.target.id}`)
    if (cell.hasAttribute('data-formula')) {
      cell.setAttribute('data-formula', "");
      selectedCell.formula = "";
    }


    setSelectedCellValue(event.target.value);

    selectedCell.DOM.textContent = event.target.value;

    setValueChanged({ changed: true, id: event.target.id });
  };

  const handleUpdateValue = async (event) => {
    window.onbeforeunload = undefined;
    try{
      const newValue = event.target.value;

      if (valueChanged.changed) {
        const resSetValue = await axios.post("http://localhost:3000/set-value", {
          cell: {
            value: newValue,
            address: {
              col: valueChanged.id.slice(0, 1),
              row: valueChanged.id.slice(1),
            },
          },
        });
  
        if (!resSetValue.data.success) {
          const resCalculate = await axios.post("http://localhost:3000/calculate-formula", {
            cell: {
              value: newValue,
              address: {
                col: valueChanged.id.slice(0, 1),
                row: valueChanged.id.slice(1),
              },
            },
          });
  
          document.getElementById(valueChanged.id).setAttribute('data-formula', newValue);
          document.getElementById(valueChanged.id).innerText = resCalculate.data.result;
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
         const targetCellCol = valueChanged.id.slice(0, 1);
         const targetCellRow = parseInt(valueChanged.id.slice(1));
 
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
      }
      setValueChanged(false);

    }catch(error){
      console.log(error);
    }
  };

  const handleInputFocus = () => {
    window.onbeforeunload = function () {
      return "Data will be lost if you leave the page, are you sure?";
    };
  };

  //Select formula function
  const handleSelectFormula = (event) => {
    setSelectedFormulaName(event.target.value);
  };


  //Edit form states functions
  const displayEditForm = (type) => {
    let editForm;
    if(type === "expand"){
       editForm = document.getElementById("edit-form-expand");
       hideEditForm("reduce");
    }else if(type === "reduce"){
       editForm = document.getElementById("edit-form-reduce");
       hideEditForm("expand");
    }

    if(editForm && editForm.style.display === "none"){
      editForm.style.display = "flex";
    }


  }

  const hideEditForm = (type) => {
    let editForm;
    if (type === "expand") {
       editForm = document.getElementById("edit-form-expand");
    } else if (type === "reduce") {
       editForm = document.getElementById("edit-form-reduce");
    }
    if (editForm && editForm.style.display !== "none") {
      editForm.style.display = "none";
    }
  };

  //Add rows function
  const [expandRowNum, setExpandRowNum] = useState();
  const [reduceRowNum, setReduceRowNum] = useState();
  const [expandError, setExpandError] = useState(false);
  const [reduceError, setReduceError] = useState(false);

  const handleExpand = async (e) => {
    e.preventDefault();
    try{
      if(expandError){
        setExpandError(false);
      }
      const res = await axios.post("http://localhost:3000/expand-spreadsheet", {
        rowNum: expandRowNum,
      });

      setSpreadsheet(res.data.spreadsheet);
      setExpandRowNum("");
      hideEditForm("expand");
      document.querySelector(".edit-menu").style.display = "none";
    }catch(err){
      if(err.response){
        setExpandError(true)
      }
      console.log(err);
    }
  }

  const handleReduce = async (e) => {
    e.preventDefault();
    try{
      if(reduceError){
        setReduceError(false);
      }
      const res = await axios.post("http://localhost:3000/reduce-spreadsheet", {
        rowNum: reduceRowNum,
      });

      setSpreadsheet(res.data.spreadsheet);
      setReduceRowNum("");
      hideEditForm("reduce");
      document.querySelector(".edit-menu").style.display = "none";
    }catch(err){
      if(err.response){
        setReduceError(true)
      }
      console.log(err);
    }
  }
  

  return (
    <div className="toolbar">
      <div className="toolbar-top">
        <div className="file-actions">
          <button
            className="file-button"
            onClick={(e) => {
              toggleMenu(e);
            }}
          >
            File
          </button>
          <div className="file-menu">
            <ul>
              <li>
                <label htmlFor="file-save-input" id="file-save">
                  Save
                  <input
                    type="button"
                    name="file-save-input"
                    id="file-save-input"
                    onClick={handleSave}
                  />
                </label>
              </li>
              <li>
                <label htmlFor="file-create-input" id="file-create">
                  Create new
                  <input
                    type="button"
                    name="file-create-input"
                    id="file-create-input"
                    onClick={handleCreateNew}
                  />
                </label>
              </li>
              <li>
                <label htmlFor="file-upload-input" id="file-upload">
                  Upload
                  <input
                    type="file"
                    accept="application/json"
                    name="file-upload-input"
                    id="file-upload-input"
                    onChange={(e) => {
                      handleFileUpload(e);
                    }}
                  />
                </label>
              </li>
            </ul>
          </div>
        </div>

        <div className="edit-actions">
          <button
            className="edit-button"
            onClick={(e) => {
              toggleMenu(e);
            }}
          >
            Edit
          </button>

          <div className="edit-menu">
            <ul>
              <li onMouseOver={()=> {displayEditForm("expand")}}>
                <label htmlFor="edit-expand-input" id="edit-expand">
                  Add rows
                  <input
                    type="button"
                    name="edit-expand-input"
                    id="edit-expand-input"
                  />
                </label>
              </li>
              <li onMouseOver={() => {displayEditForm("reduce")}}>
                <label htmlFor="edit-reduce-input" id="edit-reduce">
                  Delete rows
                  <input
                    type="button"
                    name="edit-reduce-input"
                    id="edit-reduce-input"
                  />
                </label>
              </li>
              
            </ul>
          </div>

          <form
            id="edit-form-expand"
            className="edit-form"
            style={{ display: "none" }}
            onMouseLeave={() => {hideEditForm("expand")}}
            onSubmit={(e) => {
              handleExpand(e);
            }}
          >
            <label htmlFor="edit-form-input" className="edit-form-input-label">
              Enter number of rows you want to add
            </label>
            <input
              type="number"
              name="edit-form-input"
              id="edit-form-input"
              className="edit-form-input"
              autoComplete="off"
              value={expandRowNum}
              onChange={(e) => {
                setExpandRowNum(e.target.value);
              }}
            />
            {expandError && (
              <span className="edit-form-error">Value should be within 0 and 1000</span>
            )}

            <div className="edit-form-buttons">
              <button className="edit-form-submit-button" type="submit">
                Add
              </button>
            </div>
          </form>

          <form
            id="edit-form-reduce"
            className="edit-form"
            style={{ display: "none" }}
            onMouseLeave={() => {hideEditForm("reduce")}}
            onSubmit={(e) => {
              handleReduce(e);
            }}
          >
            <label htmlFor="edit-form-input" className="edit-form-input-label">
              Enter number of rows you want to remove
            </label>
            <input
              type="number"
              name="edit-form-input"
              id="edit-form-input"
              className="edit-form-input"
              autoComplete="off"
              value={reduceRowNum}
              onChange={(e) => {
                setReduceRowNum(e.target.value);
              }}
            />
            {reduceError && (
              <span className="edit-form-error">Invalid value</span>
            )}

            <div className="edit-form-buttons">
              <button className="edit-form-submit-button" type="submit">
                Add
              </button>
            </div>
          </form>


        </div>

        <div className="help-actions">
          <button className="help-button">Help</button>
          <div className="help-window">
            <div className="help-window-nav">
              <button>Operation</button>
              <button>Operation</button>
              <button>Operation</button>
            </div>
            <div className="window-info">
              <span>Info</span>
              <span>Info</span>
              <span>Info</span>
            </div>
          </div>
        </div>
      </div>
      <div className="toolbar-bottom">
        <label className="function-label" htmlFor="select-function">
          <img src={functionLogo} alt="Fx" />
        </label>
        <select
          name="select-function"
          id="select-function"
          onChange={(e) => {
            handleSelectFormula(e);
          }}
        >
          <option label="" value=""></option>
          {formulas &&
            formulas.map((formula, index) => (
              <option value={formula.name} label={formula.name} key={index}>
                {formula.name}
              </option>
            ))}
        </select>
        <label htmlFor="cell-value"></label>
        <input
          autoComplete="off"
          type="text"
          name="cell-value"
          className="cell-value-input"
          value={
            selectedFormulaName
              ? "=" + selectedFormulaName + "(:)"
              : selectedCell.formula
              ? selectedCell.formula
              : selectedCellValue
          }
          id={selectedCell.DOM.id}
          onInput={(e) => {
            handleChangeCellValue(e);
          }}
          onBlur={(e) => {
            handleUpdateValue(e);
          }}
          onFocus={handleInputFocus}
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  );
};

export default Toolbar;