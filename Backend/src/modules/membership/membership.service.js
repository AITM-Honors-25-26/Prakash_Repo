import crypto from "crypto";
import MembershipModel from "./membership.model.js";
import settingsSvc from "../settings/settings.service.js";
import emailQueue from "../../queues/email.queue.js";
import { EMAIL_JOBS } from "../../queues/email.worker.js";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;           // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;   // 1 minute
const OTP_MAX_ATTEMPTS = 5;

const isProduction = () => process.env.NODE_ENV === "production";

// Keeps a phone number as digits only so the same member can't accidentally be
// created twice as "9800000000" vs "+977-98-0000-0000".
const normalizePhone = (value) => String(value || "").replace(/\D/g, "").slice(-15);

const maskPhone = (phone) => {
    const digits = normalizePhone(phone);
    if (digits.length < 4) return "••••";
    return `${digits.slice(0, 2)}••••${digits.slice(-2)}`;
};

const maskEmail = (email) => {
    const [local, domain] = String(email || "").split("@");
    if (!domain) return "••••@••••";
    const head = local.slice(0, 2);
    return `${head}•••@${domain}`;
};

const hashOtp = (otp) =>
    crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtp = () =>
    String(crypto.randomInt(0, 1000000)).padStart(OTP_LENGTH, "0");

class MembershipService {

    // Finds an existing member by phone or email. Exactly one of the two must
    // be provided. Returns null when no member is registered with it yet.
    findMemberByContact = async ({ phone, email }) => {
        try {
            const normalizedPhone = phone ? normalizePhone(phone) : null;
            const normalizedEmail = email ? String(email).toLowerCase().trim() : null;

            if (!normalizedPhone && !normalizedEmail) return null;

            let member = normalizedPhone
                ? await MembershipModel.findOne({ phone: normalizedPhone })
                : await MembershipModel.findOne({ email: normalizedEmail });

            // Fallback for members registered with a raw (un-normalized) phone.
            if (!member && normalizedPhone) {
                member = await MembershipModel.findOne({ phone: String(phone).trim() });
            }
            return member;
        } catch (exception) {
            throw exception;
        }
    }

    // Public profile returned to the frontend, with the tier the member
    // currently qualifies for.
    getMemberProfile = (member) => {
        if (!member) return null;
        const tier = settingsSvc.getMembershipTier(member.visitCount, {
            membershipTiers: member._tierSettings
        });

        return {
            _id: member._id,
            fullName: member.fullName || "",
            phone: member.phone ? maskPhone(member.phone) : null,
            email: member.email ? maskEmail(member.email) : null,
            isVerified: Boolean(member.isVerified),
            status: member.status,
            visitCount: member.visitCount || 0,
            totalSpent: member.totalSpent || 0,
            tier: tier ? {
                name: tier.name,
                minVisits: tier.minVisits,
                discountPercent: tier.discountPercent,
                maxDiscountAmount: tier.maxDiscountAmount
            } : null
        };
    }

    // Looks up a verified, active member by phone or email. Used by checkout
    // (preview + order creation) to decide whether to apply a tier discount.
    lookupVerifiedMember = async ({ phone, email }) => {
        try {
            if (!phone && !email) return null;
            const member = await this.findMemberByContact({ phone, email });
            if (!member || !member.isVerified || member.status !== "Active") return null;

            // Attach the tier table so getMemberProfile can compute the tier
            // without an extra DB read.
            const settings = await settingsSvc.getBillingSettings();
            member._tierSettings = settings.membershipTiers;
            return member;
        } catch (exception) {
            throw exception;
        }
    }

    // Sends a one-time OTP to the supplied email or phone so the customer can
    // prove they own that contact. New contacts get a member row created
    // (unverified until the OTP is confirmed).
    requestOtp = async ({ phone, email }) => {
        try {
            const normalizedPhone = phone ? normalizePhone(phone) : null;
            const normalizedEmail = email ? String(email).toLowerCase().trim() : null;

            if (!normalizedPhone && !normalizedEmail) {
                throw { code: 400, message: "Provide either a phone number or an email address.", status: "CONTACT_REQUIRED" };
            }
            if (normalizedPhone && normalizedPhone.length < 10) {
                throw { code: 400, message: "Phone number must be at least 10 digits.", status: "INVALID_PHONE" };
            }
            if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                throw { code: 400, message: "Email address is not valid.", status: "INVALID_EMAIL" };
            }

            let member = await this.findMemberByContact({ phone: normalizedPhone, email: normalizedEmail });
            if (!member) {
                member = await new MembershipModel({
                    phone: normalizedPhone || null,
                    email: normalizedEmail || null
                }).save();
            }

            if (member.status !== "Active") {
                throw { code: 403, message: "This membership has been deactivated.", status: "MEMBERSHIP_INACTIVE" };
            }

            // Resend cooldown so a spammer can't burn our email/SMS credits.
            if (member.lastOtpSentAt && (Date.now() - new Date(member.lastOtpSentAt).getTime()) < OTP_RESEND_COOLDOWN_MS) {
                throw { code: 429, message: "Please wait a minute before requesting another code.", status: "OTP_COOLDOWN" };
            }

            const otp = generateOtp();
            member.otpHash = hashOtp(otp);
            member.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
            member.otpAttempts = 0;
            member.lastOtpSentAt = new Date();
            await member.save();

            // Deliver the code: email goes through the existing BullMQ email
            // queue; SMS goes through a clearly-marked dev logger where a real
            // SMS gateway (Twilio etc.) can be plugged in later.
            if (normalizedEmail) {
                await emailQueue.add(EMAIL_JOBS.MEMBERSHIP_OTP, {
                    email: normalizedEmail,
                    otp,
                    fullName: member.fullName || "Valued Guest"
                });
            } else {
                console.log(`[SMS-OTP] Membership OTP for ${maskPhone(normalizedPhone)}: ${otp} (expires in 5 minutes)`);
            }

            return {
                sentTo: normalizedEmail ? maskEmail(normalizedEmail) : maskPhone(normalizedPhone),
                devOtp: isProduction() ? undefined : otp,
                message: `A one-time code has been sent to ${normalizedEmail ? maskEmail(normalizedEmail) : maskPhone(normalizedPhone)}.`
            };
        } catch (exception) {
            throw exception;
        }
    }

    // Confirms the OTP, marking the contact as a verified member. A verified
    // member's discounts become available automatically at checkout.
    verifyOtp = async ({ phone, email, otp }) => {
        try {
            const member = await this.findMemberByContact({ phone, email });
            if (!member) {
                throw { code: 404, message: "No membership found for that contact. Request a code first.", status: "MEMBER_NOT_FOUND" };
            }

            if (!member.otpHash || !member.otpExpiresAt) {
                throw { code: 410, message: "No active code. Request a new one.", status: "OTP_MISSING" };
            }
            if (new Date(member.otpExpiresAt).getTime() < Date.now()) {
                throw { code: 410, message: "That code has expired. Please request a new one.", status: "OTP_EXPIRED" };
            }
            if ((member.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
                throw { code: 429, message: "Too many incorrect attempts. Please request a new code.", status: "OTP_ATTEMPTS_EXCEEDED" };
            }

            if (hashOtp(otp) !== member.otpHash) {
                member.otpAttempts = (member.otpAttempts || 0) + 1;
                await member.save();
                throw { code: 422, message: "Incorrect code. Please try again.", status: "OTP_INVALID" };
            }

            member.isVerified = true;
            member.otpHash = null;
            member.otpExpiresAt = null;
            member.otpAttempts = 0;
            await member.save();

            return this.getMemberProfile(member);
        } catch (exception) {
            throw exception;
        }
    }

    // Called when a member places an order - the sitting counts as one more
    // visit, which drives their tier progression.
    incrementVisit = async (memberId) => {
        if (!memberId) return;
        await MembershipModel.updateOne({ _id: memberId }, { $inc: { visitCount: 1 } });
    }

    // Called when a member's order is actually paid (counter or eSewa) so
    // totalSpent only reflects real money taken.
    recordPayment = async (memberId, amount) => {
        if (!memberId || !amount) return;
        await MembershipModel.updateOne({ _id: memberId }, { $inc: { totalSpent: Number(amount) || 0 } });
    }

    // --- Staff / Reception administration -----------------------------------
    listMembers = async (filter = {}) => {
        try {
            return await MembershipModel.find(filter).sort({ createdAt: -1 });
        } catch (exception) {
            throw exception;
        }
    }

    updateMember = async (id, updateData) => {
        try {
            const allowed = ["fullName", "phone", "email", "status"];
            const patch = {};
            allowed.forEach((field) => {
                if (updateData[field] !== undefined) patch[field] = updateData[field];
            });
            const updated = await MembershipModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
            if (!updated) throw { code: 404, message: "Membership not found.", status: "MEMBER_NOT_FOUND" };
            return updated;
        } catch (exception) {
            throw exception;
        }
    }

    deleteMember = async (id) => {
        try {
            const deleted = await MembershipModel.findByIdAndDelete(id);
            if (!deleted) throw { code: 404, message: "Membership not found.", status: "MEMBER_NOT_FOUND" };
            return deleted;
        } catch (exception) {
            throw exception;
        }
    }
}

const membershipSvc = new MembershipService();
export default membershipSvc;

