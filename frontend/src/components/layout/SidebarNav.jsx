/* eslint-disable */
// components/layout/SidebarNav.jsx
// Contenido de navegación del sidebar — lista de ítems según rol activo.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, Award, Wrench, ClipboardCheck,
    AlertCircle, ClipboardList, Settings, LogOut, Plus, GraduationCap,
    Briefcase, User
} from 'lucide-react';
import { ROLE_META, SidebarItem, SidebarSection, SidebarSubItem, RoleSwitcher } from './sidebarConfig';

export default function SidebarNav({ user, effectiveRole, allRoles, setActiveRole, onClose, openJoinModal, handleLogout }) {
    const navigate = useNavigate();

    const isAdmin = effectiveRole === 'ADMIN';
    const isStudent = effectiveRole === 'STUDENT';
    const isCoordinator = effectiveRole === 'COORDINATOR';
    const isPracticeTeacher = effectiveRole === 'PRACTICE_TEACHER';

    const getRoleLabel = () => ROLE_META[effectiveRole]?.label || effectiveRole || 'Sin rol';

    return (
        <div className="flex flex-col h-full">

            {/* ── Perfil del usuario ── */}
            <div className="px-5 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        {user?.photo ? (
                            <img src={user.photo} alt="User" className="w-11 h-11 rounded-full object-cover border-2 border-white/20 shadow-sm" />
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-upn-400 to-upn-600 flex items-center justify-center text-white font-bold text-sm">
                                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                            </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-upn-900 rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate">
                            {user ? `${user.first_name} ${user.last_name}` : 'Cargando...'}
                        </h3>
                        <p className="text-[11px] text-upn-300 font-medium flex items-center gap-1">
                            {effectiveRole && ROLE_META[effectiveRole] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            {getRoleLabel()}
                            {allRoles.length > 1 && <span className="text-upn-500 font-normal">· {allRoles.length} roles</span>}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Role Switcher (solo si multi-rol) ── */}
            <RoleSwitcher
                user={user} activeRole={effectiveRole}
                setActiveRole={setActiveRole}
                onAfterSwitch={onClose}
            />

            {/* ── Botón editar perfil ── */}
            <div className="px-4 pb-3">
                <button
                    onClick={() => { onClose(); navigate('/profile'); }}
                    className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-semibold text-upn-200 bg-upn-800/50 hover:bg-upn-800 border border-upn-700/50 transition-all"
                >
                    <User size={14} /> Editar perfil
                </button>
            </div>

            <div className="mx-5 border-t border-upn-800/50" />

            {/* ── Navegación ── */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" onClick={onClose} />

                {/* Clases — no para Coordinador ni Practice Teacher */}
                {effectiveRole !== 'COORDINATOR' && effectiveRole !== 'PRACTICE_TEACHER' && (
                    <SidebarItem
                        icon={BookOpen}
                        label={isAdmin ? 'Gestión de Clases' : effectiveRole === 'TEACHER' ? 'Mis Cursos' : 'Mis Clases'}
                        to="/classes" onClick={onClose}
                    />
                )}

                {/* Admin only */}
                {isAdmin && (<>
                    <SidebarItem icon={Users} label="Usuarios" to="/users" onClick={onClose} />
                    <SidebarItem icon={Award} label="Insignias" to="/badges" onClick={onClose} />
                    <SidebarItem icon={Wrench} label="Herramientas" to="/tools" onClick={onClose} subtitle="Facultades y programas" />
                </>)}

                {/* Coordinador — filtrado por coordinator_type */}
                {isCoordinator && (() => {
                    const coordTypes = (user?.coordinator_profiles || []).map(cp => cp.coordinator_type);
                    const hasPracticas = coordTypes.includes('PRACTICAS');
                    const hasPrograma = coordTypes.includes('PROGRAMA');
                    const hasInvestigacion = coordTypes.includes('INVESTIGACION');
                    const hasExtension = coordTypes.includes('EXTENSION');

                    if (coordTypes.length === 1) return (<>
                        {hasPracticas && <SidebarItem icon={ClipboardList} label="Mis Prácticas" to="/coordinator/practicas" onClick={onClose} subtitle="Gestión y asignación" />}
                        {hasPrograma && <SidebarItem icon={GraduationCap} label="Mi Programa" to="/coordinator/programa" onClick={onClose} />}
                        {hasInvestigacion && <SidebarItem icon={BookOpen} label="Investigación" to="/coordinator/investigacion" onClick={onClose} />}
                        {hasExtension && <SidebarItem icon={Briefcase} label="Extensión" to="/coordinator/extension" onClick={onClose} />}
                    </>);

                    return (
                        <SidebarSection icon={Briefcase} label="Coordinador" defaultOpen>
                            {hasPracticas && <SidebarSubItem icon={ClipboardList} label="Prácticas" to="/coordinator/practicas" onClick={onClose} />}
                            {hasPrograma && <SidebarSubItem icon={GraduationCap} label="Programa" to="/coordinator/programa" onClick={onClose} />}
                            {hasInvestigacion && <SidebarSubItem icon={BookOpen} label="Investigación" to="/coordinator/investigacion" onClick={onClose} />}
                            {hasExtension && <SidebarSubItem icon={Briefcase} label="Extensión" to="/coordinator/extension" onClick={onClose} />}
                        </SidebarSection>
                    );
                })()}

                {/* Estudiante */}
                {isStudent && <>
                    <SidebarItem icon={AlertCircle} label="Mis Faltas" to="/my-absences" onClick={onClose} subtitle="Justificar inasistencias" />
                    <SidebarItem icon={ClipboardList} label="Mis Prácticas" to="/mis-practicas" onClick={onClose} subtitle="Reflexiones y asistencia" />
                    <button
                        onClick={openJoinModal}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-upn-200 hover:bg-upn-800/60 hover:text-white transition-all group mt-1"
                    >
                        <div className="w-5 h-5 rounded-full bg-upn-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Plus size={12} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-medium">Unirse a Clase</span>
                            <span className="text-[10px] opacity-60 font-normal">Código del profesor</span>
                        </div>
                    </button>
                </>}

                {/* Docente / Practice Teacher — Revisiones */}
                {(effectiveRole === 'TEACHER' || effectiveRole === 'PRACTICE_TEACHER') && (
                    <SidebarItem icon={ClipboardCheck} label="Revisiones" to="/reviews" onClick={onClose} subtitle="Excusas pendientes" />
                )}

                {/* Practice Teacher — Mis Prácticas */}
                {isPracticeTeacher && (
                    <SidebarItem icon={ClipboardList} label="Mis Prácticas" to="/coordinator/practicas" onClick={onClose} subtitle="Seguimiento y tareas" />
                )}

                {isAdmin && <SidebarItem icon={Settings} label="Configuración" to="/settings" onClick={onClose} />}
            </nav>

            {/* ── Footer: branding AGON + logout ── */}
            <div className="px-4 py-4 border-t border-upn-800/50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-upn-800/50">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <img src="/este-agon.png" alt="AGON" className="h-6 w-6 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">AGON</p>
                        <p className="text-upn-300 text-[10px] truncate">Gestión Académica · UPN</p>
                    </div>
                    <button onClick={handleLogout} className="text-upn-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10" title="Cerrar sesión">
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
