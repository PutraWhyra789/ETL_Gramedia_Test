# Gramedia ETL

Proyek ETL sederhana dari OLTP (Operational Database) ke DW (Data Warehouse) untuk studi kasus Gramedia.

## Deskripsi

Proyek ini menunjukkan proses Extract, Transform, Load (ETL) dari sistem OLTP ke Data Warehouse menggunakan MySQL. OLTP mencakup transaksi penjualan, produk, pelanggan, dan karyawan. DW menggunakan star schema untuk keperluan analisis data.

## Struktur Folder
├── Data Storage Layer/ <br>
│ ├── schema.js # Membuat skema OLTP dan DW <br>
│ └── seed.js # Mengisi data dummy ke OLTP <br>
├── Diagram/ <br>
│ ├── DimensionalModelling.png <br>
│ └── OLTP.png <br>
├── ETL Layer/ <br>
│ └── etl.js # Proses ETL ke DW <br>
├── node_modules/ <br>
├── package-lock.json <br>
├── package.json <br>
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
![Alt text](https://github.com/PutraWhyra789/ETL_Gramedia_Test/blob/51aa2a30d5dac4ddb48dc65cb662d1155cac58d7/Diagram/OLTP.png?raw=true)

## Skema DW (Star Schema)
![Alt text](https://github.com/PutraWhyra789/ETL_Gramedia_Test/blob/51aa2a30d5dac4ddb48dc65cb662d1155cac58d7/Diagram/DimensionalModelling.png?raw=true)

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
    git clone https://github.com/PutraWhyra789/ETL_Gramedia_Test.git && cd ETL_Gramedia_Test

2. Install dependensi:
    npm install

3. Nyalakan Apache & MySQL di XAMPP.

4. Jalankan ETL:
    npm run dev