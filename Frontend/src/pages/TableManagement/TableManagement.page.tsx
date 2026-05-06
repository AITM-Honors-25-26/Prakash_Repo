import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

import Layout from '../../components/layout/layout';
import styles from './TableManagementPage.module.scss';

// --- Types ---
type TableStatus = 'Available' | 'Occupied' | 'Reserved';
type TableLocation = 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';

interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  location: TableLocation;
}

const TablePage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // --- API Handlers ---

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/table/list');
      const tableData = data?.result || data;

      if (Array.isArray(tableData)) {
        setTables(tableData);
      } else {
        // Fallback dummy data if API returns empty/error
        setTables(generateDummyTables());
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load floor plan.");
      setTables(generateDummyTables()); // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // --- Logic Helpers ---

  const generateQR = (tableNum: number) => {
    const menuURL = `${window.location.origin}/MenuPage?table=${tableNum}`;
    const qrImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuURL)}`;

    Swal.fire({
      title: `QR Code: Table ${tableNum}`,
      text: "Scan to view menu and order",
      imageUrl: qrImageURL,
      imageWidth: 250,
      imageHeight: 250,
      confirmButtonText: 'Print QR Code',
      confirmButtonColor: '#d84315',
    }).then((result) => {
      if (result.isConfirmed) window.print();
    });
  };

  const handleUpdateStatus = async (table: RestaurantTable) => {
    const { value: newStatus } = await Swal.fire({
      title: 'Update Table Status',
      input: 'select',
      inputOptions: {
        Available: 'Available',
        Occupied: 'Occupied',
        Reserved: 'Reserved'
      },
      inputValue: table.status,
      showCancelButton: true,
      confirmButtonColor: '#d84315',
    });

    if (newStatus) {
      try {
        await axios.patch(`/table/update/${table._id}`, { status: newStatus });
        toast.success(`Table ${table.tableNumber} is now ${newStatus}`);
        fetchTables();
      } catch (error) {
        toast.error("Failed to update status.");
      }
    }
  };

  const handleAddTable = () => {
    Swal.fire({
      title: 'Add New Table',
      background: '#faf7f2',
      html: `
        <div class="${styles.swalForm}">
          <input type="number" id="swal-table-num" class="swal2-input" placeholder="Table Number">
          <input type="number" id="swal-capacity" class="swal2-input" placeholder="Capacity">
          <select id="swal-location" class="swal2-select">
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Window">Window</option>
            <option value="Balcony">Balcony</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Table',
      confirmButtonColor: '#d84315',
      preConfirm: () => {
        const tableNumber = (document.getElementById('swal-table-num') as HTMLInputElement).value;
        const capacity = (document.getElementById('swal-capacity') as HTMLInputElement).value;
        const location = (document.getElementById('swal-location') as HTMLSelectElement).value;

        if (!tableNumber || !capacity) {
          Swal.showValidationMessage('Table number and capacity are required');
          return false;
        }
        return { tableNumber: Number(tableNumber), capacity: Number(capacity), location };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post('/table/add', result.value);
          toast.success(`Table ${result.value.tableNumber} added!`);
          fetchTables();
        } catch (error) {
          toast.error("Failed to add table.");
        }
      }
    });
  };

  const handleTableClick = (table: RestaurantTable) => {
    Swal.fire({
      title: `Table ${table.tableNumber}`,
      html: `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>Status:</strong> ${table.status}</p>
          <p><strong>Capacity:</strong> ${table.capacity} Seats</p>
          <p><strong>Location:</strong> ${table.location}</p>
        </div>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'View Order',
      denyButtonText: 'Generate QR',
      cancelButtonText: 'Edit Status',
      confirmButtonColor: '#d84315',
      denyButtonColor: '#2d1b18',
    }).then((result) => {
      if (result.isConfirmed) toast.info("Redirecting to orders...");
      else if (result.isDenied) generateQR(table.tableNumber);
      else if (result.dismiss === Swal.DismissReason.cancel) handleUpdateStatus(table);
    });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.headerSection}>
          <div className={styles.headerTop}>
            <h1>Dining Area Overview</h1>
            <button className={styles.addButton} onClick={handleAddTable}>
              + Add Table
            </button>
          </div>
          <p>Real-time floor plan management</p>
        </header>

        <nav className={styles.legend}>
          {(['Available', 'Occupied', 'Reserved'] as TableStatus[]).map(status => (
            <div key={status} className={styles.legendItem}>
              <span className={styles[status.toLowerCase()]}></span> {status}
            </div>
          ))}
        </nav>

        {loading ? (
          <div className={styles.loadingState}><h3>Loading floor plan...</h3></div>
        ) : (
          <main className={styles.grid}>
            {tables.map((table) => (
              <TableCard 
                key={table._id} 
                table={table} 
                onClick={() => handleTableClick(table)} 
              />
            ))}
          </main>
        )}
      </div>
    </Layout>
  );
};

// --- Sub-Components ---

const TableCard: React.FC<{ table: RestaurantTable; onClick: () => void }> = ({ table, onClick }) => (
  <div 
    className={`${styles.tableCard} ${styles[table.status.toLowerCase()]}`}
    onClick={onClick}
  >
    <div className={styles.tableNum}>{table.tableNumber}</div>
    <div className={styles.capacityInfo}>{table.capacity} Seats</div>
    <div className={styles.locationInfo}>{table.location}</div>
    <div className={styles.statusBadge}>{table.status}</div>
  </div>
);

// --- Utilities ---

function generateDummyTables(): RestaurantTable[] {
  return Array.from({ length: 12 }, (_, i) => ({
    _id: `dummy-${i}`,
    tableNumber: i + 1,
    capacity: (i % 3 === 0) ? 6 : 4,
    status: i % 5 === 0 ? 'Occupied' : 'Available',
    location: i > 8 ? 'Outdoor' : 'Indoor'
  }));
}

export default TablePage;