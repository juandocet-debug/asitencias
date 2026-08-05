import React from 'react';
import { ui } from '../../design/tokens';

export default function SoftCard({ children, className = '', onClick }) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag onClick={onClick} className={`${ui.card} w-full p-4 text-left ${className}`}>
            {children}
        </Tag>
    );
}
