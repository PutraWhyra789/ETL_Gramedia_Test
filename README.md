# Gramedia ETL

Proyek ETL sederhana dari OLTP (Operational Database) ke DW (Data Warehouse) untuk studi kasus Gramedia.

## Deskripsi

Proyek ini menunjukkan proses Extract, Transform, Load (ETL) dari sistem OLTP ke Data Warehouse menggunakan MySQL. OLTP mencakup transaksi penjualan, produk, pelanggan, dan karyawan. DW menggunakan star schema untuk keperluan analisis data.

## Struktur Folder
├── Data Storage Layer/
│ ├── schema.js # Membuat skema OLTP dan DW
│ └── seed.js # Mengisi data dummy ke OLTP
├── Diagram/
│ ├── DimensionalModelling.png
│ └── OLTP.png
├── ETL Layer/
│ └── etl.js # Proses ETL ke DW
├── node_modules/
├── package-lock.json
├── package.json
└── README.md

## Skema OLTP

### Tabel
- `products`
- `customers`
- `employees`
- `transactions`
- `transaction_details`
- `sales`

### Relasi
![Alt text]('Diagram\OLTP.png')

## Skema DW (Star Schema)
![Alt text]('Diagram\DimensionalModelling.png')

### Dimensi
- `dim_time`
- `dim_product`
- `dim_customer`
- `dim_employee`

### Fakta
- `fact_sales`

## Prasyarat

- XAMPP (MySQL)
- Node.js
- npm

## Instalasi

1. Clone repo ini:
    ```bash
    git clone <URL_REPO>
    cd <NAMA_REPO>

2. Install dependensi:
    npm install

3. Nyalakan Apache & MySQL di XAMPP.

4. Jalankan ETL:
    npm run dev