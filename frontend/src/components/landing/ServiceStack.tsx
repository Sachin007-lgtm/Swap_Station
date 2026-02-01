import { useEffect, useRef, useState } from 'react';
import { Settings, MapPin, Activity, Link, Battery, Zap, Users, BarChart2, Laptop } from 'lucide-react';
import './ServiceStack.css';

const serviceCategories = [
    {
        title: "CORE INTELLIGENCE",
        icon: <Settings size={20} />,
        items: [
            {
                title: "Station Telemetry",
                desc: "Real-time data feeds from Every IoT-enabled swap hub.",
                icon: <Activity size={18} />
            },
            {
                title: "Health Diagnostics",
                desc: "Predictive maintenance patterns for chargers and cells.",
                icon: <Zap size={18} />
            },
            {
                title: "Demand Forecasting",
                desc: "AI-driven models to predict upcoming network load.",
                icon: <BarChart2 size={18} />
            }
        ]
    },
    {
        title: "NETWORK ORCHESTRATION",
        icon: <Zap size={20} />,
        items: [
            {
                title: "Dynamic Rerouting",
                desc: "Software hooks to guide drivers based on live capacity.",
                icon: <MapPin size={18} />
            },
            {
                title: "Queue Management",
                desc: "Automated load balancing across regional hubs.",
                icon: <Link size={18} />
            },
            {
                title: "Inventory Balancing",
                desc: "Optimized logistics for battery distribution missions.",
                icon: <Settings size={18} />
            }
        ]
    },
    {
        title: "ENTERPRISE SAAS",
        icon: <Laptop size={20} />,
        items: [
            {
                title: "Action Hooks (n8n)",
                desc: "Native integration for automated alert workflows.",
                icon: <Activity size={18} />
            },
            {
                title: "Ops Dashboards",
                desc: "Centralized control room for network supervisors.",
                icon: <BarChart2 size={18} />
            },
            {
                title: "Decision Support",
                desc: "Live recommendation engine for station supervisors and ops teams.",
                icon: <Laptop size={18} />
            }
        ]
    }
];

const ServiceStack = () => {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section className={`section service-stack-section ${isVisible ? 'visible' : ''}`} id="services" ref={sectionRef}>
            <div className="service-bg-grid"></div> {/* Grid lines background */}
            <div className="container">
                <div className="service-header fade-in-up">
                    <span className="eyebrow-text">AI-DRIVEN ORCHESTRATION — SERVICE STACK</span>
                    <h2>Built for Network Scale —<br />Powered by Operational Intelligence.</h2>
                </div>

                <div className="services-grid">
                    {serviceCategories.map((category, index) => (
                        <div
                            key={index}
                            className="category-card fade-in-up"
                            style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                        >
                            <div className="category-header">
                                <span className="category-icon-main">{category.icon}</span>
                                <h3>{category.title}</h3>
                            </div>

                            <div className="category-items">
                                {category.items.map((item, idx) => (
                                    <div key={idx} className="service-item">
                                        <div className="item-icon">
                                            {item.icon}
                                        </div>
                                        <div className="item-content">
                                            <h4>{item.title}</h4>
                                            <p>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>


                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServiceStack;
