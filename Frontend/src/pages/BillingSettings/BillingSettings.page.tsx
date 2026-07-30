import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';

import Layout from '../../components/layout/layout.js';
import styles from './BillingSettingsPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS } from '../../constants/constants.js';

const MySwal = withReactContent(Swal);

interface DiscountRule {
  _id?: string;
  code: string;
  label: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrderAmount: number;
  isActive: boolean;
  expiresAt: string | null;
}

interface BillingSettingsData {
  taxRate: number;
  serviceChargeRate: number;
  discounts: DiscountRule[];
}

const EMPTY_DISCOUNT: DiscountRule = {
  code: '',
  label: '',
  type: 'PERCENTAGE',
  value: 0,
  minOrderAmount: 0,
  isActive: true,
  expiresAt: null,
};

const BillingSettings: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [taxRate, setTaxRate] = useState<number>(0);
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(0);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);

  const [isDiscountFormOpen, setIsDiscountFormOpen] = useState(false);
  const [discountForm, setDiscountForm] = useState<DiscountRule>(EMPTY_DISCOUNT);

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
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [handleSessionExpired]);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Public endpoint - no auth header needed to read current rates.
      const response = await axios.get(API_ENDPOINTS.BILLING_SETTINGS);
      const data: BillingSettingsData = response.data?.data;
      if (data) {
        setTaxRate(data.taxRate ?? 0);
        setServiceChargeRate(data.serviceChargeRate ?? 0);
        setDiscounts(Array.isArray(data.discounts) ? data.discounts : []);
      }
    } catch (error) {
      console.error('Fetch billing settings error:', error);
      toast.error('Failed to load billing settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('qr_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAdmin(userData.role === 'Admin');
      } catch (e) {
        console.error('User parse error', e);
      }
    }
    fetchSettings();
  }, [fetchSettings]);

  const persistSettings = async (nextDiscounts: DiscountRule[], nextTaxRate = taxRate, nextServiceChargeRate = serviceChargeRate) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return false;

    setIsSaving(true);
    try {
      await axios.put(
        API_ENDPOINTS.BILLING_SETTINGS,
        {
          taxRate: nextTaxRate,
          serviceChargeRate: nextServiceChargeRate,
          discounts: nextDiscounts,
        },
        authHeader
      );
      return true;
    } catch (error) {
      console.error('Save billing settings error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleSessionExpired();
      } else if (axios.isAxiosError(error) && error.response?.data?.error) {
        const errors = error.response.data.error as Record<string, string>;
        Object.values(errors).forEach((msg) => toast.error(msg));
      } else {
        toast.error('Failed to save billing settings.');
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await persistSettings(discounts, taxRate, serviceChargeRate);
    if (ok) toast.success('Tax and service charge rates updated.');
  };

  const openAddDiscount = () => {
    setDiscountForm(EMPTY_DISCOUNT);
    setIsDiscountFormOpen(true);
  };

  const openEditDiscount = (rule: DiscountRule) => {
    setDiscountForm({
      ...rule,
      expiresAt: rule.expiresAt ? new Date(rule.expiresAt).toISOString().split('T')[0] : null,
    });
    setIsDiscountFormOpen(true);
  };

  const closeDiscountForm = () => {
    setIsDiscountFormOpen(false);
    setDiscountForm(EMPTY_DISCOUNT);
  };

  const handleDiscountFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setDiscountForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'value' || name === 'minOrderAmount'
            ? Number(value)
            : value,
    }));
  };

  const handleDiscountFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedCode = discountForm.code.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error('Discount code is required.');
      return;
    }

    const isEditing = Boolean(discountForm._id);
    const duplicate = discounts.some(
      (d) => d.code === normalizedCode && d._id !== discountForm._id
    );
    if (duplicate) {
      toast.error('A discount with this code already exists.');
      return;
    }

    const nextRule: DiscountRule = { ...discountForm, code: normalizedCode };
    const nextDiscounts = isEditing
      ? discounts.map((d) => (d._id === discountForm._id ? nextRule : d))
      : [...discounts, nextRule];

    const ok = await persistSettings(nextDiscounts);
    if (ok) {
      setDiscounts(nextDiscounts);
      toast.success(isEditing ? 'Discount updated.' : 'Discount added.');
      closeDiscountForm();
      fetchSettings();
    }
  };

  const handleToggleDiscount = async (rule: DiscountRule) => {
    const nextDiscounts = discounts.map((d) =>
      d._id === rule._id ? { ...d, isActive: !d.isActive } : d
    );
    const ok = await persistSettings(nextDiscounts);
    if (ok) {
      setDiscounts(nextDiscounts);
      toast.success(`${rule.code} is now ${!rule.isActive ? 'active' : 'inactive'}.`);
    }
  };

  const handleDeleteDiscount = async (rule: DiscountRule) => {
    const result = await MySwal.fire({
      title: `Remove discount "${rule.code}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel',
      background: '#faf7f2',
    });
    if (!result.isConfirmed) return;

    const nextDiscounts = discounts.filter((d) => d._id !== rule._id);
    const ok = await persistSettings(nextDiscounts);
    if (ok) {
      setDiscounts(nextDiscounts);
      toast.success('Discount removed.');
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className={styles.pageContainer}>
          <div className={styles.errorContainer}>
            <h2>Access Denied</h2>
            <p>Only administrators can configure tax and discount settings.</p>
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
          <h1>Loading billing settings...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.title}>
            <h1>Tax &amp; Discount Configuration</h1>
            <p>Set the tax rate, service charge, and manage promo/discount codes.</p>
          </div>
        </div>

        <section className={styles.ratesCard}>
          <h2>Tax &amp; Service Charge</h2>
          <form onSubmit={handleSaveRates} className={styles.ratesForm}>
            <div className={styles.inputGroup}>
              <label>Tax Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Service Charge (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={serviceChargeRate}
                onChange={(e) => setServiceChargeRate(Number(e.target.value))}
                required
              />
            </div>
            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Rates'}
            </button>
          </form>
        </section>

        <section className={styles.discountsCard}>
          <div className={styles.discountsHeader}>
            <h2>Discount Codes</h2>
            <button className={styles.addButton} onClick={openAddDiscount}>
              + Add Discount
            </button>
          </div>

          {discounts.length === 0 ? (
            <p className={styles.emptyMsg}>No discount codes configured yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.discountTable}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min. Order</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((rule) => (
                    <tr key={rule._id || rule.code}>
                      <td className={styles.codeCell}>{rule.code}</td>
                      <td>{rule.label || '-'}</td>
                      <td>{rule.type === 'PERCENTAGE' ? 'Percentage' : 'Flat Amount'}</td>
                      <td>{rule.type === 'PERCENTAGE' ? `${rule.value}%` : `Rs. ${rule.value}`}</td>
                      <td>Rs. {rule.minOrderAmount || 0}</td>
                      <td>{rule.expiresAt ? new Date(rule.expiresAt).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <button
                          className={`${styles.statusToggle} ${rule.isActive ? styles.active : styles.inactive}`}
                          onClick={() => handleToggleDiscount(rule)}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className={styles.actionsCell}>
                        <button className={styles.editButton} onClick={() => openEditDiscount(rule)}>
                          Edit
                        </button>
                        <button className={styles.deleteButton} onClick={() => handleDeleteDiscount(rule)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {isDiscountFormOpen && (
          <div className={styles.modalOverlay} onClick={closeDiscountForm}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <h2>{discountForm._id ? `Edit ${discountForm.code}` : 'Add Discount Code'}</h2>
              <form onSubmit={handleDiscountFormSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Code</label>
                    <input
                      type="text"
                      name="code"
                      value={discountForm.code}
                      onChange={handleDiscountFieldChange}
                      placeholder="e.g. WELCOME10"
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Label (optional)</label>
                    <input
                      type="text"
                      name="label"
                      value={discountForm.label}
                      onChange={handleDiscountFieldChange}
                      placeholder="e.g. New customer offer"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Type</label>
                    <select name="type" value={discountForm.type} onChange={handleDiscountFieldChange}>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount (Rs.)</option>
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Value</label>
                    <input
                      type="number"
                      name="value"
                      min={0}
                      value={discountForm.value}
                      onChange={handleDiscountFieldChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label>Minimum Order Amount (Rs.)</label>
                    <input
                      type="number"
                      name="minOrderAmount"
                      min={0}
                      value={discountForm.minOrderAmount}
                      onChange={handleDiscountFieldChange}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Expires On (optional)</label>
                    <input
                      type="date"
                      name="expiresAt"
                      value={discountForm.expiresAt || ''}
                      onChange={handleDiscountFieldChange}
                    />
                  </div>
                </div>

                <div className={styles.checkboxRow}>
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={discountForm.isActive}
                      onChange={handleDiscountFieldChange}
                    />
                    Active
                  </label>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeDiscountForm}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                    {isSaving ? 'Saving...' : discountForm._id ? 'Save Changes' : 'Add Discount'}
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

export default BillingSettings;
