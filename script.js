const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwgNavRUlCMgXVClzOcsPoWG4A4CB2bC-uZF3Lz3ne8WVFIHvV1Dg3a03xZJbAvg3sR5A/exec';

function getUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('product-form').addEventListener('submit', handleSubmit);
  document.getElementById('cancel-btn').addEventListener('click', resetForm);
  loadProducts();
});

function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value || getUUID();
  const kategori = document.getElementById('kategori').value.trim();
  const namaAplikasi = document.getElementById('nama-aplikasi').value.trim();
  const deskripsi = document.getElementById('deskripsi').value.trim();
  const status = document.getElementById('status').value.trim();
  const link = document.getElementById('link').value.trim();

  if (!kategori || !namaAplikasi || !deskripsi || !status || !link) {
    return alert('Harap isi semua kolom.');
  }

  const action = document.getElementById('product-id').value ? 'updateProduct' : 'addProduct';

  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, id, kategori, namaAplikasi, deskripsi, status, link })
  })
  .then(res => res.json())
  .then(() => {
    resetForm();
    loadProducts();
  })
  .catch(err => alert('Gagal menyimpan data.'));
}

function loadProducts() {
  fetch(`${ENDPOINT}?action=getProducts`)
    .then(res => res.json())
    .then(data => renderProducts(data.data))
    .catch(() => alert('Gagal memuat data.'));
}

function renderProducts(products) {
  const tbody = document.getElementById('product-table-body');
  tbody.innerHTML = '';

  if (!products || !products.length) {
    tbody.innerHTML = '<tr><td colspan="7">Tidak ada data</td></tr>';
    return;
  }

  products.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.Nomor}</td>
      <td>${product.Kategori}</td>
      <td>${product['Nama Aplikasi']}</td>
      <td>${product.Deskripsi}</td>
      <td>${product.Status}</td>
      <td><a href="${product.Link}" target="_blank">Open</a></td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editProduct('${product.ID}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${product.ID}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editProduct(id) {
  fetch(`${ENDPOINT}?action=getProducts`)
    .then(res => res.json())
    .then(data => {
      const product = data.data.find(p => p.ID === id);
      if (!product) return;

      document.getElementById('product-id').value = product.ID;
      document.getElementById('kategori').value = product.Kategori;
      document.getElementById('nama-aplikasi').value = product['Nama Aplikasi'];
      document.getElementById('deskripsi').value = product.Deskripsi;
      document.getElementById('status').value = product.Status;
      document.getElementById('link').value = product.Link;

      document.getElementById('form-title').textContent = 'Edit Product';
      document.getElementById('submit-btn').textContent = 'Update';
      document.getElementById('cancel-btn').style.display = 'inline-block';
    });
}

function deleteProduct(id) {
  if (!confirm('Hapus produk ini?')) return;
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteProduct', id })
  })
  .then(res => res.json())
  .then(() => loadProducts())
  .catch(() => alert('Gagal menghapus data.'));
}

function resetForm() {
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('form-title').textContent = 'Product CRUD App';
  document.getElementById('submit-btn').textContent = 'Save';
  document.getElementById('cancel-btn').style.display = 'none';
}
