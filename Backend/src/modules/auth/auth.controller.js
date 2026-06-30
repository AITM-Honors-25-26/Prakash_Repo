// src/modules/auth/auth.controller.js

import autSvc from "./auth.service.js";
import cloudianarySvc from "../../services/cloudinary.service.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppConfig } from "../../config/constants.js";
import { randomStringGenerator } from "../../utils/helpers.js";
import emailQueue from "../../queues/email.queue.js";
import { EMAIL_JOBS } from "../../queues/email.worker.js";

class AuthController {

    registerUser = async (req, res, next) => {
        let userData;
        try {
            userData = await autSvc.userRegisterDataTrans(req);
            const userObj = await autSvc.userStore(userData);

            await emailQueue.add(EMAIL_JOBS.ACTIVATION, {
                name:            userObj.name,
                email:           userObj.email,
                activationToken: userObj.activationToken,
            });

            res.json({
                data: {
                    user: autSvc.publicUserProfile(userObj),
                },
                message: "User registered successfully",
                status: "REGISTER_SUCCESS",
                option: null,
            });
        } catch (exception) {
            if (userData && userData.image_id) {
                await cloudianarySvc.deleteFile(userData.image_id);
            }
            next(exception);
        }
    }

    activateUser = async (req, res, next) => {
        try {
            let token = req.params.token || null;
            if (!token) {
                throw {
                    code: 422,
                    message: "Activation token is expected",
                    status: "ACTIVATION_TOKEN_MISSING",
                };
            }
            const associatedUser = await autSvc.getSingleUserByFilter({
                activationToken: token,
            });
            if (!associatedUser) {
                throw {
                    code: 422,
                    message: "Token already used or does not exist",
                    status: "ACTIVATION_TOKEN_NOT_FOUND",
                };
            }
            await autSvc.updateSingleUserByFilter({ _id: associatedUser._id }, {
                status: true,
                activationToken: null,
            });
            res.json({
                data: null,
                message: "Thank you for registering. Your account has been successfully activated.",
                status: "ACTIVATION_SUCCESS",
                option: null,
            });
        } catch (exception) {
            next(exception);
        }
    }

    loginUser = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const user = await autSvc.getSingleUserByFilter({ email }, "+password");

            if (!user) {
                throw { code: 422, message: "User does not exist", status: "USER_NOT_FOUND" };
            } else if (!bcrypt.compareSync(password, user.password)) {
                throw { code: 403, message: "Credentials do not match", status: "CREDENTIAL_NOT_MATCHED" };
            } else if (user.status === false) {
                throw { code: 403, message: "Your account is not activated. Please verify your email.", status: "ACCOUNT_NOT_ACTIVATED" };
            } else {
                const accessToken = jwt.sign(
                    { sub: user._id, type: "access" },
                    AppConfig.jwtSecret,
                    { expiresIn: "7d" }
                );
                const refreshToken = jwt.sign(
                    { sub: user._id, type: "refresh" },
                    AppConfig.jwtSecret,
                    { expiresIn: "30d" }
                );
                res.json({
                    data: {
                        accessToken,
                        refreshToken,
                        user: autSvc.publicUserProfile(user),
                    },
                    message: "Login successfully",
                    status: "LOGIN_SUCCESS",
                    option: null,
                });
            }
        } catch (exception) {
            next(exception);
        }
    }

    getMyProfile = async (req, res, next) => {
        res.json({
            data: req.authUser,
            status: "LOGGEDIN_USER",
            message: "Your Profile",
            option: null,
        });
    }

    forgotPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            const user = await autSvc.getSingleUserByFilter({ email });

            if (!user) {
                return next({
                    code: 400,
                    detail: { email: "User email has not been registered yet" },
                    message: "User not found",
                    status: "USER_NOT_FOUND",
                });
            }

            const updateData = {
                forgotPasswordToken: randomStringGenerator(100),
                expireToken: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            };

            await autSvc.updateSingleUserByFilter({ email }, updateData);

            // ✅ Queue forgot password email — non-blocking, auto-retries on failure
            await emailQueue.add(EMAIL_JOBS.FORGOT_PASSWORD, {
                name:       user.fullName || "User",
                email:      user.email,
                resetToken: updateData.forgotPasswordToken,
            });

            res.json({
                data: null,
                message: "A link has been sent to your registered email to reset your password.",
                status: "FORGOT_PASSWORD_LINK_SENT",
                option: null,
            });
        } catch (exception) {
            next(exception);
        }
    }

    verifyForgotPasswordToken = async (req, res, next) => {
        try {
            const token = req.params.token;
            const user = await autSvc.getSingleUserByFilter({ forgotPasswordToken: token });

            if (!user) {
                return next({ code: 422, message: "Token does not exist or is already used", status: "TOKEN_NOT_FOUND" });
            }
            if (!user.expireToken) {
                return next({ code: 400, message: "Token expiry time is missing", status: "INVALID_TOKEN_DATA" });
            }
            if (Date.now() > new Date(user.expireToken).getTime()) {
                return next({ code: 422, message: "Password reset token expired", status: "PASSWORD_RESET_TOKEN_EXPIRED" });
            }

            const verifyToken = randomStringGenerator(100);
            await autSvc.updateSingleUserByFilter({ _id: user._id }, {
                forgotPasswordToken: verifyToken,
                expireToken: new Date(Date.now() + 30 * 60 * 1000),
            });

            res.redirect(`${AppConfig.frontend_Url}/reset-password?token=${verifyToken}`);
        } catch (exception) {
            next(exception);
        }
    }

    resetPassword = async (req, res, next) => {
        try {
            const { token, password } = req.body;
            const user = await autSvc.getSingleUserByFilter({ forgotPasswordToken: token });

            if (!user) {
                return next({ code: 402, message: "Token does not exist or already used", status: "TOKEN_NOT_FOUND" });
            }

            await autSvc.updateSingleUserByFilter({ _id: user._id }, {
                forgotPasswordToken: null,
                expireToken: null,
                password: bcrypt.hashSync(password, 12),
                status: true,
            });

            res.status(201).json({
                data: null,
                message: "Your password has been reset successfully. Please log in to continue.",
                status: "PASSWORD_RESET_SUCCESSFUL",
                option: null,
            });
        } catch (exception) {
            next(exception);
        }
    }
}

const authCtr = new AuthController();
export default authCtr;