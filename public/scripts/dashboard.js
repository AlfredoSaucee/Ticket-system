function sort_table(column_index) {
    const header = ticket_table.querySelectorAll("th")[column_index];
    sort_direction[column_index] = !sort_direction[column_index];
  
    rows.sort((a, b) => {
      let cell_a = a.cells[column_index].innerText.toLowerCase();
      let cell_b = b.cells[column_index].innerText.toLowerCase();
  
      // Numerical comparison
      if (!isNaN(cell_a) && !isNaN(cell_b)) {
        return sort_direction[column_index] ? cell_a - cell_b : cell_b - cell_a;
      }
  
      // Alphabetical comparison
      return sort_direction[column_index] 
        ? cell_a.localeCompare(cell_b) 
        : cell_b.localeCompare(cell_a);
    });
  
    tbody.innerHTML = "";
    rows.forEach(row => tbody.appendChild(row));
    update_sort_arrow(header, sort_direction[column_index]);
  }