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
        <a href="edit.html?id=${index}" class="btn btn-warning" title="Edit">
            <i class="bi bi-pencil-square"></i>
        </a>
        <button onclick="deleteRow(${index})" class="btn btn-danger" title="Delete">
            <i class="bi bi-trash"></i>
        </button>
    </div>
`;
tr.appendChild(actionTd);

dataBody.appendChild(tr);

// Generate form fields dynamically
async function generateFormFields(formId, action) {
    try {
        showLoading(true);
        const response = await fetch(`${WEB_APP_URL}?action=getHeaders`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const headers = await response.json();
        const formFields = document.getElementById('form-fields');
        formFields.innerHTML = '';
        
        // Filter out internal fields
        const filteredHeaders = headers.filter(header => header !== 'rowNum');
        
        filteredHeaders.forEach(header => {
            const div = document.createElement('div');
            div.className = 'mb-3';
            div.innerHTML = `
                <label for="${header}" class="form-label">${header}</label>
                <input type="text" class="form-control" id="${header}" name="${header}" required>
            `;
            formFields.appendChild(div);
        });
    } catch (error) {
        console.error("Error generating form fields:", error);
        alert("Failed to load form fields: " + error.message);
    } finally {
        showLoading(false);
    }
}

// Load data for editing
async function loadDataForEdit(id) {
    try {
        showLoading(true);
        const response = await fetch(`${WEB_APP_URL}?action=getDataById&id=${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const formFields = document.getElementById('form-fields');
        formFields.innerHTML = '';
        
        // Filter out internal fields
        const filteredData = Object.keys(data).filter(key => key !== 'rowNum');
        
        filteredData.forEach(key => {
            const div = document.createElement('div');
            div.className = 'mb-3';
            div.innerHTML = `
                <label for="${key}" class="form-label">${key}</label>
                <input type="text" class="form-control" id="${key}" name="${key}" 
                       value="${data[key] || ''}" required>
            `;
            formFields.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading data for edit:", error);
        alert("Failed to load data for editing: " + error.message);
    } finally {
        showLoading(false);
    }
}

// Submit form data
async function submitForm(action, id = null) {
    try {
        showLoading(true);

        const formId = (action === 'add') ? 'input-form' : (action === 'edit' ? 'edit-form' : `${action}-form`);
        const form = document.getElementById(formId);

        if (!form || !(form instanceof HTMLFormElement)) {
            throw new Error(`Form with id "${formId}" not found or invalid.`);
        }

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        const params = new URLSearchParams();
        params.append('action', action === 'add' ? 'addData' : 'updateData');
        if (id) params.append('id', id);

        for (const key in data) {
            params.append(key, data[key]);
        }

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.text();
        alert(result);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Failed to submit form: " + error.message);
    } finally {
        showLoading(false);
    }
}

// Delete a row
async function deleteRow(id) {
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${WEB_APP_URL}?action=deleteData&id=${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.text();
        
        if (result.startsWith("Error")) {
            throw new Error(result);
        }
        
        alert(result);
        loadData(); // Refresh the data table
    } catch (error) {
        console.error("Error deleting row:", error);
        alert(error.message || "Failed to delete data");
    } finally {
        showLoading(false);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Create loading indicator if it doesn't exist
    if (!document.getElementById('loading-indicator')) {
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loader);
    }
    
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
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