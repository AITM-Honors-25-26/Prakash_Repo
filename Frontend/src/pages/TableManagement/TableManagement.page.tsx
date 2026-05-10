import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/layout';
import styles from './TableManagementPage.module.scss';
import { toast } from 'react-toastify';
import Swal, { SweetAlertResult } from 'sweetalert2';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:9005/api';

// --- Types ---
export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable';
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
  const navigate = useNavigate();

  // 1. AXIOS INTERCEPTOR: Handle expired tokens globally for this page
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.data?.message?.includes("expired")) {
          toast.error("Session expired. Please login again.");
          localStorage.clear();
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

  // 2. FETCH TABLES
  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/table/list`); 
      const data = response.data?.data || response.data?.result || response.data;
      
      if (Array.isArray(data)) {
        setTables(data);
      }
    } catch (error: unknown) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load tables.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // 3. ADD NEW TABLE
  const handleAddTable = async () => {
    const result: SweetAlertResult = await Swal.fire({
      title: 'Add New Table',
      background: '#faf7f2',
      color: '#2d1b18',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
          <input type="number" id="swal-table-num" class="swal2-input" placeholder="Table Number" style="margin: 0; width: auto;">
          <input type="number" id="swal-capacity" class="swal2-input" placeholder="Capacity" style="margin: 0; width: auto;">
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
      preConfirm: () => {
        const tableNumber = (document.getElementById('swal-table-num') as HTMLInputElement).value;
        const capacity = (document.getElementById('swal-capacity') as HTMLInputElement).value;
        const location = (document.getElementById('swal-location') as HTMLSelectElement).value;

        if (!tableNumber || !capacity) {
          Swal.showValidationMessage('Table Number and Capacity are required');
          return false;
        }
        return { tableNumber: Number(tableNumber), capacity: Number(capacity), location };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_BASE_URL}/table/add`, result.value, {
            headers: { Authorization: `Bearer ${token}` } 
        });
        toast.success(`Table ${result.value.tableNumber} added!`);
        fetchTables(); 
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to add table.");
      }
    }
  };

  // 4. MANAGEMENT ACTIONS (Delete / QR / Status)
  const handleTableClick = async (table: RestaurantTable) => {
    const result = await Swal.fire({
      title: `Table ${table.tableNumber}`,
      background: '#faf7f2',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      denyButtonText: 'QR Code',
      cancelButtonText: 'Status',
      confirmButtonColor: '#d32f2f',
      denyButtonColor: '#2d1b18',
      cancelButtonColor: '#78909c',
    });

    if (result.isConfirmed) {
        handleDeleteTable(table._id);
    } else if (result.isDenied) {
      generateQR(table.tableNumber);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      updateTableStatus(table);
    }
  };

  const handleDeleteTable = async (id: string) => {
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_BASE_URL}/table/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          toast.success("Table removed.");
          fetchTables();
      } catch (error: any) {
          toast.error(error.response?.data?.message || "Delete failed.");
      }
  }

  const updateTableStatus = async (table: RestaurantTable) => {
    const { value: newStatus } = await Swal.fire({
      title: 'Set Status',
      input: 'select',
      inputOptions: {
        'Available': 'Available',
        'Occupied': 'Occupied',
        'Reserved': 'Reserved',
        'NotAvailable': 'Not Available'
      },
      inputValue: table.status,
      showCancelButton: true,
    });

    if (newStatus) {
      try {
        const token = localStorage.getItem('token');
        // If your backend has a PATCH route:
        await axios.patch(`${API_BASE_URL}/table/${table._id}`, { status: newStatus }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Status updated.");
        fetchTables(); 
      } catch (error: any) {
        toast.error("Status update failed.");
      }
    }
  };

  const generateQR = (tableNum: number) => {
    const menuURL = `${window.location.origin}/MenuPage?table=${tableNum}`;
    const qrImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(menuURL)}`;

    Swal.fire({
      title: `QR Code: Table ${tableNum}`,
      imageUrl: qrImageURL,
      imageWidth: 250,
      imageHeight: 250,
      confirmButtonColor: '#d84315',
    });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.headerTop}>
            <h1>Dining Area</h1>
            <button className={styles.addButton} onClick={handleAddTable}>+ Add Table</button>
          </div>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}><span className={styles.available}></span> Available</div>
          <div className={styles.legendItem}><span className={styles.occupied}></span> Occupied</div>
          <div className={styles.legendItem}><span className={styles.reserved}></span> Reserved</div>
        </div>

        {loading ? (
          <div className={styles.loadingState}><h1>Loading...</h1></div>
        ) : (
          <div className={styles.grid}>
            {tables.length > 0 ? (
                tables.map((table) => (
                  <TableCard key={table._id} table={table} onClick={handleTableClick} />
                ))
            ) : (
                <p>No tables found.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TablePage;