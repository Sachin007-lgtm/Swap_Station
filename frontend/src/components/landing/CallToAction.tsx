import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './CallToAction.css';

const CallToAction = () => {
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
            { threshold: 0.3 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section className={`section cta-section ${isVisible ? 'visible' : ''}`} ref={sectionRef}>
            <div className="container cta-container">
                <span className="cta-eyebrow fade-in-up">TO GET STARTED</span>

                <h3 className="cta-headline fade-in-up delay-1">
                    Optimize your network with <br />
                    <span className="text-highlight">Smart Swap AI Ops.</span>
                </h3>

                <p className="cta-description fade-in-up delay-2">
                    Predict congestion, automate workflows, and maximize efficiency across your entire battery swap ecosystem. We handle the operational complexity so you can focus on scaling your footprint.
                </p>

                <div className="cta-arrow fade-in-up delay-3">
                    <ChevronDown size={32} />
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
