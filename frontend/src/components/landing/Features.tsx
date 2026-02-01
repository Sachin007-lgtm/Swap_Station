import { motion } from 'framer-motion';
import { Battery, Sun, Zap, Globe, ArrowUpRight, TrafficCone } from 'lucide-react';
import './Features.css';

const features = [
    {
        icon: <TrafficCone size={32} />,
        category: "INFRASTRUCTURE",
        title: "Intelligent Driver Rerouting",
        description: "Detect congestion early and automatically guide drivers to nearby low-load stations with faster swaps."
    },
    {
        icon: <Sun size={32} />,
        category: "TECHNOLOGY",
        title: "Proactive Maintenance Alerts",
        description: "Identify charger degradation and downtime patterns.Notify maintenance teams instantly—before stations go offline."
    },
    {
        icon: <Zap size={32} />,
        category: "MOBILITY",
        title: "Real-Time Station Intelligence",
        description: "Track swap rates, queue lengths, charger uptime, and battery inventory across cities from one dashboard."
    },
    {
        icon: <Globe size={32} />,
        category: "ECOSYSTEM",
        title: "Action Orchestration via n8n",
        description: "Automates driver notifications and maintenance alerts with reliable execution and centralized workflow control."
    }
];

const Features = () => {
    return (
        <section className="section features-section" id="about">
            <div className="container">
                <div className="section-header">
                    <motion.span
                        className="subtitle-text"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        WHAT WE'RE BUILDING
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Built for Real-World Swap Station Operations
                    </motion.h2>
                    <motion.p
                        className="section-description"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Smart Swap Ops acts as an AI Copilot for battery swap
                        networks—monitoring every station, predicting failures,
                        and triggering actions before customers are impacted.
                    </motion.p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="feature-card"
                            initial={{ opacity: 0, y: 60 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className="card-content">
                                <div className="card-top">
                                    <div className="feature-icon-wrapper">
                                        {feature.icon}
                                    </div>
                                    <span className="feature-category">{feature.category}</span>
                                </div>

                                <div className="card-main">
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>


                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
