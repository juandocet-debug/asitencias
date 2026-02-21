/* eslint-disable */
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Award, Settings, LogOut, Bell, Search, Menu, User, AlertCircle, ClipboardCheck, Plus, X, CheckCircle2, Loader2, Hash, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import api from '../services/api';

// Sidebar Item Component — estilo ILINYX (fondo oscuro, texto claro)
const SidebarItem = ({ icon: Icon, label, to, onClick, subtitle }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
            ${isActive
                ? 'bg-upn-600 text-white shadow-lg shadow-upn-900/30'
                : 'text-upn-200 hover:bg-upn-800/60 hover:text-white'}`
        }
    >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col flex-1">
            <span>{label}</span>
            {subtitle && <span className="text-[10px] opacity-70 font-normal leading-none mt-0.5">{subtitle}</span>}
        </div>
        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </NavLink>
);

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const { user, setUser, loading } = useUser();
    const isAdmin = user?.role === 'ADMIN';
    const isTeacher = user?.role === 'TEACHER';
    const isStudent = user?.role === 'STUDENT';

    // Estado modal "Unirse a clase"
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState('');
    const [joinSuccess, setJoinSuccess] = useState('');

    const handleJoinClass = async (e) => {
        e.preventDefault();
        if (!classCode.trim()) return;
        setJoinLoading(true);
        setJoinError('');
        setJoinSuccess('');
        try {
            const res = await api.post('/users/join-class/', { class_code: classCode.trim().toUpperCase() });
            setJoinSuccess(res.data?.message || '¡Te uniste a la clase exitosamente!');
            setClassCode('');
            setTimeout(() => {
                setJoinModalOpen(false);
                setJoinSuccess('');
                navigate('/classes');
            }, 2000);
        } catch (err) {
            setJoinError(err.response?.data?.error || err.response?.data?.detail || 'Código inválido o ya estás inscrito.');
        } finally {
            setJoinLoading(false);
        }
    };

    const openJoinModal = () => {
        setClassCode('');
        setJoinError('');
        setJoinSuccess('');
        setJoinModalOpen(true);
        setIsSidebarOpen(false);
    };

    // Proteger ruta: Si no hay token, enviar al login
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-5">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-upn-200 border-t-upn-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img
                            src="/upn-logo.png"
                            className="h-8 w-8 object-contain"
                            alt="UPN"
                        />
                    </div>
                </div>
                <img
                    src="/este-agon.png"
                    alt="ESTE AGON"
                    className="h-16 object-contain animate-pulse"
                />
                <p className="text-slate-500 font-medium text-sm">Sincronizando perfil...</p>
            </div>
        );
    }

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
        if (setUser) setUser(null);
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* ── Cabecera: Perfil del usuario ── */}
            <div className="px-5 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        {user?.photo ? (
                            <img
                                src={user.photo}
                                alt="User"
                                className="w-11 h-11 rounded-full object-cover border-2 border-white/20 shadow-sm"
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-upn-400 to-upn-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                            </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-upn-900 rounded-full"></span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate">
                            {user ? `${user.first_name} ${user.last_name}` : 'Cargando...'}
                        </h3>
                        <p className="text-[11px] text-upn-300 font-medium">
                            {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'TEACHER' ? 'Docente' : 'Estudiante'}
                        </p>
                    </div>
                </div>
                {/* Editar perfil */}
                <button
                    onClick={() => { setIsSidebarOpen(false); navigate('/profile'); }}
                    className="flex items-center gap-2 mt-3 px-3 py-2 w-full rounded-xl text-xs font-semibold text-upn-200 bg-upn-800/50 hover:bg-upn-800 border border-upn-700/50 transition-all"
                >
                    <User size={14} />
                    Editar perfil
                </button>
            </div>
            {/* Línea sutil */}
            <div className="mx-5 border-t border-upn-800/50"></div>

            {/* ── Navegación ── */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" onClick={() => setIsSidebarOpen(false)} />

                <SidebarItem
                    icon={BookOpen}
                    label={isAdmin ? 'Gestión de Clases' : isTeacher ? 'Mis Cursos' : 'Mis Clases'}
                    to="/classes"
                    onClick={() => setIsSidebarOpen(false)}
                />

                {isAdmin && (
                    <SidebarItem icon={Users} label="Usuarios" to="/users" onClick={() => setIsSidebarOpen(false)} />
                )}

                {isAdmin && (
                    <SidebarItem icon={Award} label="Insignias" to="/badges" onClick={() => setIsSidebarOpen(false)} />
                )}

                {user?.role === 'STUDENT' && (
                    <SidebarItem
                        icon={AlertCircle}
                        label="Mis Faltas"
                        to="/my-absences"
                        onClick={() => setIsSidebarOpen(false)}
                        subtitle="Justificar inasistencias"
                    />
                )}

                {user?.role === 'TEACHER' && (
                    <SidebarItem
                        icon={ClipboardCheck}
                        label="Revisiones"
                        to="/reviews"
                        onClick={() => setIsSidebarOpen(false)}
                        subtitle="Excusas pendientes"
                    />
                )}

                {isStudent && (
                    <button
                        onClick={openJoinModal}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-upn-200 hover:bg-upn-800/60 hover:text-white transition-all duration-200 group mt-1"
                    >
                        <div className="w-5 h-5 rounded-full bg-upn-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Plus size={12} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-medium">Unirse a Clase</span>
                            <span className="text-[10px] opacity-60 font-normal">Código del profesor</span>
                        </div>
                    </button>
                )}

                {isAdmin && (
                    <SidebarItem icon={Settings} label="Configuración" to="/settings" onClick={() => setIsSidebarOpen(false)} />
                )}
            </nav>

            {/* Footer sidebar — branding AGON */}
            <div className="px-4 py-4 border-t border-upn-800/50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-upn-800/50">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <img src="/este-agon.png" alt="AGON" className="h-6 w-6 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">AGON</p>
                        <p className="text-upn-300 text-[10px] truncate">Gestión Académica</p>
                    </div>
                    <button onClick={handleLogout}
                        className="text-upn-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
                        title="Cerrar sesión">
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50/50">

            {/* ── Sidebar Desktop ── */}
            <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 z-40 bg-upn-900 shadow-2xl">
                <SidebarContent />
            </aside>

            {/* ── Sidebar Mobile (drawer) ── */}
            {isSidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-upn-900 shadow-2xl md:hidden transition-transform duration-300">
                        <button onClick={() => setIsSidebarOpen(false)}
                            className="absolute top-4 right-4 text-upn-300 hover:text-white p-1">
                            <X className="h-5 w-5" />
                        </button>
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 relative z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Search Bar */}
                        <div className="hidden md:flex relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-upn-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar estudiante, clase..."
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-upn-100 focus:border-upn-300 w-64 lg:w-96 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-upn-600 relative transition-colors shadow-sm">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-3 pl-4 border-l border-slate-200 focus:outline-none group"
                            >
                                <div className="text-right mr-3 hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-upn-700 transition-colors">
                                        {user ? `${user.first_name} ${user.last_name}` : 'Cargando...'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {isAdmin ? 'Administrador' : isTeacher ? 'Docente' : 'Estudiante'}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                                    {user?.photo ? (
                                        <img
                                            src={user.photo}
                                            alt="Profile"
                                            className="w-full h-full rounded-full object-cover border-2 border-white"
                                        />
                                    ) : (
                                        <User className="text-slate-400" size={20} />
                                    )}
                                </div>
                            </button>

                            {/* Profile Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in slide-in-from-top-2">
                                        <div className="px-4 py-3 border-b border-slate-100 mb-1">
                                            <p className="text-sm font-bold text-slate-800">Mi Cuenta</p>
                                        </div>

                                        <button
                                            onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-upn-700 flex items-center gap-3 transition-colors"
                                        >
                                            <User size={18} /> Editar Perfil
                                        </button>

                                        <div className="my-1 border-t border-slate-100"></div>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                                        >
                                            <LogOut size={18} /> Cerrar Sesión
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <Outlet />
                </div>
            </main>

            {/* ===== MODAL UNIRSE A CLASE ===== */}
            {joinModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setJoinModalOpen(false)}>
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header modal */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-upn-100 flex items-center justify-center">
                                    <Hash size={24} className="text-upn-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Unirse a Clase</h3>
                                    <p className="text-xs text-slate-500">Ingresa el código que te dio tu profesor</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setJoinModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Feedback de éxito */}
                        {joinSuccess && (
                            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0" />
                                <p className="text-sm font-semibold text-emerald-700">{joinSuccess}</p>
                            </div>
                        )}

                        {/* Feedback de error */}
                        {joinError && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                                <p className="text-sm font-semibold text-red-600">{joinError}</p>
                            </div>
                        )}

                        {/* Formulario */}
                        {!joinSuccess && (
                            <form onSubmit={handleJoinClass} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Código de la Clase
                                    </label>
                                    <input
                                        type="text"
                                        value={classCode}
                                        onChange={e => setClassCode(e.target.value.toUpperCase())}
                                        placeholder="Ej: AB12CD"
                                        maxLength={8}
                                        autoFocus
                                        className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center font-mono text-2xl font-black tracking-widest text-upn-900 placeholder:text-slate-300 placeholder:font-sans placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-upn-500 focus:ring-4 focus:ring-upn-100 transition-all uppercase"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 text-center">
                                        El código tiene 6 caracteres entre letras y números
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setJoinModalOpen(false)}
                                        className="flex-1 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={joinLoading || !classCode.trim()}
                                        className="flex-1 py-3.5 bg-upn-600 hover:bg-upn-700 text-white font-bold rounded-2xl shadow-lg shadow-upn-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {joinLoading ? (
                                            <><Loader2 size={18} className="animate-spin" /> Uniendo...</>
                                        ) : (
                                            <><Plus size={18} /> Unirse</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
