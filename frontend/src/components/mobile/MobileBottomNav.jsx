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
        <nav className="fixed inset-x-4 bottom-4 z-40 md:hidden">
            <div className="mx-auto flex max-w-sm items-center justify-around rounded-full bg-[#7657f6] p-2 shadow-2xl shadow-violet-400/40">
                {items.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `grid h-11 min-w-12 place-items-center rounded-full px-3 text-white transition ${isActive ? 'bg-white/22' : 'opacity-75'}`
                        }
                        title={label}
                    >
                        <Icon size={18} />
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
