// Backend/src/modules/contactAdmin/contactAdmin.controller.js

const submitContactMessage = async (req, res, next) => {
    try {
        const { email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({ error: "Email and message are required." });
        }
        console.log(`New message from ${email}: ${message}`);
        res.status(200).json({ 
            success: true, 
            message: "Thank you! Your message has been sent." 
        });

    } catch (error) {
        console.error("Error in submitContactMessage:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

export const contactAdminCtrl = {
    submitContactMessage
};