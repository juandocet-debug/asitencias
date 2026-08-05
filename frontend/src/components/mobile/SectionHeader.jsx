import React from 'react';

export default function SectionHeader({ title, actionLabel, onAction }) {
    return (
        <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#172033]">{title}</h2>
            {actionLabel && (
                <button onClick={onAction} className="text-xs font-black text-[#7657f6]">
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
