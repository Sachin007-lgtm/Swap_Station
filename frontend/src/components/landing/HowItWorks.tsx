import { useEffect, useRef, useState } from 'react';
import { Smartphone, MapPin, Zap, ArrowRight, Clock } from 'lucide-react';
import './HowItWorks.css';

const steps = [
    {
        num: "01",
        title: "Real-time Telemetry",
        desc: "Continuous monitoring of station load, health, and battery state-of-charge.",
        icon: <Smartphone strokeWidth={1.5} size={28} />
    },
    {
        num: "02",
        title: "Anomaly Detection",
        desc: "AI identifies potential failures and charger degradation before downtime occurs.",
        icon: <MapPin strokeWidth={1.5} size={28} />
    },
    {
        num: "03",
        title: "Intelligent Rerouting",
        desc: "Dynamic driver guidance to optimize station load and minimize wait times.",
        icon: <Zap strokeWidth={1.5} size={28} />
    },
    {
        num: "04",
        title: "Autonomous Ops",
        desc: "Automated dispatching of maintenance and inventory balancing alerts.",
        icon: <ArrowRight strokeWidth={1.5} size={28} />
    }
];

const HowItWorks = () => {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [count, setCount] = useState(0);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Run once only
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Count-up animation
    useEffect(() => {
        if (isVisible) {
            const start = 0;
            const end = 180;
            const duration = 2000; // 2 seconds
            const increment = end / (duration / 16); // ~60fps

            let current = start;
            const timer = setInterval(() => {
                current += increment;
                if (current >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(current));
                }
            }, 16);

            return () => clearInterval(timer);
        }
    }, [isVisible]);

    return (
        <section className={`section workflow-section ${isVisible ? 'visible' : ''}`} id="services" ref={sectionRef}>
            <div className="container">

                <div className="workflow-header">
                    <div className="header-left fade-in-up">
                        <span className="workflow-label">BATTERY SWAP WORKFLOW</span>
                        <h2>Swap. Ride. Repeat.<br />All Under 3 Minutes.</h2>
                    </div>

                    <div className="stat-card fade-in-up delay-1">
                        <div className="stat-icon-wrapper">
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">AVG. SWAP TIME</span>
                            <span className="stat-value">~{count} seconds</span>
                        </div>
                    </div>
                </div>

                <div className="workflow-steps-wrapper">
                    <div className="connector-line"></div>

                    <div className="workflow-grid">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="workflow-step fade-in-up"
                                style={{ animationDelay: `${(index + 2) * 0.15}s` }}
                            >
                                <div className="step-card-wrapper">
                                    <div className="step-badge">{step.num}</div>
                                    <div className="step-card">
                                        <div className="step-icon">
                                            {step.icon}
                                        </div>
                                    </div>
                                </div>

                                <div className="step-text">
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default HowItWorks;
