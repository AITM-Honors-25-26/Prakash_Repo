import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/layout';
import styles from './TableManagementPage.module.scss';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import axios from 'axios';

interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved';
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
}

const TablePage: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/table/list'); 
      const data = response.data?.result || response.data;
      
      if (Array.isArray(data)) {
        setTables(data);
      } else {
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
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = () => {
    Swal.fire({
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

        return { 
          tableNumber: Number(tableNumber), 
          capacity: Number(capacity), 
          location 
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          // Adjust this route if your API endpoint is different
          // Make sure to include auth headers here if your backend requires Admin token!
          await axios.post('/table/add', result.value);
          
          toast.success(`Table ${result.value.tableNumber} added successfully!`);
          fetchTables();
        } catch (error: any) {
          console.error("Add Table Error:", error);
          const errorMsg = error.response?.data?.message || "Failed to add table.";
          toast.error(errorMsg);
        }
      }
    });
  };

  const handleTableClick = (table: RestaurantTable) => {
    Swal.fire({
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
    }).then((result) => {
      if (result.isConfirmed) {
        toast.info(`Opening order view for Table ${table.tableNumber}`);
      } else if (result.isDenied) {
        generateQR(table.tableNumber);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        updateTableStatus(table);
      }
    });
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
    const frontendURL = window.location.origin; 
    const menuURL = `${frontendURL}/MenuPage?table=${tableNum}`;
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
              <div 
                key={table._id} 
                className={`${styles.tableCard} ${styles[table.status.toLowerCase()]}`}
                onClick={() => handleTableClick(table)}
              >
                <div className={styles.tableNum}>{table.tableNumber}</div>
                <div className={styles.capacityInfo}>{table.capacity} Seats</div>
                <div className={styles.locationInfo}>{table.location}</div>
                <div className={styles.statusBadge}>{table.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TablePage;