import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Cpu, MapPin } from 'lucide-react';

export default function Footer() {
  const cities = ['Hyderabad', 'Mumbai', 'Bangalore', 'Delhi', 'Pune', 'Chennai'];

  return (
    <footer className="w-full bg-[var(--footer-bg)] border-t border-border/10 pt-16 pb-8 px-4 md:px-8 mt-auto transition-all duration-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-bold text-base text-text-primary shadow-lg shadow-brand-primary/20">
              RE
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-text-primary">
              RentEase
            </span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
            Next-generation rental platform backed by machine learning, offering real-time listings and seamless negotiations.
          </p>
          <div className="flex items-center space-x-3 text-text-muted">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-text-primary transition-all duration-300"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <span className="text-xs font-mono bg-white/5 px-2.5 py-1 rounded-md border border-white/5 flex items-center space-x-1">
              <Cpu size={12} className="text-brand-accent animate-pulse" />
              <span>v1.0.0-Stable</span>
            </span>
          </div>
        </div>

        {/* Popular Cities */}
        <div>
          <h4 className="font-display font-semibold text-text-primary text-sm tracking-wider uppercase mb-4">
            Popular Cities
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            {cities.map((city) => (
              <li key={city}>
                <Link
                  to={`/search?city=${city}`}
                  className="hover:text-brand-accent transition-colors duration-200 flex items-center space-x-1"
                >
                  <MapPin size={12} className="text-text-muted" />
                  <span>{city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-display font-semibold text-text-primary text-sm tracking-wider uppercase mb-4">
            Core Features
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                AI Fair Rent Estimate
              </span>
            </li>
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                Real-time SSE Streams
              </span>
            </li>
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                Smart Rent Negotiation
              </span>
            </li>
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                Verified Document Checklist
              </span>
            </li>
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                Roommate-Friendly Groups
              </span>
            </li>
          </ul>
        </div>

        {/* Tech Specs */}
        <div>
          <h4 className="font-display font-semibold text-text-primary text-sm tracking-wider uppercase mb-4">
            Security & Trust
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                Stateless JWT Authentication
              </span>
            </li>
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                Secure Razorpay Integration
              </span>
            </li>
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                Cloudinary Asset Optimizations
              </span>
            </li>
            <li>
              <span className="hover:text-text-primary transition-colors duration-200 cursor-default">
                PostgreSQL Isolated Transactions
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-border/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-text-muted">
        <p>&copy; {new Date().getFullYear()} RentEase Inc. All rights reserved.</p>
        <p className="flex items-center space-x-1 mt-2 md:mt-0">
          <span>Crafted with</span>
          <Heart size={10} className="text-brand-secondary fill-brand-secondary" />
          <span>for the Indian Rental Market.</span>
        </p>
      </div>
    </footer>
  );
}
