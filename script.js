document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbzuOLBtkiMm-Kp3DojnhcSGzg8SsqMlyEltYpvLJLxYX0Kbn07aN2ggL6vrteSD4KZNQw/exec',
    REQUEST_TIMEOUT: 20000,
    DEBOUNCE_DELAY: 500,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    OFFLINE_MESSAGE: 'You are currently offline. Please check your internet connection.',
    SERVER_ERROR_MESSAGE: 'Server is not responding. Please try again later.'
  };

  // DOM Elements
  const elements = {
    userTable: document.getElementById('userTable').getElementsByTagName('tbody')[0],
    addUserBtn: document.getElementById('addUserBtn'),
    userModal: document.getElementById('userModal'),
    confirmModal: document.getElementById('confirmModal'),
    userForm: document.getElementById('userForm'),
    searchInput: document.getElementById('searchInput'),
    noResults: document.getElementById('noResults'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    tableLoading: document.getElementById('tableLoading'),
    loading: document.createElement('div'),
    userId: document.getElementById('userId'),
    nameInput: document.getElementById('name'),
    emailInput: document.getElementById('email'),
    produkInput: document.getElementById('produk'),
    nameError: document.getElementById('nameError'),
    emailError: document.getElementById('emailError'),
    produkError: document.getElementById('produkError'),
    confirmDeleteBtn: document.getElementById('confirmDelete'),
    cancelDeleteBtn: document.getElementById('cancelDelete'),
    offlineBanner: document.createElement('div')
  };

  // State management
  const state = {
    users: [],
    currentUserId: null,
    isEditMode: false,
    abortController: null,
    retryCount: 0,
    isOnline: navigator.onLine
  };

  // Initialize the app
  async function init() {
    setupLoadingIndicator();
    setupOfflineBanner();
    setupEventListeners();
    checkNetworkStatus();
    await fetchUsersWithRetry();
  }

  // Set up loading indicator
  function setupLoadingIndicator() {
    elements.loading.id = 'loading';
    elements.loading.className = 'loading-overlay';
    elements.loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(elements.loading);
  }

  // Set up offline banner
  function setupOfflineBanner() {
    elements.offlineBanner.id = 'offlineBanner';
    elements.offlineBanner.className = 'offline-banner';
    elements.offlineBanner.innerHTML = `
      <i class="fas fa-wifi"></i>
      <span>${CONFIG.OFFLINE_MESSAGE}</span>
    `;
    elements.offlineBanner.style.display = 'none';
    document.body.appendChild(elements.offlineBanner);
  }

  // Check network status
  function checkNetworkStatus() {
    window.addEventListener('online', () => {
      state.isOnline = true;
      elements.offlineBanner.style.display = 'none';
      fetchUsersWithRetry();
    });

    window.addEventListener('offline', () => {
      state.isOnline = false;
      elements.offlineBanner.style.display = 'flex';
      showToast(CONFIG.OFFLINE_MESSAGE, 'warning');
    });
  }

  // Set up event listeners
  function setupEventListeners() {
    elements.addUserBtn.addEventListener('click', openAddUserModal);
    elements.userForm.addEventListener('submit', handleFormSubmit);
    
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });
    
    elements.confirmDeleteBtn.addEventListener('click', confirmDelete);
    elements.cancelDeleteBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', function(event) {
      if (event.target === elements.userModal || event.target === elements.confirmModal) {
        closeModal();
      }
    });
    
    elements.searchInput.addEventListener('input', debounce(handleSearch, CONFIG.DEBOUNCE_DELAY));
  }

  // Debounce function
  function debounce(func, timeout = CONFIG.DEBOUNCE_DELAY) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }

  // Fetch users with retry mechanism
  async function fetchUsersWithRetry() {
    if (!state.isOnline) {
      showToast(CONFIG.OFFLINE_MESSAGE, 'warning');
      return;
    }

    try {
      await fetchUsers();
      state.retryCount = 0; // Reset retry count on success
    } catch (error) {
      if (state.retryCount < CONFIG.MAX_RETRIES) {
        state.retryCount++;
        showToast(`Retrying... (${state.retryCount}/${CONFIG.MAX_RETRIES})`, 'warning');
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        await fetchUsersWithRetry();
      } else {
        showToast(CONFIG.SERVER_ERROR_MESSAGE, 'error');
        state.users = [];
        renderUserTable(state.users);
      }
    }
  }

  // Fetch users from API
  async function fetchUsers() {
    try {
      showTableLoading();
      
      // Abort previous request if exists
      if (state.abortController) {
        state.abortController.abort();
      }
      
      state.abortController = new AbortController();
      const timeoutId = setTimeout(() => state.abortController.abort(), CONFIG.REQUEST_TIMEOUT);
      
      const url = new URL(CONFIG.API_URL);
      url.searchParams.append('action', 'getUsers');
      url.searchParams.append('timestamp', new Date().getTime());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: state.abortController.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data && data.status === 'success') {
        state.users = data.data.map(user => ({
          id: user.No,
          name: user.User,
          email: user.Email,
          produk: user.Produk,
          kodeAkses: user['Kode Akses'] || '',
          link: user.Link || ''
        }));
        renderUserTable(state.users);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(CONFIG.OFFLINE_MESSAGE);
      } else {
        console.error('Error fetching users:', error);
        throw error;
      }
    } finally {
      hideTableLoading();
    }
  }

  // Render user table
  function renderUserTable(usersToRender) {
    elements.userTable.innerHTML = '';
    
    if (usersToRender.length === 0) {
      elements.noResults.style.display = 'flex';
      return;
    }
    
    elements.noResults.style.display = 'none';
    
    usersToRender.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(user.id)}</td>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.produk)}</td>
        <td>${escapeHtml(user.kodeAkses)}</td>
        <td><a href="${escapeHtml(user.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(user.link)}</a></td>
        <td>
          <div class="action-buttons">
            <button class="action-btn edit-btn" data-id="${user.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${user.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      `;
      elements.userTable.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        openEditUserModal(id);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        openDeleteConfirmation(id);
      });
    });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Show/hide table loading
  function showTableLoading() {
    elements.tableLoading.style.display = 'flex';
    elements.noResults.style.display = 'none';
  }

  function hideTableLoading() {
    elements.tableLoading.style.display = 'none';
  }

  // Open modals
  function openAddUserModal() {
    state.isEditMode = false;
    document.getElementById('modalTitle').textContent = 'Add New User';
    elements.userId.value = '';
    elements.userForm.reset();
    clearErrorMessages();
    elements.userModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function openEditUserModal(id) {
    state.isEditMode = true;
    document.getElementById('modalTitle').textContent = 'Edit User';
    const user = state.users.find(user => user.id === id);
    
    if (user) {
      elements.userId.value = user.id;
      elements.nameInput.value = user.name;
      elements.emailInput.value = user.email;
      elements.produkInput.value = user.produk;
      clearErrorMessages();
      elements.userModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  function openDeleteConfirmation(id) {
    state.currentUserId = id;
    elements.confirmModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  // Close modal
  function closeModal() {
    elements.userModal.style.display = 'none';
    elements.confirmModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const userData = {
      User: elements.nameInput.value.trim(),
      Email: elements.emailInput.value.trim(),
      Produk: elements.produkInput.value.trim()
    };
    
    try {
      showLoading();
      
      if (state.isEditMode) {
        await updateUser(parseInt(elements.userId.value), userData);
        showToast('User updated successfully!');
      } else {
        await addUser(userData);
        showToast('User added successfully!');
      }
      
      closeModal();
      await fetchUsersWithRetry();
    } catch (error) {
      console.error('Error saving user:', error);
      showToast(error.message || 'Error saving user', 'error');
    } finally {
      hideLoading();
    }
  }

  // Validate form
  function validateForm() {
    let isValid = true;
    const name = elements.nameInput.value.trim();
    const email = elements.emailInput.value.trim();
    const produk = elements.produkInput.value.trim();
    
    clearErrorMessages();
    
    // Validate name
    if (!name) {
      elements.nameError.textContent = 'Name is required';
      isValid = false;
    } else if (name.length < 3) {
      elements.nameError.textContent = 'Name must be at least 3 characters';
      isValid = false;
    }
    
    // Validate email
    elements.emailInput.setCustomValidity('');
    if (!email) {
      elements.emailError.textContent = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      elements.emailError.textContent = 'Please enter a valid email';
      isValid = false;
    }
    
    // Validate produk
    if (!produk) {
      elements.produkError.textContent = 'Produk is required';
      isValid = false;
    }
    
    return isValid;
  }

  // Clear error messages
  function clearErrorMessages() {
    elements.nameError.textContent = '';
    elements.emailError.textContent = '';
    elements.produkError.textContent = '';
  }

  // API operations
  async function addUser(userData) {
    if (!state.isOnline) {
      throw new Error(CONFIG.OFFLINE_MESSAGE);
    }

    const payload = {
      action: 'addUser',
      user: userData
    };
    
    const response = await fetchWithTimeout(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    const result = JSON.parse(text);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to add user');
    }
  }

  async function updateUser(id, userData) {
    if (!state.isOnline) {
      throw new Error(CONFIG.OFFLINE_MESSAGE);
    }

    const payload = {
      action: 'updateUser',
      id: id,
      user: userData
    };
    
    const response = await fetchWithTimeout(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    const result = JSON.parse(text);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to update user');
    }
  }

  async function deleteUser(id) {
    if (!state.isOnline) {
      throw new Error(CONFIG.OFFLINE_MESSAGE);
    }

    const payload = {
      action: 'deleteUser',
      id: id
    };
    
    const response = await fetchWithTimeout(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    const result = JSON.parse(text);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to delete user');
    }
  }

  // Fetch with timeout
  async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(CONFIG.OFFLINE_MESSAGE);
      }
      throw error;
    }
  }

  // Confirm delete
  async function confirmDelete() {
    try {
      showLoading();
      await deleteUser(state.currentUserId);
      showToast('User deleted successfully!');
      closeModal();
      await fetchUsersWithRetry();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(error.message || 'Error deleting user', 'error');
    } finally {
      hideLoading();
    }
  }

  // Handle search
  function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    
    if (!searchTerm) {
      renderUserTable(state.users);
      return;
    }
    
    const filteredUsers = state.users.filter(user => 
      (user.name && user.name.toLowerCase().includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm)) ||
      (user.produk && user.produk.toLowerCase().includes(searchTerm)) ||
      (user.kodeAkses && user.kodeAkses.toLowerCase().includes(searchTerm))
    );
    
    renderUserTable(filteredUsers);
  }

  // Show/hide loading
  function showLoading() {
    elements.loading.style.display = 'flex';
  }

  function hideLoading() {
    elements.loading.style.display = 'none';
  }

  // Show toast notification
  function showToast(message, type = 'success') {
    elements.toast.className = `toast ${type}`;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 3000);
  }

  // Initialize the app
  init();
});
