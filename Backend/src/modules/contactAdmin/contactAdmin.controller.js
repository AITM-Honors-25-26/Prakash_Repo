import emailSvc from '../../services/email.service.js';

const submitContactMessage = async (req, res, next) => {
    try {
        const { email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({ error: "Email and message are required." });
        }
        const adminEmail = process.env.SMTP_USER || "admin@example.com";

        const emailSubject = `New Contact Form Inquiry from ${email}`;

        const emailHtml = `
            <h2>New Message for Melina's Bakery</h2>
            <p><strong>From:</strong> ${email}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
        `;

        await emailSvc.sendEmail({
            to: adminEmail,
            sub: emailSubject,
            message: emailHtml
        });

        res.status(200).json({
            success: true,
            message: "Thank you! Your message has been sent."
        });

    } catch (error) {
        console.error("Controller Error:", error);

        res.status(500).json({
            error: "Failed to send the message. Please try again later.",
            details: error.message
        });
    }
};

export const contactAdminCtrl = {
    submitContactMessage
};