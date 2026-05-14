import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Layout from '../../components/layout/layout';
import styles from './TableManagementPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS } from '../../constants/constants';

const MySwal = withReactContent(Swal);

export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable';
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
}

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const fetchTables = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
      const data = response.data?.data || response.data?.result || response.data;
      if (Array.isArray(data)) {
        setTables(data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load floor plan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAdmin(userData.role === 'Admin');
      } catch (e) {
        console.error("Parsing Error", e);
      }
    }
    fetchTables();
    const interval = setInterval(() => {
      fetchTables(false); // Passing 'false' prevents the annoying full-screen loading spinner from popping up
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const handleAddTable = async () => {
    const { value: formValues } = await MySwal.fire({
      title: 'Add New Table Details',
      background: '#faf7f2',
      color: '#2d1b18',
      html: `
        <input id="swal-number" type="number" class="swal2-input" placeholder="Table Number">
        <input id="swal-capacity" type="number" class="swal2-input" placeholder="Capacity (Guests)">
        <select id="swal-location" class="swal2-input">
          <option value="Indoor">Indoor</option>
          <option value="Outdoor">Outdoor</option>
          <option value="Window">Window</option>
          <option value="Balcony">Balcony</option>
        </select>
        <select id="swal-status" class="swal2-input">
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Reserved">Reserved</option>
          <option value="NotAvailable">Not Available</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Create Table',
      confirmButtonColor: '#d84315',
      cancelButtonColor: '#2d1b18',
      preConfirm: () => {
        const tableNumber = (document.getElementById('swal-number') as HTMLInputElement).value;
        const capacity = (document.getElementById('swal-capacity') as HTMLInputElement).value;
        if (!tableNumber || !capacity) {
          Swal.showValidationMessage('Table Number and Capacity are required');
          return false;
        }
        return {
          tableNumber: Number(tableNumber),
          capacity: Number(capacity),
          location: (document.getElementById('swal-location') as HTMLSelectElement).value,
          status: (document.getElementById('swal-status') as HTMLSelectElement).value,
        };
      }
    });

    if (formValues) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(API_ENDPOINTS.ADDTABLE, formValues, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success(`Table ${formValues.tableNumber} added successfully!`);
        await fetchTables(false);
      } catch {
        toast.error("Failed to add new table.");
      }
    }
  };

  const handleEditTable = async (table: RestaurantTable) => {
    const { value: formValues } = await MySwal.fire({
      title: `Edit Table ${table.tableNumber} Details`,
      background: '#faf7f2',
      color: '#2d1b18',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <label style="text-align: left; font-size: 0.85rem; margin-bottom: -5px; padding-left: 15px; font-weight: bold;">Table Number</label>
          <input id="swal-number" type="number" class="swal2-input" placeholder="Table Number" value="${table.tableNumber}" style="margin-top: 0;">
          
          <label style="text-align: left; font-size: 0.85rem; margin-bottom: -5px; padding-left: 15px; font-weight: bold;">Capacity</label>
          <input id="swal-capacity" type="number" class="swal2-input" placeholder="Capacity (Guests)" value="${table.capacity}" style="margin-top: 0;">
          
          <label style="text-align: left; font-size: 0.85rem; margin-bottom: -5px; padding-left: 15px; font-weight: bold;">Location</label>
          <select id="swal-location" class="swal2-input" style="margin-top: 0;">
            <option value="Indoor" ${table.location === 'Indoor' ? 'selected' : ''}>Indoor</option>
            <option value="Outdoor" ${table.location === 'Outdoor' ? 'selected' : ''}>Outdoor</option>
            <option value="Window" ${table.location === 'Window' ? 'selected' : ''}>Window</option>
            <option value="Balcony" ${table.location === 'Balcony' ? 'selected' : ''}>Balcony</option>
          </select>
          
          <label style="text-align: left; font-size: 0.85rem; margin-bottom: -5px; padding-left: 15px; font-weight: bold;">Status</label>
          <select id="swal-status" class="swal2-input" style="margin-top: 0;">
            <option value="Available" ${table.status === 'Available' ? 'selected' : ''}>Available</option>
            <option value="Occupied" ${table.status === 'Occupied' ? 'selected' : ''}>Occupied</option>
            <option value="Reserved" ${table.status === 'Reserved' ? 'selected' : ''}>Reserved</option>
            <option value="NotAvailable" ${table.status === 'NotAvailable' ? 'selected' : ''}>Not Available</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update Table',
      confirmButtonColor: '#d84315',
      cancelButtonColor: '#2d1b18',
      preConfirm: () => {
        const tableNumber = (document.getElementById('swal-number') as HTMLInputElement).value;
        const capacity = (document.getElementById('swal-capacity') as HTMLInputElement).value;
        
        if (!tableNumber || !capacity) {
          Swal.showValidationMessage('Table Number and Capacity are required');
          return false;
        }
        return {
          tableNumber: Number(tableNumber),
          capacity: Number(capacity),
          location: (document.getElementById('swal-location') as HTMLSelectElement).value,
          status: (document.getElementById('swal-status') as HTMLSelectElement).value,
        };
      }
    });

    if (formValues) {
      try {
        const token = localStorage.getItem('token');
        
        await axios.put(`${API_ENDPOINTS.UPDATETABLE}/${table._id}`, formValues, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Strict types matching mapping layout structure
        const updatedTableData: RestaurantTable = {
          ...table,
          tableNumber: formValues.tableNumber,
          capacity: formValues.capacity,
          location: formValues.location as 'Indoor' | 'Outdoor' | 'Window' | 'Balcony',
          status: formValues.status as 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable'
        };

        // Strict casting lookup modifications
        setTables((prevTables) => {
          return prevTables.map((t) => {
            const isIdMatch = String(t._id) === String(table._id);
            const isNumMatch = Number(t.tableNumber) === Number(table.tableNumber);
            return (isIdMatch || isNumMatch) ? updatedTableData : t;
          });
        });
        
        toast.success(`Table ${formValues.tableNumber} updated successfully!`);

        // Async background fallback hook to completely eliminate memory desyncs
        setTimeout(() => {
          fetchTables(false);
        }, 300);

      } catch (error) {
        console.error("Update Error:", error);
        toast.error("Failed to update table details.");
      }
    }
  };

  const handleDeleteTable = async (id: string) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const userData = JSON.parse(storedUser);
    const userEmail = userData.email;

    const { value: password } = await MySwal.fire({
      title: 'Security Verification',
      text: `Enter password for ${userEmail} to delete table`,
      input: 'password',
      showCancelButton: true,
      confirmButtonColor: '#d84315',
    });
    if (password) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_ENDPOINTS.DELETETABLE}/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: { password: password, email: userEmail }
        });
        toast.success("Table removed.");
        setTables((prevTables) => prevTables.filter((t) => t._id !== id));
      } catch {
        toast.error("Delete failed.");
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading..." />
          <h1>Loading Floor Plan...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <header className={styles.pageHeader}>
          <div className={styles.title}>
            <h1>Dining Area Management</h1>
            <p>Total Tables: <strong>{tables.length}</strong></p>
          </div>
          {isAdmin && (
            <button className={styles.addButton} onClick={handleAddTable}>
              <span>+</span> Add Table
            </button>
          )}
        </header>
        <div className={styles.grid}>
          {tables.length > 0 ? (
            tables.map((table) => {
              const statusClass = table.status.toLowerCase();
              const appliedCardStyle = styles[statusClass] || '';
              
              return (
                <div key={table._id} className={`${styles.profileCard} ${appliedCardStyle}`}>
                  <div className={styles.imageSection}>
                    <div className={styles.iconWrapper}>
                       <span className={styles.tableNumberLarge}>{table.tableNumber}</span>
                    </div>
                    <h2 className={styles.userName}>Table {table.tableNumber}</h2>
                    <p className={styles.statusText}>{table.status}</p>
                  </div>
                  <div className={styles.infoSection}>
                    <h3>Table Details</h3>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Capacity:</span>
                      <span className={styles.value}>{table.capacity} Guests</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Location:</span>
                      <span className={styles.value}>{table.location}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Status:</span>
                      <span className={styles.value}>{table.status}</span>
                    </div>
                    
                    <div className={styles.buttonGroup}>
                      <button 
                        className={styles.editButton} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditTable(table);
                        }}
                      >
                        Manage
                      </button>
                      {isAdmin && (
                        <button 
                          className={styles.deleteButton} 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteTable(table._id);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.errorContainer}>
              <h2>No tables found.</h2>
              <p>Add some tables in the database to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TableManagement;