import membershipSvc from "./membership.service.js";
import settingsSvc from "../settings/settings.service.js";

class MembershipController {

    requestOtp = async (req, res, next) => {
        try {
            const result = await membershipSvc.requestOtp(req.body);
            res.json({
                data: result,
                message: result.message,
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    verifyOtp = async (req, res, next) => {
        try {
            const member = await membershipSvc.verifyOtp(req.body);
            res.json({
                data: member,
                message: "Membership verified successfully. Your discount is now active.",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    // Public lookup - lets checkout apply an already-verified member's discount
    // without forcing them to re-enter a code every single visit.
    lookup = async (req, res, next) => {
        try {
            const member = await membershipSvc.lookupVerifiedMember(req.query);
            if (!member) {
                return res.status(404).json({
                    data: null,
                    message: "No verified membership found for that contact.",
                    meta: null
                });
            }
            res.json({
                data: membershipSvc.getMemberProfile(member),
                message: "Membership found",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    // Staff (Admin / Reception) - full membership directory.
    list = async (req, res, next) => {
        try {
            const members = await membershipSvc.listMembers();
            const settings = await settingsSvc.getBillingSettings();

            res.json({
                data: members.map((member) => {
                    member._tierSettings = settings.membershipTiers;
                    return membershipSvc.getMemberProfile(member);
                }),
                message: "Memberships fetched successfully",
                meta: { count: members.length }
            });
        } catch (exception) {
            next(exception);
        }
    }

    update = async (req, res, next) => {
        try {
            const updated = await membershipSvc.updateMember(req.params.id, req.body);
            res.json({
                data: membershipSvc.getMemberProfile(updated),
                message: "Membership updated successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }

    remove = async (req, res, next) => {
        try {
            await membershipSvc.deleteMember(req.params.id);
            res.json({
                data: null,
                message: "Membership removed",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }
}

const membershipCtrl = new MembershipController();
export default membershipCtrl;
