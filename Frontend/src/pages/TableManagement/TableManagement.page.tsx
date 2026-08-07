import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';

import Layout from '../../components/layout/layout.js';
import styles from './TableManagementPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS } from '../../constants/constants.js';
import { generateTableQR } from './qr-generator.ts';
import empty from '../../../img/gif/empty.gif';

import TableFormModal from '../../components/TableModel/TableFormModal.tsx';
import type { TableFormValues } from '../../components/TableModel/TableFormModal.tsx';
import PasswordConfirmModal from '../../components/PasswordConfirmation/PasswordConfirmModal.tsx';

const MySwal = withReactContent(Swal);

export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable';
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
  paymentStatus: 'Unpaid' | 'Pending' | 'Paid' | 'Failed';
  outstandingAmount: number;
  activeOrdersCount: number;
}

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const navigate = useNavigate();

  // Add/Edit table modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Delete confirmation modal state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('qr_accessToken');
    localStorage.removeItem('qr_refreshToken');
    localStorage.removeItem('qr_user');
    toast.error('Session expired. Please log in again.');
    navigate('/LoginPage');
  }, [navigate]);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('qr_accessToken');
    if (!token) {
      handleSessionExpired();
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }, [handleSessionExpired]);

  const fetchTables = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
      const data = response.data?.data || response.data?.result || response.data;
      if (Array.isArray(data)) setTables(data);
    } catch (error: unknown) {
      console.error('Fetch Error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error('Failed to load floor plan.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    const storedUser = localStorage.getItem('qr_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAdmin(userData.role === 'Admin');
        setIsStaff(userData.role === 'Admin' || userData.role === 'Waiter');
        setUserEmail(userData.email || '');
      } catch (e) {
        console.error('User Parse Error', e);
      }
    }
    fetchTables();
    const interval = setInterval(() => fetchTables(false), 5000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const handleViewQR = async (table: RestaurantTable) => {
    try {
      const qrImage = await generateTableQR(String(table.tableNumber));

      MySwal.fire({
        title: `Table ${table.tableNumber} QR Code`,
        imageUrl: qrImage,
        imageAlt: `QR Code for Table ${table.tableNumber}`,
        confirmButtonText: 'Download PNG',
        confirmButtonColor: '#d84315',
        showCancelButton: true,
        cancelButtonText: 'Close',
        background: '#faf7f2',
      }).then((result) => {
        if (result.isConfirmed) {
          const link = document.createElement('a');
          link.href = qrImage;
          link.download = `Table-${table.tableNumber}-QR.png`;
          link.click();
          toast.success('Downloading QR Code...');
        }
      });
    } catch {
      toast.error('Could not generate QR code');
    }
  };

  // ----- Add / Edit table -----

  const openAddModal = () => {
    setFormMode('add');
    setEditingTable(null);
    setIsFormOpen(true);
  };

  const openEditModal = (table: RestaurantTable) => {
    setFormMode('edit');
    setEditingTable(table);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    if (isFormSubmitting) return;
    setIsFormOpen(false);
    setEditingTable(null);
  };

  const handleFormSubmit = async (values: TableFormValues, password?: string) => {
    const config = getAuthHeader();
    if (!config) return;

    setIsFormSubmitting(true);
    try {
      if (formMode === 'add') {
        await axios.post(API_ENDPOINTS.ADDTABLE, { ...values, password, email: userEmail }, config);
        toast.success(`Table ${values.tableNumber} added successfully!`);
        fetchTables(false);
      } else if (editingTable) {
        await axios.put(`${API_ENDPOINTS.UPDATETABLE}/${editingTable._id}`, values, config);
        setTables((prev) => prev.map((t) => (t._id === editingTable._id ? { ...t, ...values } : t)));
        toast.success('Table updated successfully!');
      }
      setIsFormOpen(false);
      setEditingTable(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // ----- Delete table -----

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const cancelDelete = () => {
    if (isDeleteSubmitting) return;
    setPendingDeleteId(null);
  };

  const confirmDelete = async (password: string) => {
    if (!pendingDeleteId) return;
    const config = getAuthHeader();
    if (!config) return;

    setIsDeleteSubmitting(true);
    try {
      await axios.delete(`${API_ENDPOINTS.DELETETABLE}/${pendingDeleteId}`, {
        ...config,
        data: { password, email: userEmail },
      });
      toast.success('Table removed.');
      setTables((prev) => prev.filter((t) => t._id !== pendingDeleteId));
      setPendingDeleteId(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Deletion failed. Check your password and try again.');
      } else {
        toast.error('Deletion failed.');
      }
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // ----- Billing / Release -----
  // Lets staff see and control the payment state of each table: settle the
  // bill (counter payment) and only then release the table for new guests.

  const handleSettleTable = async (table: RestaurantTable) => {
    const config = getAuthHeader();
    if (!config) return;

    const result = await MySwal.fire({
      title: `Settle Table ${table.tableNumber}?`,
      text: 'Mark every unpaid order at this table as paid (counter payment).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark Paid',
      confirmButtonColor: '#218838',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    try {
      const response = await axios.put(
        `${API_ENDPOINTS.TABLE_BASE}/${table.tableNumber}/settle`,
        {},
        config
      );
      toast.success(response.data?.message || `Table ${table.tableNumber} bill settled.`);
      fetchTables(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to settle the bill.');
      } else {
        toast.error('Failed to settle the bill.');
      }
    }
  };

  const handleMarkAvailable = async (table: RestaurantTable) => {
    const config = getAuthHeader();
    if (!config) return;

    const result = await MySwal.fire({
      title: `Make Table ${table.tableNumber} Available?`,
      text: 'The table will be released for the next customer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Release Table',
      confirmButtonColor: '#d84315',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    try {
      const response = await axios.put(
        `${API_ENDPOINTS.TABLE_BASE}/${table.tableNumber}/mark-available`,
        {},
        config
      );
      toast.success(response.data?.message || `Table ${table.tableNumber} is now available.`);
      fetchTables(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await MySwal.fire({
          title: 'Bill Not Settled',
          text: error.response?.data?.message || 'This table still has an outstanding bill. Please settle it first.',
          icon: 'error',
          confirmButtonColor: '#d84315',
        });
      } else if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to release the table.');
      } else {
        toast.error('Failed to release the table.');
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading..." />
          <h1>Synchronizing Floor Plan...</h1>
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
            <p>
              Active Layout: <strong>{tables.length} Tables</strong>
            </p>
          </div>
          {isAdmin && (
            <button className={styles.addButton} onClick={openAddModal}>
              <span>+</span> Add Table
            </button>
          )}
        </header>

        <div className={styles.grid}>
          {tables.length > 0 ? (
            tables.map((table) => (
              <div key={table._id} className={`${styles.profileCard} ${styles[table.status.toLowerCase()] || ''}`}>
                <div className={styles.imageSection}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.tableNumberLarge}>{table.tableNumber}</span>
                  </div>
                  <h2 className={styles.userName}>Table {table.tableNumber}</h2>
                  <p className={styles.statusText}>{table.status}</p>
                  {table.status === 'Occupied' && (
                    <div
                      className={`${styles.paymentBadge} ${
                        table.paymentStatus === 'Paid'
                          ? styles.paymentPaid
                          : table.paymentStatus === 'Pending'
                            ? styles.paymentPending
                            : table.paymentStatus === 'Failed'
                              ? styles.paymentFailed
                              : styles.paymentUnpaid
                      }`}
                    >
                      {table.paymentStatus === 'Paid'
                        ? '✓ Bill Paid'
                        : table.paymentStatus === 'Pending'
                          ? '⏳ Awaiting Payment'
                          : table.paymentStatus === 'Failed'
                            ? `Payment Failed · Rs. ${(table.outstandingAmount || 0).toLocaleString()}`
                            : `Unpaid · Rs. ${(table.outstandingAmount || 0).toLocaleString()}`}
                    </div>
                  )}
                </div>
                <div className={styles.infoSection}>
                  <h3>Configuration</h3>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Capacity:</span>
                    <span className={styles.value}>{table.capacity} Guests</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Location:</span>
                    <span className={styles.value}>{table.location}</span>
                  </div>
                  <div className={styles.buttonGroup}>
                    <button className={styles.editButton} onClick={() => openEditModal(table)}>
                      Manage
                    </button>

                    <button className={styles.qrButton} onClick={() => handleViewQR(table)}>
                      QR Code
                    </button>

                    {isStaff && table.status === 'Occupied' && table.paymentStatus !== 'Paid' && (
                      <button className={styles.settleButton} onClick={() => handleSettleTable(table)}>
                        Settle Bill
                      </button>
                    )}

                    {isStaff && table.status === 'Occupied' && (
                      <button className={styles.releaseButton} onClick={() => handleMarkAvailable(table)}>
                        Make Available
                      </button>
                    )}

                    {isAdmin && (
                      <button className={styles.deleteButton} onClick={() => requestDelete(table._id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.errorContainer}>
              <img src={empty} alt="" />
              <h2>No floor plan data available.</h2>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <TableFormModal
          key={editingTable?._id ?? 'new'}
          mode={formMode}
          initialValues={
            editingTable
              ? {
                  tableNumber: editingTable.tableNumber,
                  capacity: editingTable.capacity,
                  location: editingTable.location,
                  status: editingTable.status,
                }
              : undefined
          }
          requirePassword={formMode === 'add'}
          userEmail={userEmail}
          isSubmitting={isFormSubmitting}
          onClose={closeFormModal}
          onSubmit={handleFormSubmit}
        />
      )}

      {pendingDeleteId && (
        <PasswordConfirmModal
          key={pendingDeleteId}
          title="Security Verification"
          message={`Confirm your password${userEmail ? ` for ${userEmail}` : ''} to delete this table.`}
          isSubmitting={isDeleteSubmitting}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}
    </Layout>
  );
};

export default TableManagement;
