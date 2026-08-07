import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';

import Layout from '../../components/layout/layout.js';
import styles from './StaffManagementPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS } from '../../constants/constants.js';

const MySwal = withReactContent(Swal);

const ROLE_OPTIONS = ['Admin', 'Chef', 'Waiter', 'Reception', 'Employee'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  address: string;
  phone: string;
  status: boolean;
  dob: string;
  createdAt: string;
}

interface StaffFormValues {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  role: string;
}

const EMPTY_FORM: StaffFormValues = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  gender: 'Male',
  dob: '',
  role: 'Waiter',
};

const StaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formValues, setFormValues] = useState<StaffFormValues>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      },
    };
  }, [handleSessionExpired]);

  const fetchStaff = useCallback(async () => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    setIsLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.STAFF_LIST, authHeader);
      const data = response.data?.data || response.data?.result || response.data;
      if (Array.isArray(data)) setStaff(data);
    } catch (error: unknown) {
      console.error('Fetch staff error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error('Failed to load staff accounts.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader, handleSessionExpired]);

  useEffect(() => {
    const storedUser = localStorage.getItem('qr_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAdmin(userData.role === 'Admin');
        setCurrentUserId(userData._id || '');
      } catch (e) {
        console.error('User parse error', e);
      }
    }
    fetchStaff();
  }, [fetchStaff]);

  const openAddForm = () => {
    setFormMode('add');
    setEditingStaff(null);
    setFormValues(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (member: StaffMember) => {
    setFormMode('edit');
    setEditingStaff(member);
    setFormValues({
      fullName: member.name,
      email: member.email,
      password: '',
      phone: member.phone || '',
      address: member.address || '',
      gender: 'Male',
      dob: member.dob ? new Date(member.dob).toISOString().split('T')[0] : '',
      role: member.role,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingStaff(null);
    setFormValues(EMPTY_FORM);
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    setIsSubmitting(true);
    try {
      if (formMode === 'add') {
        await axios.post(
          API_ENDPOINTS.STAFF_ACTION,
          {
            fullName: formValues.fullName,
            email: formValues.email,
            password: formValues.password,
            phone: formValues.phone,
            address: formValues.address,
            gender: formValues.gender,
            dob: formValues.dob,
            role: formValues.role,
          },
          authHeader
        );
        toast.success('Staff account created successfully.');
      } else if (editingStaff) {
        await axios.patch(
          `${API_ENDPOINTS.STAFF_ACTION}/${editingStaff._id}`,
          {
            fullName: formValues.fullName,
            phone: formValues.phone,
            address: formValues.address,
            dob: formValues.dob,
            role: formValues.role,
          },
          authHeader
        );
        toast.success('Staff account updated successfully.');
      }
      closeForm();
      fetchStaff();
    } catch (error: unknown) {
      console.error('Staff form submit error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleSessionExpired();
      } else if (axios.isAxiosError(error) && error.response?.data?.error) {
        const errors = error.response.data.error as Record<string, string>;
        Object.values(errors).forEach((msg) => toast.error(msg));
      } else {
        toast.error('Failed to save staff account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (member: StaffMember) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    try {
      await axios.patch(
        `${API_ENDPOINTS.STAFF_ACTION}/${member._id}`,
        { status: !member.status },
        authHeader
      );
      toast.success(`${member.name} is now ${!member.status ? 'active' : 'inactive'}.`);
      fetchStaff();
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Failed to update account status.');
    }
  };

  const handleDelete = async (member: StaffMember) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    if (member._id === currentUserId) {
      toast.error('You cannot delete your own account.');
      return;
    }

    const result = await MySwal.fire({
      title: `Remove ${member.name}?`,
      text: 'This will permanently delete their staff account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel',
      background: '#faf7f2',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_ENDPOINTS.STAFF_ACTION}/${member._id}`, authHeader);
      toast.success('Staff account removed.');
      fetchStaff();
    } catch (error) {
      console.error('Delete staff error:', error);
      toast.error('Failed to remove staff account.');
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <h2>Access Denied</h2>
            <p>Only administrators can manage staff accounts.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading" />
          <h1>Loading staff accounts...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.title}>
            <h1>Staff Account Management</h1>
            <p>Create, edit, and manage staff logins and roles.</p>
          </div>
          <button className={styles.addButton} onClick={openAddForm}>
            + Add Staff
          </button>
        </div>

        {staff.length === 0 ? (
          <div className={styles.errorContainer}>
            <h2>No staff accounts yet</h2>
            <p>Add your first staff account to get started.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.staffTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
               <tbody>
                {staff.map((member) => (
                  <tr key={member._id}>
                    <td data-label="Name">{member.name}</td>
                    <td data-label="Email">{member.email}</td>
                    <td data-label="Role">
                      <span className={styles.roleBadge}>{member.role}</span>
                    </td>
                    <td data-label="Phone">{member.phone}</td>
                    <td data-label="Status">
                      <button
                        className={`${styles.statusToggle} ${member.status ? styles.active : styles.inactive}`}
                        onClick={() => toggleStatus(member)}
                      >
                        {member.status ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className={styles.actionsCell}>
                      <button className={styles.editButton} onClick={() => openEditForm(member)}>
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(member)}
                        disabled={member._id === currentUserId}
                        title={member._id === currentUserId ? "You can't delete your own account" : ''}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
               </tbody>
            </table>
          </div>
        )}

        {isFormOpen && (
          <div className={styles.modalOverlay} onClick={closeForm}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <h2>{formMode === 'add' ? 'Add Staff Account' : `Edit ${editingStaff?.name}`}</h2>
              <form onSubmit={handleFormSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formValues.fullName}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formValues.email}
                      onChange={handleFieldChange}
                      required
                      disabled={formMode === 'edit'}
                    />
                  </div>
                </div>

                {formMode === 'add' && (
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label>Temporary Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formValues.password}
                        onChange={handleFieldChange}
                        required
                        placeholder="Min 8 chars, upper/lower/number/symbol"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Gender</label>
                      <select name="gender" value={formValues.gender} onChange={handleFieldChange} required>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formValues.phone}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formValues.dob}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Role</label>
                    <select name="role" value={formValues.role} onChange={handleFieldChange} required>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formValues.address}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeForm}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : formMode === 'add' ? 'Create Account' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffManagement;
