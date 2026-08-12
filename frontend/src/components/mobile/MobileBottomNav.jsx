import React from 'react';
import { NavLink } from 'react-router-dom';
import { AlertCircle, BookOpen, Gamepad2, Home, UserRound, Users } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const BASE = [
    { to: '/dashboard', icon: Home, label: 'Inicio' },
    { to: '/classes', icon: BookOpen, label: 'Clases' },
    { to: '/profile', icon: UserRound, label: 'Perfil' },
];

export default function MobileBottomNav() {
    const { user, activeRole } = useUser();
    const role = activeRole || user?.role;
    const items = role === 'ADMIN'
        ? [BASE[0], BASE[1], { to: '/missions', icon: Gamepad2, label: 'Misiones' }, { to: '/users', icon: Users, label: 'Usuarios' }]
        : role === 'STUDENT'
            ? [BASE[0], BASE[1], { to: '/my-absences', icon: AlertCircle, label: 'Faltas' }, BASE[2]]
            : role === 'TEACHER'
                ? [BASE[0], BASE[1], { to: '/missions', icon: Gamepad2, label: 'Misiones' }, BASE[2]]
                : BASE;

    return (
        <nav className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-[1%] md:hidden">
            <div className="relative h-[4.1rem] w-[98%] max-w-[25rem]">
                <div className="absolute inset-x-0 bottom-1 h-14 rounded-[1.35rem] bg-[#7657f6] shadow-[0_18px_35px_rgba(118,87,246,0.35)]" />
                <div className="absolute inset-x-3 bottom-[0.55rem] flex h-12 items-center justify-around rounded-[1.15rem] bg-[#7657f6]">
                    {items.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => `grid h-10 min-w-11 place-items-center rounded-2xl px-3 text-white transition ${isActive ? 'bg-white/20 shadow-inner' : 'opacity-65'}`} title={label}>
                            <Icon size={17} />
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
}
