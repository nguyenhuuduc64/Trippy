// src/components/Breadcrumb.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 overflow-hidden">
            <Link 
                to="/" 
                className="inline-flex items-center gap-1 hover:text-brand transition-colors text-slate-500 font-medium shrink-0"
                title="Trang chủ"
            >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trang chủ</span>
            </Link>

            {items.map((item, idx) => {
                const isLast = idx === items.length - 1;
                return (
                    <React.Fragment key={idx}>
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        {item.to && !isLast ? (
                            <Link 
                                to={item.to} 
                                className="hover:text-brand transition-colors text-slate-500 font-medium shrink-0"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span 
                                className="font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-xs" 
                                title={item.label}
                            >
                                {item.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
