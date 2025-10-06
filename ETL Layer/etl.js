// ETL Layer/etl.js
const mysql = require('mysql2/promise');

const oltpConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Ganti jika punya password (yang ada di XAMPP)
  database: 'gramedia_oltp',
  port: 3306
};

const dwConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Ganti jika punya password (yang ada di XAMPP)
  database: 'gramedia_dw',
  port: 3306
};

async function runETL() {
  const oltpConnection = await mysql.createConnection(oltpConfig);
  const dwConnection = await mysql.createConnection(dwConfig);

  try {
    console.log("Mengambil data transaksi dari OLTP...");

    const [transactions] = await oltpConnection.query(`
      SELECT 
        t.transaction_id,
        t.customer_id,
        t.transaction_date,
        t.total_amount,
        t.payment_method,
        td.product_id,
        td.quantity,
        td.subtotal,
        s.employee_id
      FROM transactions t
      JOIN transaction_details td ON t.transaction_id = td.transaction_id
      LEFT JOIN sales s ON t.transaction_id = s.transaction_id
    `);

    console.log(`Ditemukan ${transactions.length} detail transaksi.`);

    for (const row of transactions) {
      console.log("Memproses Transaksi ID:", row.transaction_id);

      const date = new Date(row.transaction_date);
      const dateStr = date.toISOString().split('T')[0];
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
      const isWeekend = [0, 6].includes(date.getDay());

      await dwConnection.query(`
        INSERT INTO dim_time (date, year, quarter, month, day, day_name, is_weekend)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          year = VALUES(year),
          quarter = VALUES(quarter),
          month = VALUES(month),
          day = VALUES(day),
          day_name = VALUES(day_name),
          is_weekend = VALUES(is_weekend)
      `, [dateStr, year, Math.ceil(month / 3), month, day, dayName, isWeekend]);

      const [timeRes] = await dwConnection.query('SELECT time_key FROM dim_time WHERE date = ?', [dateStr]);
      if (!timeRes || timeRes.length === 0) {
        console.error('Tidak ditemukan time_key untuk tanggal:', dateStr);
        continue;
      }
      const timeKey = timeRes[0].time_key;

      const [product] = await oltpConnection.query('SELECT name, category, price FROM products WHERE product_id = ?', [row.product_id]);
      if (!product || product.length === 0) {
        console.error('Produk tidak ditemukan untuk product_id:', row.product_id);
        continue;
      }

      await dwConnection.query(`
        INSERT INTO dim_product (product_name, category, price)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          product_name = VALUES(product_name),
          category = VALUES(category),
          price = VALUES(price)
      `, [product[0].name, product[0].category, product[0].price]);

      const [prodRes] = await dwConnection.query('SELECT product_key FROM dim_product WHERE product_name = ? AND category = ?', [product[0].name, product[0].category]);
      if (!prodRes || prodRes.length === 0) {
        console.error('Tidak ditemukan product_key untuk produk:', product[0].name);
        continue;
      }
      const productKey = prodRes[0].product_key;

      const [customer] = await oltpConnection.query('SELECT name, email, phone, address FROM customers WHERE customer_id = ?', [row.customer_id]);
      if (!customer || customer.length === 0) {
        console.error('Pelanggan tidak ditemukan untuk customer_id:', row.customer_id);
        continue;
      }

      await dwConnection.query(`
        INSERT INTO dim_customer (customer_name, email, phone, address)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          customer_name = VALUES(customer_name),
          email = VALUES(email),
          phone = VALUES(phone),
          address = VALUES(address)
      `, [customer[0].name, customer[0].email, customer[0].phone, customer[0].address]);

      const [custRes] = await dwConnection.query('SELECT customer_key FROM dim_customer WHERE customer_name = ?', [customer[0].name]);
      if (!custRes || custRes.length === 0) {
        console.error('Tidak ditemukan customer_key untuk pelanggan:', customer[0].name);
        continue;
      }
      const customerKey = custRes[0].customer_key;

      let employeeKey = null;
      if (row.employee_id) {
        const [employee] = await oltpConnection.query('SELECT name, position, store_location FROM employees WHERE employee_id = ?', [row.employee_id]);
        if (!employee || employee.length === 0) {
          console.error('Karyawan tidak ditemukan untuk employee_id:', row.employee_id);
        } else {
          await dwConnection.query(`
            INSERT INTO dim_employee (employee_name, position, store_location)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
              employee_name = VALUES(employee_name),
              position = VALUES(position),
              store_location = VALUES(store_location)
          `, [employee[0].name, employee[0].position, employee[0].store_location]);

          const [empRes] = await dwConnection.query('SELECT employee_key FROM dim_employee WHERE employee_name = ?', [employee[0].name]);
          if (empRes && empRes.length > 0) {
            employeeKey = empRes[0].employee_key;
          }
        }
      }

      await dwConnection.query(`
        INSERT INTO fact_sales (time_key, product_key, customer_key, employee_key, quantity_sold, total_revenue, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [timeKey, productKey, customerKey, employeeKey, row.quantity, row.subtotal, row.payment_method]);
    }

    console.log('ETL selesai. Semua data telah dimuat ke Data Warehouse.');
  } catch (err) {
    console.error('Error dalam proses ETL:', err.message);
  } finally {
    await oltpConnection.end();
    await dwConnection.end();
  }
}

runETL();