import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, User } from 'lucide-react';
import { ROLE_META } from './sidebarConfig';

export default function Topbar({ user, effectiveRole, allRoles, setActiveRole, handleLogout, onMenuToggle }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const activeMeta = ROLE_META[effectiveRole] || { label: effectiveRole || 'Sin rol' };

    return (
        <header className="sticky top-0 z-30 px-4 pt-4 md:px-8 md:pt-6">
            <div className="app-glass flex h-16 items-center justify-between rounded-[1.7rem] px-4 md:h-18 md:px-5">
                <div className="flex items-center gap-3">
                    <button onClick={onMenuToggle} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 md:hidden">
                        <Menu size={22} />
                    </button>
                    <div className="hidden items-center gap-3 rounded-full bg-white/80 px-4 py-2 md:flex">
                        <Search className="h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar estudiante, clase..."
                            className="w-72 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <div className="md:hidden">
                        <p className="text-[11px] font-bold text-slate-400">AGON</p>
                        <p className="text-sm font-black text-[#172033]">{activeMeta.label}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {allRoles.length > 1 && (
                        <div className="hidden items-center gap-1.5 rounded-full bg-[#7657f6]/10 px-3 py-2 text-xs font-black text-[#7657f6] sm:flex">
                            {activeMeta.label}
                        </div>
                    )}
                    <button className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm">
                        <Bell size={18} />
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ff6868]" />
                    </button>
                    <div className="relative">
                        <button onClick={() => setOpen(value => !value)} className="flex items-center gap-2 rounded-full bg-white p-1.5 pr-3 shadow-sm">
                            <Avatar user={user} />
                            <span className="hidden text-sm font-black text-[#172033] sm:block">{user?.first_name || 'Perfil'}</span>
                        </button>
                        {open && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                                <div className="absolute right-0 z-20 mt-3 w-64 rounded-3xl border border-white bg-white p-3 shadow-2xl">
                                    <p className="px-2 text-sm font-black text-[#172033]">{user?.first_name} {user?.last_name}</p>
                                    <p className="px-2 pb-3 text-xs font-semibold text-slate-400">{activeMeta.label}</p>
                                    {allRoles.length > 1 && (
                                        <div className="mb-2 grid grid-cols-2 gap-2">
                                            {allRoles.map(role => (
                                                <button key={role} onClick={() => { setActiveRole(role); setOpen(false); }} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                                                    {ROLE_META[role]?.short || role}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <MenuButton icon={User} label="Editar perfil" onClick={() => { setOpen(false); navigate('/profile'); }} />
                                    <MenuButton icon={LogOut} label="Cerrar sesión" danger onClick={handleLogout} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

function Avatar({ user }) {
    if (user?.photo) return <img src={user.photo} alt="Perfil" className="h-9 w-9 rounded-full object-cover" />;
    return (
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#8b6dff] to-[#7657f6] text-sm font-black text-white">
            {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
        </div>
    );
}

function MenuButton({ icon: Icon, label, onClick, danger = false }) {
    return (
        <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold ${danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Icon size={17} /> {label}
        </button>
    );
}
