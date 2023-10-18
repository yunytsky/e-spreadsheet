const Toolbar = () => {
   return (
      <div className="toolbar">

         <button className="file-button">
            File
         </button>

         <div className="file-menu">
            <ul>
               <li>Save</li>
               <li>Create new</li>
               <li>Upload</li>
            </ul>
         </div>

         <label htmlFor="cell-address"></label>
         <input type="text" name="cell-address" id="cell-address" />

         <label htmlFor="cell-value"></label>
         <input type="text" name="cell-value" id="cell-value" />
      </div>
   );
}

export default Toolbar;