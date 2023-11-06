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
      if (
        fileMenu &&
        fileButton &&
        !fileMenu.contains(event.target) &&
        !fileButton.contains(event.target)
      ) {
        fileMenu.style.display = "none";
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

  //Cell handler functions
  const handleChangeCellValue = (event) => {
    if (event.target.hasAttribute('data-formula')) {
      event.target.setAttribute('data-formula', "");
    }

    if (!selectedCell.DOM) {
      event.target.value = "";
      alert("Select a cell");
      return;
    }
    setSelectedFormulaName("");
    setSelectedCellValue(event.target.value);

    selectedCell.DOM.textContent = event.target.value;

    setValueChanged({ changed: true, id: event.target.id });
  };

  const handleUpdateValue = async (event) => {
    window.onbeforeunload = undefined;
    try{
      const newValue = event.target.value;

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
  
        if (!res.data.success) {
          res = await axios.post("http://localhost:3000/calculate-formula", {
            cell: {
              value: newValue,
              address: {
                col: valueChanged.id.slice(0, 1),
                row: valueChanged.id.slice(1),
              },
            },
          });
  
          document.getElementById(valueChanged.id).setAttribute('data-formula', newValue);
          document.getElementById(valueChanged.id).innerText = res.data.result;
        }
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
        <div className="help-actions">
          <button className="help-button">Help</button>
          <div className="help-window">
            <div className="help-window-nav">
              <button>Operation</button><button>Operation</button><button>Operation</button>
            </div>
            <div className="window-info">
              <span>Info</span><span>Info</span><span>Info</span>
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