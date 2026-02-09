import { motion } from 'framer-motion';
import { Shield, Lock, Eye, UserCheck, Database, Bell } from 'lucide-react';
import './PrivacyPolicy.css';

const privacyItems = [
    {
        icon: <Shield size={28} />,
        title: "Data Collection",
        description: "We collect minimal data necessary to provide our services: location for station routing, battery swap history, and account information."
    },
    {
        icon: <Lock size={28} />,
        title: "Data Security",
        description: "Your data is encrypted end-to-end and stored securely. We use industry-standard security protocols to protect your information."
    },
    {
        icon: <Eye size={28} />,
        title: "Data Usage",
        description: "We use your data solely to optimize station operations, improve routing, and enhance your experience. We never sell your personal data."
    },
    {
        icon: <UserCheck size={28} />,
        title: "Your Rights",
        description: "You have full control over your data. Request access, correction, or deletion of your information at any time."
    },
    {
        icon: <Database size={28} />,
        title: "Data Retention",
        description: "We retain your data only as long as necessary to provide services and comply with legal requirements."
    },
    {
        icon: <Bell size={28} />,
        title: "Transparency",
        description: "We'll notify you of any changes to our privacy policy and seek your consent for significant data processing changes."
    }
];

const PrivacyPolicy = () => {
    return (
        <section className="section privacy-section" id="privacy">
            <div className="container">
                <div className="section-header">
                    <motion.span
                        className="subtitle-text"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        YOUR PRIVACY MATTERS
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Privacy & Data Protection
                    </motion.h2>
                    <motion.p
                        className="section-description"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        We're committed to protecting your privacy and handling your data with care.
                        Here's how we keep your information safe and secure.
                    </motion.p>
                </div>

                <div className="privacy-grid">
                    {privacyItems.map((item, index) => (
                        <motion.div
                            key={index}
                            className="privacy-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="privacy-icon">
                                {item.icon}
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="privacy-footer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                >
                    <p>
                        <strong>Last Updated:</strong> February 2026
                    </p>
                    <p>
                        For detailed information, read our{' '}
                        <a href="#" className="privacy-link">full privacy policy</a> or{' '}
                        <a href="#contact" className="privacy-link">contact us</a> with any questions.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default PrivacyPolicy;
