import { useRef, useEffect } from 'react';
import { Building2, Briefcase, Package, Utensils, Bike, Building, Truck } from 'lucide-react';
import './Ecosystem.css';

const Ecosystem = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target); // Run once
                    }
                });
            },
            { threshold: 0.15 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    const metrics = [
        { value: '-40%', title: 'Congestion Relief', desc: 'Dynamic rerouting during peak demand.' },
        { value: '+25%', title: 'Energy Efficiency', desc: 'Smart load balancing & grid syncing.' }
    ];

    const partners = [
        { name: 'Last-Mile Fleet Ops', icon: Truck, hook: 'Real-time routing' },
        { name: 'Cloud Infra Partners', icon: Package, hook: 'Scalable IoT' },
        { name: 'n8n Automation', icon: Bike, hook: 'Workflow orchestration' },
        { name: 'Energy Grid Systems', icon: Building, hook: 'Load balancing' },
        { name: 'Predictive Analytics Hub', icon: Briefcase, hook: 'Anomaly detection' },
        { name: 'Edge Computing Units', icon: Building, hook: 'Low-latency ops' }
    ];

    return (
        <section className="ecosystem-section" id="contact" ref={sectionRef}>
            <div className="container ecosystem-container">
                <div className="ecosystem-left">
                    <span className="ecosystem-eyebrow fade-up">OUR ECOSYSTEM</span>

                    <h2 className="ecosystem-heading fade-up delay-1">
                        Powering Smarter<br />
                        Swap Networks Globally.
                    </h2>

                    <p className="ecosystem-description fade-up delay-2">
                        Smart Swap AI Ops provides the critical orchestration layer for the next generation of electric mobility. We eliminate operational blind spots, enabling network operators to scale with intelligence, efficiency, and zero downtime.
                    </p>

                    <div className="impact-metrics">
                        <span className="section-label">NETWORK PERFORMANCE</span>
                        <div className="metrics-grid">
                            {metrics.map((metric, index) => (
                                <div key={index} className={`metric-card fade-up delay-${3 + index}`}>
                                    <span className="metric-value">{metric.value}</span>
                                    <div className="metric-info">
                                        <h4>{metric.title}</h4>
                                        <p className="metric-desc">{metric.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="ecosystem-right">
                    <div className="partners-grid">
                        {partners.map((partner, index) => {
                            // Odd indices (0, 2, 4) = left column = move UP
                            // Even indices (1, 3, 5) = right column = move DOWN
                            const isLeftColumn = index % 2 === 0;
                            const animationClass = isLeftColumn ? 'float-up' : 'float-down';

                            return (
                                <div
                                    key={index}
                                    className={`partner-card fade-up delay-${6 + index} ${animationClass}`}
                                >
                                    <partner.icon className="partner-icon" size={32} />
                                    <span className="partner-label">{partner.hook || 'STRATEGIC PARTNER'}</span>
                                    <h4 className="partner-name">{partner.name}</h4>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Ecosystem;
