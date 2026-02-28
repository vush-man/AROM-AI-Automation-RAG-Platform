import { useScrollReveal } from '../../hooks/useScrollReveal.js';

export default function RevealSection({ children, className = '', threshold = 0.1, delay = 0 }) {
    const { ref, isVisible } = useScrollReveal({ threshold, triggerOnce: true });

    return (
        <div
            ref={ref}
            className={`reveal ${isVisible ? 'visible' : ''} ${className}`}
            style={{ transitionDelay: `${delay}ms`, width: '100%' }}
        >
            {children}
        </div>
    );
}




