import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/layout';
import styles from './TableManagementPage.module.scss';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
  currentOrder?: string;
}

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Tables from Backend
  const fetchTables = async () => {
    setLoading(true);
    try {
      const mockTables: RestaurantTable[] = [
        { _id: '1', tableNumber: 1, capacity: 2, status: 'Available' },
        { _id: '2', tableNumber: 2, capacity: 4, status: 'Occupied' },
        { _id: '3', tableNumber: 3, capacity: 6, status: 'Reserved' },
        { _id: '4', tableNumber: 4, capacity: 4, status: 'Cleaning' },
      ];
      setTables(mockTables);
    } catch (error: unknown) {
      console.error("Table Fetch Error:", error); 
      toast.error("Failed to load floor plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleTableClick = (table: RestaurantTable) => {
    Swal.fire({
      title: `Table ${table.tableNumber}`,
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Status:</strong> ${table.status}</p>
          <p><strong>Capacity:</strong> ${table.capacity} Persons</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'View Order',
      cancelButtonText: 'Update Status',
      confirmButtonColor: '#d84315',
      cancelButtonColor: '#2d1b18',
      background: '#faf7f2',
      color: '#2d1b18',
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        toast.info("Status update functionality pending backend integration.");
      }
    });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1>Dining Area Overview</h1>
        </div>

        <div className={styles.legend}>
          <span className={styles.available}>Available</span>
          <span className={styles.occupied}>Occupied</span>
          <span className={styles.reserved}>Reserved</span>
          <span className={styles.cleaning}>Cleaning</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <p>Baking your floor plan...</p>
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
                <div className={styles.statusBadge}>{table.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TableManagement;