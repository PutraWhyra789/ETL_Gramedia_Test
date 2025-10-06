// Data Storage Layer/schema.js
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

async function createSchema() {
  const oltpConnection = await mysql.createConnection({
    host: oltpConfig.host,
    user: oltpConfig.user,
    password: oltpConfig.password,
    port: oltpConfig.port
  });

  const dwConnection = await mysql.createConnection({
    host: dwConfig.host,
    user: dwConfig.user,
    password: dwConfig.password,
    port: dwConfig.port
  });

  await oltpConnection.query(`CREATE DATABASE IF NOT EXISTS ${oltpConfig.database}`);
  await dwConnection.query(`CREATE DATABASE IF NOT EXISTS ${dwConfig.database}`);

  await oltpConnection.changeUser({ database: oltpConfig.database });
  await dwConnection.changeUser({ database: dwConfig.database });

  await oltpConnection.query(`
    CREATE TABLE IF NOT EXISTS products (
      product_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await oltpConnection.query(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(20),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await oltpConnection.query(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(100),
      store_location VARCHAR(100),
      hire_date DATE
    );
  `);

  await oltpConnection.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT,
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      total_amount DECIMAL(10,2),
      payment_method VARCHAR(50),
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );
  `);

  await oltpConnection.query(`
    CREATE TABLE IF NOT EXISTS transaction_details (
      detail_id INT AUTO_INCREMENT PRIMARY KEY,
      transaction_id INT,
      product_id INT,
      quantity INT,
      unit_price DECIMAL(10,2),
      subtotal DECIMAL(10,2),
      FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    );
  `);

  await oltpConnection.query(`
    CREATE TABLE IF NOT EXISTS sales (
      sale_id INT AUTO_INCREMENT PRIMARY KEY,
      transaction_id INT,
      employee_id INT,
      sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
    );
  `);

  await dwConnection.query(`
    CREATE TABLE IF NOT EXISTS dim_time (
      time_key INT AUTO_INCREMENT PRIMARY KEY,
      date DATE UNIQUE,
      year INT,
      quarter INT,
      month INT,
      day INT,
      day_name VARCHAR(10),
      is_weekend BOOLEAN
    );
  `);

  await dwConnection.query(`
    CREATE TABLE IF NOT EXISTS dim_product (
      product_key INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(255),
      category VARCHAR(50),
      price DECIMAL(10,2)
    );
  `);

  await dwConnection.query(`
    CREATE TABLE IF NOT EXISTS dim_customer (
      customer_key INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(20),
      address TEXT
    );
  `);

  await dwConnection.query(`
    CREATE TABLE IF NOT EXISTS dim_employee (
      employee_key INT AUTO_INCREMENT PRIMARY KEY,
      employee_name VARCHAR(255),
      position VARCHAR(100),
      store_location VARCHAR(100)
    );
  `);

  await dwConnection.query(`
    CREATE TABLE IF NOT EXISTS fact_sales (
      sales_key INT AUTO_INCREMENT PRIMARY KEY,
      time_key INT,
      product_key INT,
      customer_key INT,
      employee_key INT,
      quantity_sold INT,
      total_revenue DECIMAL(10,2),
      payment_method VARCHAR(50),
      FOREIGN KEY (time_key) REFERENCES dim_time(time_key),
      FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
      FOREIGN KEY (customer_key) REFERENCES dim_customer(customer_key),
      FOREIGN KEY (employee_key) REFERENCES dim_employee(employee_key)
    );
  `);

  await oltpConnection.end();
  await dwConnection.end();

  console.log("Schema OLTP dan DW berhasil dibuat di MySQL.");
}

createSchema();