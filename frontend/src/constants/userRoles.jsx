// constants/userRoles.jsx
// Mapeos de roles a etiquetas, estilos e íconos — usados en toda la app.

import React from 'react';
import { GraduationCap, BookOpen, Briefcase, Shield } from 'lucide-react';

export const ROLE_LABELS = {
    'STUDENT': 'Estudiante',
    'TEACHER': 'Docente',
    'PRACTICE_TEACHER': 'Prof. Prácticas',
    'COORDINATOR': 'Coordinador',
    'ADMIN': 'Administrador',
};

export const ROLE_STYLES = {
    'STUDENT': 'bg-blue-100 text-blue-800 border-blue-200',
    'TEACHER': 'bg-purple-100 text-purple-800 border-purple-200',
    'PRACTICE_TEACHER': 'bg-teal-100 text-teal-800 border-teal-200',
    'COORDINATOR': 'bg-amber-100 text-amber-800 border-amber-200',
    'ADMIN': 'bg-upn-100 text-upn-800 border-upn-200',
};

export const ROLE_ICONS = {
    'STUDENT': <GraduationCap size={14} />,
    'TEACHER': <BookOpen size={14} />,
    'PRACTICE_TEACHER': <Briefcase size={14} />,
    'COORDINATOR': <Briefcase size={14} />,
    'ADMIN': <Shield size={14} />,
};

export const COORDINATOR_TYPE_LABELS = {
    'PRACTICAS': 'Prácticas',
    'PROGRAMA': 'Programa',
    'INVESTIGACION': 'Investigación',
    'EXTENSION': 'Extensión',
};

// Orden estándar de roles para mostrar en filtros
export const ROLES_ORDER = ['STUDENT', 'TEACHER', 'PRACTICE_TEACHER', 'COORDINATOR', 'ADMIN'];
