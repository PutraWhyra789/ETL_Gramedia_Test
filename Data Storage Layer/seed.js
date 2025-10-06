// Data Storage Layer/seed.js
const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '', // Ganti jika punya password (yang ada di XAMPP)
  database: 'gramedia_oltp',
  port: 3306
};

async function seedData() {
  const connection = await mysql.createConnection(config);

  try {
    console.log("Membersihkan data lama...");
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('DELETE FROM sales');
    await connection.query('DELETE FROM transaction_details');
    await connection.query('DELETE FROM transactions');
    await connection.query('DELETE FROM employees');
    await connection.query('DELETE FROM customers');
    await connection.query('DELETE FROM products');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log("Menyisipkan produk...");
    const products = [
      ['Buku Novel Laskar Pelangi', 'Buku', 89000, 100],
      ['Buku Panduan Belajar Pemrograman', 'Buku', 120000, 80],
      ['Buku Sejarah Indonesia', 'Buku', 95000, 70],
      ['Buku Biografi Soekarno', 'Buku', 110000, 60],
      ['Buku Fiksi Fana', 'Buku', 75000, 90],
      ['Pensil 2B Faber-Castell', 'Alat Tulis', 5000, 200],
      ['Pulpen Pilot G-2', 'Alat Tulis', 8000, 150],
      ['Penghapus Staedtler', 'Alat Tulis', 3000, 180],
      ['USB Flashdisk 32GB', 'Aksesori Digital', 120000, 30],
      ['Headset Wireless Bluetooth', 'Aksesori Digital', 250000, 20],
      ['Kabel Data USB-C', 'Aksesori Digital', 45000, 100]
    ];

    for (const [name, category, price, stock] of products) {
      await connection.query(
        'INSERT INTO products (name, category, price, stock_quantity) VALUES (?, ?, ?, ?)',
        [name, category, price, stock]
      );
    }

    console.log("Menyisipkan pelanggan...");
    const customers = [
      [1, 'Andi Prasetyo', 'andi@example.com', '081234567890', 'Jl. Lambung Mangkurat No. 12, Banjarmasin'],
      [2, 'Budi Santoso', 'budi@example.com', '081234567891', 'Jl. A. Yani Km. 5, Banjarmasin'],
      [3, 'Citra Dewi', 'citra@example.com', '081234567892', 'Jl. Sultan Adam No. 45, Banjarmasin'],
      [4, 'Eko Prasetya', 'eko@example.com', '081234567893', 'Jl. Gatot Subroto No. 89, Banjarmasin'],
      [5, 'Lia Andini', 'lia@example.com', '081234567894', 'Jl. Ahmad Yani No. 10, Banjarmasin']
    ];

    for (const [customer_id, name, email, phone, address] of customers) {
      await connection.query(
        'INSERT INTO customers (customer_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [customer_id, name, email, phone, address]
      );
    }

    console.log("Menyisipkan karyawan...");
    const employees = [
      [1, 'Rina Wijaya', 'Kasir', 'Gramedia Veteran', '2023-01-15'],
      [2, 'Dedi Setiawan', 'Sales Associate', 'Gramedia Dutamall Banjarmasin', '2023-03-20'],
      [3, 'Sari Dewi', 'Kasir', 'Gramedia Veteran', '2023-02-10'],
      [4, 'Ahmad Fauzi', 'Sales Associate', 'Gramedia Dutamall Banjarmasin', '2023-04-05']
    ];

    for (const [employee_id, name, position, store_location, hire_date] of employees) {
      await connection.query(
        'INSERT INTO employees (employee_id, name, position, store_location, hire_date) VALUES (?, ?, ?, ?, ?)',
        [employee_id, name, position, store_location, hire_date]
      );
    }

    console.log("Menyisipkan transaksi dan detail...");

    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    const transactions = [
      { transaction_id: 1, customer_id: 1, transaction_date: '2024-09-10', payment_method: 'E-Wallet', details: [[1, 2], [6, 3]] },
      { transaction_id: 2, customer_id: 2, transaction_date: '2024-09-11', payment_method: 'Credit Card', details: [[4, 1], [8, 2]] },
      { transaction_id: 3, customer_id: 3, transaction_date: '2024-09-12', payment_method: 'Cash', details: [[3, 1], [10, 1]] },
      { transaction_id: 4, customer_id: 4, transaction_date: '2024-09-13', payment_method: 'Transfer Bank', details: [[5, 2], [7, 1], [9, 1]] },
      { transaction_id: 5, customer_id: 5, transaction_date: '2024-09-14', payment_method: 'E-Wallet', details: [[2, 1], [11, 2]] }
    ];

    for (const tx of transactions) {
      await connection.query(
        'INSERT INTO transactions (transaction_id, customer_id, transaction_date, total_amount, payment_method) VALUES (?, ?, ?, ?, ?)',
        [tx.transaction_id, tx.customer_id, tx.transaction_date, 0, tx.payment_method]
      );

      let totalAmount = 0;

      for (const [productId, qty] of tx.details) {
        const [product] = await connection.query('SELECT price FROM products WHERE product_id = ?', [productId]);
        if (!product || product.length === 0) {
          console.error(`Produk dengan ID ${productId} tidak ditemukan!`);
          continue;
        }

        const unitPrice = product[0].price;
        const subtotal = unitPrice * qty;
        totalAmount += subtotal;

        await connection.query(
          'INSERT INTO transaction_details (transaction_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [tx.transaction_id, productId, qty, unitPrice, subtotal]
        );
      }

      await connection.query('UPDATE transactions SET total_amount = ? WHERE transaction_id = ?', [totalAmount, tx.transaction_id]);

      const employeeId = (tx.transaction_id % 4 === 0) ? 4 : (tx.transaction_id % 3 === 0) ? 3 : (tx.transaction_id % 2 === 0) ? 2 : 1;
      await connection.query(
        'INSERT INTO sales (transaction_id, employee_id) VALUES (?, ?)',
        [tx.transaction_id, employeeId]
      );
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('Data dummy berhasil di-seed ke OLTP MySQL.');
  } catch (err) {
    console.error('Error dalam proses seeding:', err);
  } finally {
    await connection.end();
  }
}

seedData();