/* eslint-disable */
/**
 * Practicas.jsx — Coordinador
 * Orquestador principal de la página de prácticas.
 * Contenido por tab → componentes dedicados:
 *   TabPracticas  → components/practicas/TabPracticas.jsx
 *   TabSitios     → components/practicas/TabSitios.jsx
 *   TabObjetivos  → components/practicas/TabObjetivos.jsx
 *   TabDocentes   → components/practicas/TabDocentes.jsx
 *   UI primitivos → components/practicas/practicasUi.jsx
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Building2, Target, UserCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Toast } from '../components/practicas/practicasUi';
import TabPracticas from '../components/practicas/TabPracticas';
import TabSitios from '../components/practicas/TabSitios';
import TabObjetivos from '../components/practicas/TabObjetivos';
import TabDocentes from '../components/practicas/TabDocentes';

const TABS = [
    { key: 'practicas', label: 'Prácticas', icon: ClipboardList },
    { key: 'sitios', label: 'Sitios', icon: Building2 },
    { key: 'objetivos', label: 'Objetivos', icon: Target },
    { key: 'docentes', label: 'Docentes', icon: UserCheck },
];

export default function PracticasPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('practicas');
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    }, []);

    const coordProfile = user?.coordinator_profiles?.find(cp => cp.coordinator_type === 'PRACTICAS');
    const programId = coordProfile?.program;
    const programName = coordProfile?.program_name || 'Tu programa';

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Header */}
            <div>
                <p className="text-xs font-bold text-upn-500 uppercase tracking-wider mb-1">Módulo de Coordinación</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Prácticas</h1>
                <div className="flex items-center gap-2 mt-1.5">
                    <Building2 size={13} className="text-upn-400" />
                    <span className="text-sm text-slate-500 font-medium">{programName}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 flex-wrap bg-slate-100/70 p-1.5 rounded-2xl w-fit">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                            ${activeTab === key ? 'bg-white text-upn-700 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Icon size={14} />{label}
                    </button>
                ))}
            </div>

            {/* Contenido por tab */}
            {activeTab === 'practicas' && <TabPracticas programId={programId} showToast={showToast} navigate={navigate} />}
            {activeTab === 'sitios' && <TabSitios programId={programId} showToast={showToast} />}
            {activeTab === 'objetivos' && <TabObjetivos programId={programId} showToast={showToast} />}
            {activeTab === 'docentes' && <TabDocentes programId={programId} showToast={showToast} />}
        </div>
    );
}
