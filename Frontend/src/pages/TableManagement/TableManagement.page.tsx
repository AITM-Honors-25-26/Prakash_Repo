import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/layout';
import styles from './TableManagementPage.module.scss';
import { toast } from 'react-toastify';
import Swal, { SweetAlertResult } from 'sweetalert2';
import axios, { AxiosError } from 'axios';

// --- Types ---
export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved';
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
}

interface TableCardProps {
  table: RestaurantTable;
  onClick: (table: RestaurantTable) => void;
}

// --- Sub-components ---
const TableCard: React.FC<TableCardProps> = ({ table, onClick }) => (
  <div 
    className={`${styles.tableCard} ${styles[table.status.toLowerCase()]}`}
    onClick={() => onClick(table)}
  >
    <div className={styles.tableNum}>{table.tableNumber}</div>
    <div className={styles.capacityInfo}>{table.capacity} Seats</div>
    <div className={styles.locationInfo}>{table.location}</div>
    <div className={styles.statusBadge}>{table.status}</div>
  </div>
);

// --- Main Component ---
const TablePage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/table/list'); 
      const data = response.data?.result || response.data;
      
      if (Array.isArray(data)) {
        setTables(data);
      } else {
        // Fallback dummy data generation
        const generatedTables: RestaurantTable[] = Array.from({ length: 12 }, (_, i) => ({
          _id: `dummy-${i + 1}`,
          tableNumber: i + 1,
          capacity: (i + 1) % 4 === 0 ? 6 : (i + 1) % 2 === 0 ? 4 : 2,
          status: i === 2 || i === 7 ? 'Occupied' : i === 5 ? 'Reserved' : 'Available',
          location: i > 8 ? 'Outdoor' : 'Indoor'
        }));
        setTables(generatedTables);
      }
    } catch (error: unknown) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load floor plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleAddTable = async () => {
    const result: SweetAlertResult = await Swal.fire({
      title: 'Add New Table',
      background: '#faf7f2',
      color: '#2d1b18',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
          <input type="number" id="swal-table-num" class="swal2-input" placeholder="Table Number (e.g. 15)" style="margin: 0; width: auto;">
          <input type="number" id="swal-capacity" class="swal2-input" placeholder="Capacity (e.g. 4)" style="margin: 0; width: auto;">
          <select id="swal-location" class="swal2-select" style="margin: 0; width: auto;">
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Window">Window</option>
            <option value="Balcony">Balcony</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Table',
      confirmButtonColor: '#d84315',
      cancelButtonColor: '#78909c',
      preConfirm: () => {
        const tableNumber = (document.getElementById('swal-table-num') as HTMLInputElement).value;
        const capacity = (document.getElementById('swal-capacity') as HTMLInputElement).value;
        const location = (document.getElementById('swal-location') as HTMLSelectElement).value;

        if (!tableNumber || !capacity) {
          Swal.showValidationMessage('Please enter both Table Number and Capacity');
          return false;
        }

        return { tableNumber: Number(tableNumber), capacity: Number(capacity), location };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        await axios.post('/table/add', result.value);
        toast.success(`Table ${result.value.tableNumber} added successfully!`);
        fetchTables();
      } catch (error: unknown) {
        console.error("Add Table Error:", error);
        const axiosError = error as AxiosError<{ message: string }>;
        const errorMsg = axiosError.response?.data?.message || "Failed to add table.";
        toast.error(errorMsg);
      }
    }
  };

  const handleTableClick = async (table: RestaurantTable) => {
    const result = await Swal.fire({
      title: `Table ${table.tableNumber} Management`,
      background: '#faf7f2',
      color: '#2d1b18',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Status:</strong> ${table.status}</p>
          <p><strong>Capacity:</strong> ${table.capacity} Persons</p>
          <p><strong>Location:</strong> ${table.location}</p>
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'View Order',
      denyButtonText: 'Generate QR',
      cancelButtonText: 'Update Status',
      confirmButtonColor: '#d84315',
      denyButtonColor: '#2d1b18',
      cancelButtonColor: '#78909c',
    });

    if (result.isConfirmed) {
      toast.info(`Opening order view for Table ${table.tableNumber}`);
    } else if (result.isDenied) {
      generateQR(table.tableNumber);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      updateTableStatus(table);
    }
  };

  const updateTableStatus = async (table: RestaurantTable) => {
    const { value: newStatus } = await Swal.fire({
      title: 'Update Table Status',
      input: 'select',
      inputOptions: {
        'Available': 'Available',
        'Occupied': 'Occupied',
        'Reserved': 'Reserved'
      },
      inputValue: table.status,
      showCancelButton: true,
      confirmButtonColor: '#d84315',
    });

    if (newStatus) {
      try {
        // NOTE: You probably want an axios call here to save to DB! 
        // Example: await axios.patch(`/table/${table._id}/status`, { status: newStatus });
        console.log(`Updating Table ${table.tableNumber} to ${newStatus}`);
        toast.success(`Table ${table.tableNumber} set to ${newStatus}`);
        fetchTables(); 
      } catch (error: unknown) {
        console.error("Status Update Error:", error); 
        toast.error("Failed to update status.");
      }
    }
  };

  const generateQR = (tableNum: number) => {
    const menuURL = `${window.location.origin}/MenuPage?table=${tableNum}`;
    const qrImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuURL)}`;

    Swal.fire({
      title: `QR Code: Table ${tableNum}`,
      text: "Scan to view menu and order",
      imageUrl: qrImageURL,
      imageWidth: 250,
      imageHeight: 250,
      imageAlt: 'Table QR Code',
      confirmButtonText: 'Print QR Code',
      confirmButtonColor: '#d84315',
      background: '#faf7f2',
      color: '#2d1b18',
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
      }
    });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.headerTop}>
            <h1>Dining Area Overview</h1>
            <button className={styles.addButton} onClick={handleAddTable}>
              + Add Table
            </button>
          </div>
          <p>Real-time floor plan management</p>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}><span className={styles.available}></span> Available</div>
          <div className={styles.legendItem}><span className={styles.occupied}></span> Occupied</div>
          <div className={styles.legendItem}><span className={styles.reserved}></span> Reserved</div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <h1>Loading tables...</h1>
          </div>
        ) : (
          <div className={styles.grid}>
            {tables.map((table) => (
              <TableCard key={table._id} table={table} onClick={handleTableClick} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TablePage;