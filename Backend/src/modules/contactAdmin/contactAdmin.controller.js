// Backend/src/modules/contactAdmin/contactAdmin.controller.js
import emailSvc from '../../services/email.service'; // Ensure this relative path matches your folder structure

const submitContactMessage = async (req, res, next) => {
    try {
        const { email, message } = req.body;

        // 1. Validation: Ensure both fields are provided
        if (!email || !message) {
            return res.status(400).json({ error: "Email and message are required." });
        }

        // 2. Define the Admin email (Ideally stored in your .env file)
        const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"; 

        // 3. Format the email content
        const emailSubject = `New Contact Form Inquiry from ${email}`;
        
        // Wrapping the text in basic HTML since your service uses `html: message`
        const emailHtml = `
            <h2>New Message for Melina's Bakery</h2>
            <p><strong>From:</strong> ${email}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
        `;

        // 4. Send using your existing EmailService
        await emailSvc.sendEmail({
            to: adminEmail,
            sub: emailSubject,
            message: emailHtml
        });

        // 5. Send a success response back to the React frontend
        res.status(200).json({ 
            success: true, 
            message: "Thank you! Your message has been sent." 
        });

    } catch (error) {
        // Your emailSvc already logs the error, but we catch it here to prevent the server from crashing
        console.error("Controller Error:", error);
        
        res.status(500).json({ 
            error: "Failed to send the message. Please try again later.",
            details: error.message // Optional: only include if you want frontend to see the exact error
        });
    }
};

export const contactAdminCtrl = {
    submitContactMessage
};