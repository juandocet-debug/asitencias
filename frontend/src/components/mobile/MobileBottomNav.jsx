import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Home, UserRound, Users } from 'lucide-react';

const items = [
    { to: '/dashboard', icon: Home, label: 'Inicio' },
    { to: '/classes', icon: BookOpen, label: 'Clases' },
    { to: '/users', icon: Users, label: 'Usuarios' },
    { to: '/profile', icon: UserRound, label: 'Perfil' },
];

export default function MobileBottomNav() {
    return (
        <nav className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-5 md:hidden">
            <div className="relative h-[4.1rem] w-full max-w-[21rem]">
                <div className="absolute inset-x-0 bottom-1 h-14 -rotate-2 rounded-[1.35rem] bg-[#7657f6] shadow-[0_18px_35px_rgba(118,87,246,0.35)]" />
                <div className="absolute inset-x-3 bottom-[0.55rem] flex h-12 items-center justify-around rounded-[1.15rem] bg-[#7657f6]">
                    {items.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `grid h-10 min-w-11 place-items-center rounded-2xl px-3 text-white transition ${isActive ? 'bg-white/20 shadow-inner' : 'opacity-65'}`
                            }
                            title={label}
                        >
                            <Icon size={17} />
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
}
