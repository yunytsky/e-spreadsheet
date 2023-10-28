import { useEffect, useRef, useState } from "react";
import axios, { spread } from "axios";


const Toolbar = ({
  spreadsheet,
  setSpreadsheet,
  selectedCell,
  selectedCellValue,
  setSelectedCellValue,
  valueChanged,
  setValueChanged,
  selectedFormulaName,
  setSelectedFormulaName,
}) => {

  const [formulas, setFormulas] = useState([]);
  
  useEffect(() => {
    //Fetch formulas
    const fetchData = async () => {
      let res = await axios.get("http://localhost:3000/formulas");
      setFormulas(res.data.formulas);
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

    const res2 = await axios.post("http://localhost:3000/save-spreadsheet", {
      cells: cellsWithValues,
    });
    const filename = "spreadsheet.json"; // Set your desired filename here

    const res = await axios.get("http://localhost:3000/download", {
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
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];

    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
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
      console.error("Error uploading file: ", error);
    }
  };

  const handleCreateSpreadsheet = async () => {
    if (
      confirm(
        "Are you sure you want to create a new spreadsheet? If you haven't saved changes, the information will be lost."
      )
    ) {
      const res = await axios.get("http://localhost:3000/new-spreadsheet");
      console.log(res);
      setSpreadsheet(res.data.spreadsheet);
    }
  };

  //Cell handler functions
  const handleChangeCellValue = (event) => {
    if (!selectedCell) {
      event.target.value = "";
      alert("Select a cell");
      return;
    }
    setSelectedFormulaName("");
    setSelectedCellValue(event.target.value);

    selectedCell.innerText = event.target.value;

    setValueChanged({ changed: true, id: event.target.id });
  };

  const handleUpdateValue = async (event) => {
    window.onbeforeunload = undefined;
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

        document.getElementById(valueChanged.id).innerText = res.data.result;
      }
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
              <button id="file-save" onClick={handleSave}>
                Save
              </button>
            </li>
            <li>
              <button id="file-create" onClick={handleCreateSpreadsheet}>
                Create new
              </button>
            </li>
            <li>
              <label htmlFor="file-input" id="file-upload">
                Upload
                <input
                  type="file"
                  name="file-input"
                  id="file-input"
                  onChange={(e) => {handleFileChange(e)}}
                />
              </label>
            </li>
          </ul>
        </div>
      </div>

      <label htmlFor="function"></label>
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
        type="text"
        name="cell-value"
        value={
          selectedFormulaName
            ? "=" + selectedFormulaName + "(:)"
            : selectedCellValue
        }
        id={selectedCell.id}
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
  );
};

export default Toolbar;