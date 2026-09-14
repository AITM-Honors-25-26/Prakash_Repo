import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/layout';
import styles from './MembershipPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS } from '../../constants/constants';
import MembershipApply from '../../components/Membership/MembershipApply';
import type { MemberProfile } from '../../components/Membership/MembershipApply';

const MySwal = withReactContent(Swal);

interface MembershipTierConfig {
  _id?: string;
  name: string;
  minVisits: number;
  discountPercent: number;
  maxDiscountAmount: number;
}

interface BillingSettingsData {
  membershipEnabled: boolean;
  membershipTiers: MembershipTierConfig[];
  taxRate: number;
  serviceChargeRate: number;
}

interface StaffMemberRow extends MemberProfile {
  fullName: string;
}

const formatAmount = (value: unknown) => Number(value) || 0;

const getStoredRole = () => {
  const storedUser = localStorage.getItem('qr_user');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser).role || null;
  } catch (error) {
    console.error('User parse error', error);
    return null;
  }
};

const MembershipPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BillingSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [role] = useState(getStoredRole);
  const isStaff = role === 'Admin' || role === 'Reception';
  const isAdmin = role === 'Admin';
  const [members, setMembers] = useState<StaffMemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

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

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.BILLING_SETTINGS)
      .then(({ data }) => {
        if (data?.data) setSettings(data.data);
      })
      .catch(() => toast.error('Could not load membership benefits.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isStaff) return;
    const loadMembers = async () => {
      const config = getAuthHeader();
      if (!config) return;

      setMembersLoading(true);
      try {
        const { data } = await axios.get(API_ENDPOINTS.MEMBERSHIP_LIST, config);
        const list = Array.isArray(data?.data) ? data.data : [];
        setMembers(list.map((m: MemberProfile) => ({ ...m, fullName: m.fullName || '' })));
      } catch {
        toast.error('Could not load membership directory.');
      } finally {
        setMembersLoading(false);
      }
    };

    void loadMembers();
  }, [getAuthHeader, isStaff]);

  const handleMemberChange = (member: MemberProfile | null) => {
    if (!member || !isStaff) return;
    setMembers((prev) => {
      const exists = prev.some((m) => m._id === member._id);
      if (exists) return prev.map((m) => (m._id === member._id ? { ...m, ...member } : m));
      return [{ ...member, fullName: member.fullName || '' }, ...prev];
    });
  };

  const handleDelete = async (member: StaffMemberRow) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    const label = member.fullName || member.phone || member.email || 'this member';
    const result = await MySwal.fire({
      title: `Remove ${label}?`,
      text: 'This permanently deletes the membership and its discount record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel',
      background: '#faf7f2',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_ENDPOINTS.MEMBERSHIP_ACTION}/${member._id}`, authHeader);
      setMembers((prev) => prev.filter((m) => m._id !== member._id));
      toast.success('Membership removed.');
    } catch (error) {
      console.error('Delete member error:', error);
      toast.error('Failed to remove membership. Only admins can delete members.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading..." />
          <h1>Loading Membership...</h1>
        </div>
      </Layout>
    );
  }

  const tiers = settings?.membershipTiers || [];

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <header className={styles.pageHeader}>
          <h1>Loyalty Membership</h1>
          <p>Join once, save on every visit. Verify your phone or email with a one-time code.</p>
        </header>

        {settings && settings.membershipEnabled === false && (
          <div className={styles.disabledBanner}>
            The membership program is currently paused. Please check back soon.
          </div>
        )}

        <div className={styles.contentGrid}>
          <section className={styles.benefitsCard}>
            <h2>How it works</h2>
            <ul className={styles.benefitList}>
              <li><strong>1.</strong> Enter your phone or email below.</li>
              <li><strong>2.</strong> Verify it once with a 6-digit code sent to you.</li>
              <li><strong>3.</strong> Type the same phone/email at checkout and your discount is applied automatically.</li>
              <li><strong>4.</strong> The more you visit, the higher your tier - and the bigger the discount.</li>
            </ul>

            <h2 className={styles.tiersTitle}>Reward Tiers</h2>
            <div className={styles.tierTable}>
              <div className={styles.tierHead}>
                <span>Tier</span>
                <span>Visits</span>
                <span>Discount</span>
                <span>Max per bill</span>
              </div>
              {tiers.length === 0 && <p className={styles.noTiers}>No tiers configured yet.</p>}
              {tiers.map((tier) => (
                <div key={tier._id || tier.name} className={styles.tierRow}>
                  <span className={styles.tierName}>{tier.name}</span>
                  <span>{tier.minVisits}+</span>
                  <span>{tier.discountPercent}%</span>
                  <span>Rs. {formatAmount(tier.maxDiscountAmount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.enrollCard}>
            <h2>Enroll or apply your membership</h2>
            <MembershipApply onMemberChange={handleMemberChange} />
          </section>
        </div>

        {isStaff && (
          <section className={styles.directoryCard}>
            <h2>Membership Directory</h2>
            {membersLoading ? (
              <p className={styles.noTiers}>Loading members...</p>
            ) : members.length === 0 ? (
              <p className={styles.noTiers}>No members yet. Customers enroll by verifying their phone/email.</p>
            ) : (
              <div className={`${styles.directoryTable}${isAdmin ? ` ${styles.withActions}` : ''}`}>
                <div className={styles.directoryHead}>
                  <span>Contact</span>
                  <span>Visits</span>
                  <span>Total Spent</span>
                  <span>Tier</span>
                  {isAdmin && <span>Actions</span>}
                </div>
                {members.map((member) => (
                  <div key={member._id} className={styles.directoryRow}>
                    <span>{member.phone || member.email || member.fullName || '—'}</span>
                    <span>{member.visitCount}</span>
                    <span>Rs. {formatAmount(member.totalSpent).toLocaleString()}</span>
                    <span className={styles.tierName}>{member.tier ? member.tier.name : '—'}</span>
                    {isAdmin && (
                      <span>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(member)}
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
};

export default MembershipPage;
