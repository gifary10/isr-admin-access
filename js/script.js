// Replace with your deployed Web App URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwYuOaXAZxaI5C1e3PEjHUUyl_7P5P0-uwYRuzvcVv5jJwsPA2rD272IEwk6WwUbMPliQ/exec";

// Load data from Google Sheet
async function loadData() {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getData`);
        const data = await response.json();
        displayData(data);
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to load data");
    }
}

// Display data in table
function displayData(data) {
    if (data.length === 0) {
        document.getElementById('data-table-body').innerHTML = '<tr><td colspan="100" class="text-center">No data available</td></tr>';
        return;
    }
    
    const headers = Object.keys(data[0]);
    const headersRow = document.getElementById('headers');
    const dataBody = document.getElementById('data-table-body');
    
    headersRow.innerHTML = '';
    dataBody.innerHTML = '';
    
    // Add headers (skip rowNum)
    headers.forEach(header => {
        if (header !== 'rowNum') {
            const th = document.createElement('th');
            th.textContent = header;
            headersRow.appendChild(th);
        }
    });
    
    // Add action header
    const actionTh = document.createElement('th');
    actionTh.textContent = 'Actions';
    headersRow.appendChild(actionTh);
    
    // Add data rows
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        headers.forEach(header => {
            if (header !== 'rowNum') {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                tr.appendChild(td);
            }
        });
        
        // Add action buttons
        const actionTd = document.createElement('td');
        actionTd.innerHTML = `
            <div class="btn-group btn-group-sm">
                <a href="edit.html?id=${index}" class="btn btn-warning">
                    <i class="bi bi-pencil-square"></i> Edit
                </a>
                <button onclick="deleteRow(${index})" class="btn btn-danger">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </div>
        `;
        tr.appendChild(actionTd);
        
        dataBody.appendChild(tr);
    });
}

// Generate form fields dynamically
async function generateFormFields(formId, action) {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getHeaders`);
        const headers = await response.json();
        
        const formFields = document.getElementById('form-fields');
        formFields.innerHTML = '';
        
        headers.forEach(header => {
            if (header !== 'rowNum') {
                const div = document.createElement('div');
                div.className = 'mb-3';
                div.innerHTML = `
                    <label for="${header}" class="form-label">${header}</label>
                    <input type="text" class="form-control" id="${header}" name="${header}">
                `;
                formFields.appendChild(div);
            }
        });
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to load form fields");
    }
}

// Load data for editing
async function loadDataForEdit(id) {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getDataById&id=${id}`);
        const data = await response.json();
        
        const formFields = document.getElementById('form-fields');
        formFields.innerHTML = '';
        
        Object.keys(data).forEach(key => {
            if (key !== 'rowNum') {
                const div = document.createElement('div');
                div.className = 'mb-3';
                div.innerHTML = `
                    <label for="${key}" class="form-label">${key}</label>
                    <input type="text" class="form-control" id="${key}" name="${key}" value="${data[key] || ''}">
                `;
                formFields.appendChild(div);
            }
        });
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to load data for editing");
    }
}

// Submit form data
async function submitForm(action, id = null) {
    const form = document.getElementById(`${action}-form`);
    const formData = {};
    
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        formData[input.name] = input.value;
    });
    
    try {
        let url = WEB_APP_URL;
        const params = new URLSearchParams();
        params.append('action', action === 'add' ? 'addData' : 'updateData');
        if (id) params.append('id', id);
        
        // Convert formData to URL-encoded string
        for (const key in formData) {
            params.append(key, formData[key]);
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });
        
        const result = await response.text();
        alert(result);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to submit form");
    }
}

// Delete a row
async function deleteRow(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        try {
            const response = await fetch(`${WEB_APP_URL}?action=deleteData&id=${id}`);
            const result = await response.text();
            alert(result);
            loadData();
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to delete data");
        }
    }
}

// Make functions available globally
window.deleteRow = deleteRow;
window.loadData = loadData;
window.generateFormFields = generateFormFields;
window.loadDataForEdit = loadDataForEdit;
window.submitForm = submitForm;
