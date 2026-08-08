import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../../constants/constants';
import styles from './MembershipApply.module.scss';

export interface MembershipTier {
  name: string;
  minVisits: number;
  discountPercent: number;
  maxDiscountAmount: number;
}

export interface MemberProfile {
  _id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
  status: string;
  visitCount: number;
  totalSpent: number;
  tier: MembershipTier | null;
}

export interface MembershipContact {
  phone?: string;
  email?: string;
}

interface MembershipApplyProps {
  onMemberChange?: (member: MemberProfile | null, contact: MembershipContact | null) => void;
}

const detectContact = (value: string): MembershipContact | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes('@')) {
    return { email: trimmed };
  }
  return { phone: trimmed.replace(/\D/g, '') };
};

// Enrolls a customer into the loyalty program (phone/email + one-time OTP) and
// remembers their verified membership so checkout can apply their tier
// discount automatically. Reused on the Checkout page and Membership page.
const MembershipApply: React.FC<MembershipApplyProps> = ({ onMemberChange }) => {
  const [identifier, setIdentifier] = useState('');
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [contact, setContact] = useState<MembershipContact | null>(null);

  // Enrollment OTP flow
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState('');

  const notifyChange = (nextMember: MemberProfile | null, nextContact: MembershipContact | null) => {
    onMemberChange?.(nextMember, nextContact);
  };

  const applyMembership = async () => {
    const nextContact = detectContact(identifier);
    if (!nextContact) {
      toast.error('Enter your phone number or email address.');
      return;
    }

    setLoading(true);
    try {
      // Existing verified member? No OTP needed - discount applies directly.
      const response = await axios.get(API_ENDPOINTS.MEMBERSHIP_LOOKUP, { params: nextContact });
      const found: MemberProfile | null = response.data?.data || null;

      if (found) {
        setMember(found);
        setContact(nextContact);
        setShowOtp(false);
        setOtp('');
        setDevOtp(null);
        notifyChange(found, nextContact);
        toast.success(`Welcome back, ${found.tier ? found.tier.name : 'member'}! Discount applied.`);
      } else {
        throw new Error('NOT_FOUND');
      }
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;

      if (status === 404) {
        // Not a member yet - offer OTP enrollment.
        setContact(nextContact);
        setShowOtp(true);
        setOtp('');
        setDevOtp(null);
        await sendOtp(nextContact);
      } else {
        toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Lookup failed.' : 'Lookup failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (target: MembershipContact = contact || {}) => {
    setLoading(true);
    try {
      const { data } = await axios.post(API_ENDPOINTS.MEMBERSHIP_OTP_REQUEST, target);
      setOtpSentTo(data.data?.sentTo || 'your contact');
      // In dev, the backend returns the code so testing works without email/SMS.
      if (data.data?.devOtp) {
        setDevOtp(data.data.devOtp);
        toast.info(`Dev code: ${data.data.devOtp}`);
      } else {
        toast.success(`A one-time code has been sent to ${data.data?.sentTo || 'your contact'}.`);
      }
    } catch (error: unknown) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Could not send code.' : 'Could not send code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast.error('Enter the 6-digit code you received.');
      return;
    }
    setVerifying(true);
    try {
      const { data } = await axios.post(API_ENDPOINTS.MEMBERSHIP_OTP_VERIFY, {
        ...contact,
        otp: otp.trim(),
      });
      const verifiedMember: MemberProfile = data.data;
      setMember(verifiedMember);
      setShowOtp(false);
      setOtp('');
      setDevOtp(null);
      notifyChange(verifiedMember, contact);
      toast.success('Membership verified! Your discount is now active.');
    } catch (error: unknown) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Verification failed.' : 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const removeMembership = () => {
    setMember(null);
    setContact(null);
    setShowOtp(false);
    setOtp('');
    setDevOtp(null);
    setIdentifier('');
    notifyChange(null, null);
  };

  return (
    <div className={styles.membershipBox}>
      {member ? (
        <div className={styles.memberCard}>
          <div className={styles.memberHeader}>
            <span className={styles.memberBadge}>✓ Membership Active</span>
            <button type="button" className={styles.removeBtn} onClick={removeMembership} aria-label="Remove membership">
              ✕
            </button>
          </div>
          <div className={styles.memberInfo}>
            <p className={styles.memberTier}>
              {member.tier ? `${member.tier.name} Member` : 'Member'}
            </p>
            <p className={styles.memberMeta}>
              {member.visitCount} visit{member.visitCount === 1 ? '' : 's'} ·{' '}
              {member.phone || member.email || ''}
            </p>
            {member.tier && (
              <p className={styles.memberDiscount}>
                {member.tier.discountPercent}% off up to Rs. {member.tier.maxDiscountAmount.toLocaleString()} per bill
              </p>
            )}
          </div>
        </div>
      ) : showOtp ? (
        <div className={styles.enrollPanel}>
          <p className={styles.enrollHint}>
            This contact isn't a member yet. A one-time code has been sent to <strong>{otpSentTo}</strong> - enter it to
            join and start saving.
          </p>
          <div className={styles.otpRow}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className={styles.otpInput}
            />
            <button type="button" className={styles.verifyBtn} onClick={verifyOtp} disabled={verifying}>
              {verifying ? 'Verifying...' : 'Verify & Join'}
            </button>
          </div>
          {devOtp && <p className={styles.devHint}>Dev code shown above (email/SMS delivery happens in production).</p>}
          <div className={styles.enrollFooter}>
            <button type="button" className={styles.resendBtn} onClick={() => sendOtp()} disabled={loading}>
              Resend code
            </button>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowOtp(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.applyRow}>
          <input
            type="text"
            placeholder="Phone number or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={styles.contactInput}
          />
          <button type="button" className={styles.applyBtn} onClick={applyMembership} disabled={loading}>
            {loading ? 'Checking...' : 'Get Discount'}
          </button>
        </div>
      )}
      {!member && !showOtp && (
        <p className={styles.subtleHint}>
          Loyalty members earn automatic discounts on every visit - verified once via a one-time code.
        </p>
      )}
    </div>
  );
};

export default MembershipApply;

