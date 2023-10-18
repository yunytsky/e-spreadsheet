const Spreadsheet = () => {

   const spreadsheetLoader = async () => {
      console.log("res sent") //remove
      const res = await axios.get("http://localhost:3000/get-cells");
   }

   return(
      <div className="spreadsheet">
         sprsheet
      </div>
   )

}



export default Spreadsheet;