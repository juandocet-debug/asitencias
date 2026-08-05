import React from 'react';
import { ui } from '../../design/tokens';

export default function MobilePageFrame({ children, className = '' }) {
    return (
        <section className={`${ui.page} ${className}`}>
            <div className={ui.shell}>{children}</div>
        </section>
    );
}
