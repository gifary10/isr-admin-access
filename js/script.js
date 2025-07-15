// Replace with your deployed Web App URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwJBLPg_q-E4AbJ6WVFMvyYw4dQrZ5w2CjAJTg6VV5XNEqg1UY713nMhkE6HAnF0Y2b4Q/exec";

// Load data from Google Sheet
async function loadData() {
    try {
        showLoading(true);
        const response = await fetch(`${WEB_APP_URL}?action=getData`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayData(data);
    } catch (error) {
        console.error("Error loading data:", error);
        alert("Failed to load data: " + error.message);
    } finally {
        showLoading(false);
    }
}

// Display loading indicator
function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Display data in table
function displayData(data) {
    const headersRow = document.getElementById('headers');
    const dataBody = document.getElementById('data-table-body');
    
    // Clear existing content
    headersRow.innerHTML = '';
    dataBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        dataBody.innerHTML = '<tr><td colspan="100" class="text-center">No data available</td></tr>';
        return;
    }
    
    // Get headers from first item (excluding internal fields)
    const headers = Object.keys(data[0]).filter(header => header !== 'rowNum');
    
    // Add headers
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headersRow.appendChild(th);
    });
    
    // Add action header
    const actionTh = document.createElement('th');
    actionTh.textContent = 'Actions';
    headersRow.appendChild(actionTh);
    
    // Add data rows
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        // Add data cells
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        
        // Add action buttons
        const actionTd = document.createElement('td');
        actionTd.innerHTML = `
          <div class="btn-group btn-group-sm">
            <a href="edit.html?id=${index}" class="btn btn-warning">
              <i class="bi bi-pencil-square">edit</i>
            </a>
            <button onclick="deleteRow(${index})" class="btn btn-danger">
              <i class="bi bi-trash">delete</i>
            </button>
          </div>
        `;
        tr.appendChild(actionTd);
        
        dataBody.appendChild(tr);
    });
}

// ... (rest of your functions remain the same)

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Create loading indicator if it doesn't exist
    if (!document.getElementById('loading-indicator')) {
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.style.display = 'none';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100%';
        loader.style.height = '100%';
        loader.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loader.style.justifyContent = 'center';
        loader.style.alignItems = 'center';
        loader.style.zIndex = '1000';
        loader.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loader);
    }
    
    // Initialize based on current page
    if (document.getElementById('data-table-body')) {
        loadData();
    } else if (document.getElementById('edit-form')) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) loadDataForEdit(id);
    } else if (document.getElementById('input-form')) {
        generateFormFields('input-form', 'add');
    }
});

// Make functions available globally
window.deleteRow = deleteRow;
window.submitForm = submitForm;