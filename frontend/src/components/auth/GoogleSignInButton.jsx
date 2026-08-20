import React, { useEffect, useRef } from 'react';

const SCRIPT_ID = 'google-identity-services';

export default function GoogleSignInButton({ clientId, onCredential, disabled = false }) {
    const buttonRef = useRef(null);

    useEffect(() => {
        if (!clientId || disabled) return undefined;
        let cancelled = false;

        const render = () => {
            if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: response => onCredential(response?.credential || ''),
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            buttonRef.current.replaceChildren();
            window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'filled_black',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                locale: 'es',
                width: Math.min(buttonRef.current.clientWidth || 360, 400),
            });
        };

        const existing = document.getElementById(SCRIPT_ID);
        if (existing) {
            if (window.google?.accounts?.id) render();
            else existing.addEventListener('load', render, { once: true });
            return () => {
                cancelled = true;
                existing.removeEventListener('load', render);
            };
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://accounts.google.com/gsi/client?hl=es';
        script.async = true;
        script.defer = true;
        script.onload = render;
        document.head.appendChild(script);
        return () => { cancelled = true; };
    }, [clientId, disabled, onCredential]);

    if (!clientId) return null;
    return <div ref={buttonRef} className={`flex min-h-11 w-full justify-center overflow-hidden rounded-xl ${disabled ? 'pointer-events-none opacity-60' : ''}`} />;
}
