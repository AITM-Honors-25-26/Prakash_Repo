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
  dob: string | null;
  gender: string | null;
  address: string | null;
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

  // Optional name typed on the enrollment panel - submitted together with the
  // OTP so the member's profile is complete from the very first visit.
  const [name, setName] = useState('');

  // Post-registration "set up my details" editing. Every change is confirmed
  // with a fresh one-time code sent to the member's own contact, so it works
  // without a customer login (the OTP is the proof of ownership).
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ fullName: '', dob: '', gender: '', address: '' });
  const [editCodeSent, setEditCodeSent] = useState(false);
  const [editOtp, setEditOtp] = useState('');
  const [editDevOtp, setEditDevOtp] = useState<string | null>(null);
  const [sendingEditCode, setSendingEditCode] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

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
      // In dev, the backend returns the code so testing works without email/WhatsApp.
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
        // Optional name captured on the enrollment panel.
        ...(name.trim() ? { fullName: name.trim() } : {}),
      });
      const verifiedMember: MemberProfile = data.data;
      setMember(verifiedMember);
      setShowOtp(false);
      setOtp('');
      setName('');
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
    setName('');
    setDevOtp(null);
    setEditing(false);
    setEditCodeSent(false);
    setEditOtp('');
    setEditDevOtp(null);
    setIdentifier('');
    notifyChange(null, null);
  };

  const contactLabel = (c: MembershipContact): string => c.phone || c.email || 'your contact';

  // "Edit details" - pre-fill the form from the verified profile. Changes are
  // not saved until the member confirms with a fresh OTP (see saveDetails).
  const startEdit = () => {
    setDraft({
      fullName: member?.fullName || '',
      dob: member?.dob || '',
      gender: member?.gender || '',
      address: member?.address || '',
    });
    setEditOtp('');
    setEditDevOtp(null);
    setEditCodeSent(false);
    setEditing(true);
  };

  const sendEditCode = async () => {
    if (!contact) return;
    setSendingEditCode(true);
    try {
      const { data } = await axios.post(API_ENDPOINTS.MEMBERSHIP_OTP_REQUEST, contact);
      setOtpSentTo(data.data?.sentTo || contactLabel(contact));
      if (data.data?.devOtp) {
        setEditDevOtp(data.data.devOtp);
        toast.info(`Dev code: ${data.data.devOtp}`);
      } else {
        toast.success(`A one-time code has been sent to ${data.data?.sentTo || contactLabel(contact)}.`);
      }
      setEditCodeSent(true);
    } catch (error: unknown) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Could not send code.' : 'Could not send code.');
    } finally {
      setSendingEditCode(false);
    }
  };

  const saveDetails = async () => {
    if (!contact || !editCodeSent) return;
    if (!editOtp.trim()) {
      toast.error('Enter the 6-digit code you received.');
      return;
    }
    setSavingDetails(true);
    try {
      const { data } = await axios.post(API_ENDPOINTS.MEMBERSHIP_OTP_VERIFY, {
        ...contact,
        otp: editOtp.trim(),
        fullName: draft.fullName.trim(),
        dob: draft.dob || null,
        gender: draft.gender || null,
        address: draft.address.trim(),
      });
      const updated: MemberProfile = data.data;
      setMember(updated);
      notifyChange(updated, contact);
      setEditing(false);
      setEditOtp('');
      setEditDevOtp(null);
      setEditCodeSent(false);
      toast.success('Your details have been saved.');
    } catch (error: unknown) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || 'Could not save details.' : 'Could not save details.');
    } finally {
      setSavingDetails(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditOtp('');
    setEditDevOtp(null);
    setEditCodeSent(false);
  };

  return (
    <div className={styles.membershipBox}>
      {member ? (
        editing ? (
          <div className={styles.memberCard}>
            <div className={styles.memberHeader}>
              <span className={styles.memberBadge}>✎ Update your details</span>
              <button type="button" className={styles.removeBtn} onClick={cancelEdit} aria-label="Cancel editing">
                ✕
              </button>
            </div>
            <div className={styles.detailsForm}>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel} htmlFor="mm-fullName">Your name</label>
                <input
                  id="mm-fullName"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Sita Sharma"
                  value={draft.fullName}
                  onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                  className={styles.fieldInput}
                />
              </div>
              <div className={styles.fieldGrid}>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldLabel} htmlFor="mm-dob">Date of birth</label>
                  <input
                    id="mm-dob"
                    type="date"
                    value={draft.dob}
                    onChange={(e) => setDraft((d) => ({ ...d, dob: e.target.value }))}
                    className={styles.fieldInput}
                  />
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.fieldLabel} htmlFor="mm-gender">Gender</label>
                  <select
                    id="mm-gender"
                    value={draft.gender}
                    onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value }))}
                    className={styles.fieldInput}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel} htmlFor="mm-address">Address</label>
                <input
                  id="mm-address"
                  type="text"
                  maxLength={200}
                  placeholder="Optional"
                  value={draft.address}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  className={styles.fieldInput}
                />
              </div>

              {!editCodeSent ? (
                <button type="button" className={styles.verifyBtn} onClick={sendEditCode} disabled={sendingEditCode}>
                  {sendingEditCode ? 'Sending...' : 'Send code to confirm'}
                </button>
              ) : (
                <>
                  <p className={styles.editHint}>
                    A one-time code has been sent to <strong>{otpSentTo}</strong> - enter it to save your details.
                  </p>
                  <div className={styles.otpRow}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={editOtp}
                      onChange={(e) => setEditOtp(e.target.value.replace(/\D/g, ''))}
                      className={styles.otpInput}
                    />
                    <button type="button" className={styles.verifyBtn} onClick={saveDetails} disabled={savingDetails}>
                      {savingDetails ? 'Saving...' : 'Save details'}
                    </button>
                  </div>
                  {editDevOtp && <p className={styles.devHint}>Dev code shown above (email/WhatsApp delivery happens in production).</p>}
                  <div className={styles.enrollFooter}>
                    <button type="button" className={styles.resendBtn} onClick={sendEditCode} disabled={sendingEditCode}>
                      Resend code
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.memberCard}>
            <div className={styles.memberHeader}>
              <span className={styles.memberBadge}>✓ Membership Active</span>
              <button type="button" className={styles.removeBtn} onClick={removeMembership} aria-label="Remove membership">
                ✕
              </button>
            </div>
            <div className={styles.memberInfo}>
              {member.fullName && <p className={styles.memberName}>{member.fullName}</p>}
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
              <button type="button" className={styles.editBtn} onClick={startEdit}>
                ✎ Edit details
              </button>
            </div>
          </div>
        )
      ) : showOtp ? (
        <div className={styles.enrollPanel}>
          <p className={styles.enrollHint}>
            This contact isn't a member yet. A one-time code has been sent to <strong>{otpSentTo}</strong> - enter it to
            join and start saving.
          </p>
          <input
            type="text"
            maxLength={100}
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.nameInput}
          />
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
          {devOtp && <p className={styles.devHint}>Dev code shown above (email/WhatsApp delivery happens in production).</p>}
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

