// utils/pdfExport.js
// Generador de PDF de asistencia. Abre impresión en una nueva ventana del navegador.
// No depende de React — función pura que recibe datos y genera HTML.
// v3: sección "Sesiones Realizadas" en el encabezado + fechas de asistencia por estudiante.

import { formatDate } from './dateUtils';

// Genera las iniciales de un nombre para el avatar placeholder
function initials(first = '', last = '') {
    return `${(first[0] || '').toUpperCase()}${(last[0] || '').toUpperCase()}`;
}

// Color del badge de porcentaje
function rateColor(rate) {
    if (rate >= 80) return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
    if (rate >= 60) return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
    return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
}

// Color del avatar placeholder (basado en nombre)
const AVATAR_COLORS = ['#0F4C81', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2'];
function avatarColor(name = '') {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
}

// Color de la barra de asistencia de sesión
function sessionRateColor(rate) {
    if (rate >= 80) return '#22c55e';
    if (rate >= 60) return '#f59e0b';
    return '#ef4444';
}

export function generateAttendancePDF({ course, stats, globalStats, studentReport, history = [] }) {
    const printWindow = window.open('', '_blank');

    const avgColor = rateColor(globalStats.avgRate);

    // ── Sesiones ordenadas de más antigua a más reciente para mostrar cronológicamente ──
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Construir pills de sesiones para cada estudiante (índice por fecha)
    const sessionDates = sortedHistory.map(s => s.date);

    // ── Sección "Sesiones Realizadas" ──────────────────────────────────────────────────
    const sessionsSection = sortedHistory.length > 0 ? `
        <div class="sessions-section">
            <div class="sessions-title">
                <span class="sessions-icon">📅</span>
                Sesiones Realizadas
                <span class="sessions-count">${sortedHistory.length} sesiones</span>
            </div>
            <div class="sessions-grid">
                ${sortedHistory.map((s, i) => {
                    const rc = sessionRateColor(s.attendance_rate);
                    return `
                    <div class="session-pill">
                        <span class="session-num">${i + 1}</span>
                        <div class="session-info">
                            <span class="session-date">${formatDate(s.date)}</span>
                            ${s.topic ? `<span class="session-topic">${s.topic}</span>` : ''}
                        </div>
                        <span class="session-rate" style="color:${rc}">${s.attendance_rate}%</span>
                    </div>`;
                }).join('')}
            </div>
        </div>` : '';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Reporte de Asistencia - ${course?.name || 'Clase'}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                padding: 28px 32px; color: #1e293b; font-size: 11px; line-height: 1.5;
                background: #fff;
            }

            /* ── Header ── */
            .header {
                display: flex; justify-content: space-between; align-items: flex-start;
                margin-bottom: 18px; padding-bottom: 14px;
                border-bottom: 3px solid #0F4C81;
            }
            .header-logo { display: flex; align-items: center; gap: 10px; }
            .header-logo .logo-box {
                width: 44px; height: 44px; background: #0F4C81; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                color: white; font-size: 20px;
            }
            .header-left h1 { color: #0F4C81; font-size: 20px; font-weight: 800; margin-bottom: 2px; }
            .header-left p  { color: #64748b; font-size: 11px; }
            .header-right   { text-align: right; color: #64748b; font-size: 10px; line-height: 1.8; }

            /* ── Summary grid ── */
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
            .summary-box {
                background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
                padding: 12px 10px; text-align: center;
            }
            .summary-box strong { display: block; font-size: 22px; font-weight: 800; color: #0F4C81; }
            .summary-box span   { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }

            /* ── Sessions section ── */
            .sessions-section {
                background: #f0f7ff;
                border: 1px solid #bfdbfe;
                border-left: 4px solid #0F4C81;
                border-radius: 10px;
                padding: 12px 14px 14px;
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            .sessions-title {
                display: flex; align-items: center; gap: 6px;
                font-size: 11px; font-weight: 800; color: #0F4C81;
                margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;
            }
            .sessions-icon { font-size: 13px; }
            .sessions-count {
                margin-left: auto;
                background: #0F4C81; color: white;
                font-size: 9px; padding: 1px 8px; border-radius: 99px;
                font-weight: 700; letter-spacing: 0;
            }
            .sessions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
                gap: 6px;
            }
            .session-pill {
                display: flex; align-items: center; gap: 7px;
                background: white; border: 1px solid #dbeafe;
                border-radius: 7px; padding: 5px 8px;
            }
            .session-num {
                min-width: 18px; height: 18px; border-radius: 50%;
                background: #0F4C81; color: white;
                font-size: 8px; font-weight: 800;
                display: flex; align-items: center; justify-content: center;
                flex-shrink: 0;
            }
            .session-info { flex: 1; min-width: 0; }
            .session-date { display: block; font-size: 9.5px; font-weight: 700; color: #1e293b; }
            .session-topic {
                display: block; font-size: 8px; color: #64748b;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .session-rate { font-size: 10px; font-weight: 800; flex-shrink: 0; }

            /* ── Student card ── */
            .student-section {
                border: 1px solid #e2e8f0; border-radius: 12px;
                margin-bottom: 10px; page-break-inside: avoid; overflow: hidden;
            }
            .student-header {
                display: flex; align-items: center; gap: 12px;
                padding: 10px 14px; background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
            }
            /* ── Photo / Avatar ── */
            .student-photo {
                width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
                object-fit: cover; border: 2px solid #e2e8f0; background: #e2e8f0;
            }
            .student-avatar {
                width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
                display: flex; align-items: center; justify-content: center;
                font-weight: 800; font-size: 14px; color: white;
                border: 2px solid rgba(255,255,255,0.3);
            }
            .student-info { flex: 1; min-width: 0; }
            .student-info h3 { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
            .student-info p  { font-size: 9.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .student-rate {
                font-size: 16px; font-weight: 800; padding: 5px 14px;
                border-radius: 20px; white-space: nowrap; flex-shrink: 0;
            }

            /* ── Body ── */
            .student-body { padding: 10px 14px; }
            .stats-inline { display: flex; gap: 18px; margin-bottom: 8px; }
            .stat-item    { display: flex; align-items: center; gap: 5px; font-size: 10.5px; }
            .stat-dot     { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
            .dot-present  { background: #22c55e; }
            .dot-late     { background: #f59e0b; }
            .dot-absent   { background: #ef4444; }
            .dot-excused  { background: #8b5cf6; }

            /* ── Progress bar ── */
            .progress-wrap { height: 5px; background: #e2e8f0; border-radius: 99px; margin-bottom: 8px; overflow: hidden; }
            .progress-bar  { height: 100%; border-radius: 99px; }

            /* ── Attendance timeline (fechas por estudiante) ── */
            .att-block { margin-top: 8px; }
            .att-block-label {
                font-size: 9px; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.5px; margin-bottom: 4px;
            }
            .att-dates-row { display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 4px; }
            .att-tag {
                font-size: 8.5px; padding: 2px 7px; border-radius: 4px;
                font-weight: 600;
            }
            .tag-present  { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
            .tag-late     { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
            .tag-absent   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
            .tag-excused  { background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe; }
            .divider { height: 1px; background: #f1f5f9; margin: 6px 0; }

            /* ── Footer ── */
            .footer {
                margin-top: 22px; text-align: center; color: #94a3b8;
                font-size: 9px; border-top: 1px solid #e2e8f0; padding-top: 10px;
            }
            @media print {
                body { padding: 15px 18px; }
                .student-section { break-inside: avoid; }
                .sessions-section { break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <!-- HEADER -->
        <div class="header">
            <div class="header-logo">
                <div class="logo-box">📋</div>
                <div class="header-left">
                    <h1>Reporte de Asistencia</h1>
                    <p><strong>${course?.name || 'Clase'}</strong> &bull; Período ${course?.year || ''}-${course?.period || ''}</p>
                </div>
            </div>
            <div class="header-right">
                <div>Fecha: ${new Date().toLocaleDateString('es-CO')}</div>
                <div>Total Sesiones: <strong>${stats?.total_sessions || 0}</strong></div>
            </div>
        </div>

        <!-- SUMMARY GRID -->
        <div class="summary-grid">
            <div class="summary-box">
                <strong>${stats?.total_students || studentReport.length}</strong>
                <span>Estudiantes</span>
            </div>
            <div class="summary-box">
                <strong>${stats?.total_sessions || 0}</strong>
                <span>Sesiones</span>
            </div>
            <div class="summary-box">
                <strong style="color: ${avgColor.text}">${globalStats.avgRate}%</strong>
                <span>Promedio Asistencia</span>
            </div>
            <div class="summary-box">
                <strong style="color: ${(stats?.alert_count || 0) > 0 ? '#dc2626' : '#16a34a'}">
                    ${stats?.alert_count || 0}
                </strong>
                <span>Alertas (3+ faltas)</span>
            </div>
        </div>

        <!-- SESIONES REALIZADAS -->
        ${sessionsSection}

        <!-- STUDENTS -->
        ${studentReport.map(student => {
        const rc = rateColor(student.attendance_rate);
        const ac = avatarColor(student.first_name);
        const ini = initials(student.first_name, student.last_name);
        const progressColor = student.attendance_rate >= 80 ? '#22c55e'
            : student.attendance_rate >= 60 ? '#f59e0b' : '#ef4444';

        const photoHtml = student.photo
            ? `<img class="student-photo" src="${student.photo}" alt="${student.first_name}" onerror="this.style.display='none';this.nextSibling.style.display='flex';">`
            : '';
        const avatarHtml = `<div class="student-avatar" style="background:${ac}; display:${student.photo ? 'none' : 'flex'}">${ini}</div>`;

        // ── Fechas de presencia ──────────────────────────────────────────
        const presentDatesHtml = student.present_dates?.length > 0
            ? `<div class="att-block">
                   <div class="att-block-label" style="color:#166534">✓ Presencias (${student.present_dates.length})</div>
                   <div class="att-dates-row">
                       ${student.present_dates.map(d => `<span class="att-tag tag-present">${formatDate(d)}</span>`).join('')}
                   </div>
               </div>`
            : '';

        // ── Fechas de tardanza ───────────────────────────────────────────
        const lateDatesHtml = student.late_dates?.length > 0
            ? `<div class="att-block">
                   <div class="att-block-label" style="color:#92400e">⏰ Tardanzas (${student.late_dates.length})</div>
                   <div class="att-dates-row">
                       ${student.late_dates.map(d => `<span class="att-tag tag-late">${formatDate(d)}</span>`).join('')}
                   </div>
               </div>`
            : '';

        // ── Fechas de falta ──────────────────────────────────────────────
        const absentDatesHtml = student.absent_dates?.length > 0
            ? `<div class="att-block">
                   <div class="att-block-label" style="color:#991b1b">✗ Faltas (${student.absent_dates.length})</div>
                   <div class="att-dates-row">
                       ${student.absent_dates.map(d => {
                           const dateStr = typeof d === 'string' ? d : (d.date || '');
                           const hasExcuse = d.has_excuse || d.excuse_status === 'APPROVED';
                           return `<span class="att-tag ${hasExcuse ? 'tag-excused' : 'tag-absent'}">${formatDate(dateStr)}${hasExcuse ? ' ✓' : ''}</span>`;
                       }).join('')}
                   </div>
               </div>`
            : '';

        // ── Fechas excusadas ─────────────────────────────────────────────
        const excusedDatesHtml = student.excused_dates?.length > 0
            ? `<div class="att-block">
                   <div class="att-block-label" style="color:#6d28d9">✓ Excusadas (${student.excused_dates.length})</div>
                   <div class="att-dates-row">
                       ${student.excused_dates.map(d => {
                           const dateStr = typeof d === 'string' ? d : (d.date || '');
                           return `<span class="att-tag tag-excused">${formatDate(dateStr)}</span>`;
                       }).join('')}
                   </div>
               </div>`
            : '';

        const hasDates = presentDatesHtml || lateDatesHtml || absentDatesHtml || excusedDatesHtml;

        return `
            <div class="student-section">
                <div class="student-header">
                    ${photoHtml}${avatarHtml}
                    <div class="student-info">
                        <h3>${student.first_name} ${student.last_name}</h3>
                        <p>
                            Doc: ${student.document_number}
                            ${student.email ? ` &bull; ${student.email}` : ''}
                            ${student.phone_number ? ` &bull; Tel: ${student.phone_number}` : ''}
                        </p>
                    </div>
                    <div class="student-rate" style="background:${rc.bg}; color:${rc.text}; border:1.5px solid ${rc.border}">
                        ${student.attendance_rate}%
                    </div>
                </div>
                <div class="student-body">
                    <div class="progress-wrap">
                        <div class="progress-bar" style="width:${student.attendance_rate}%; background:${progressColor}"></div>
                    </div>
                    <div class="stats-inline">
                        <div class="stat-item"><span class="stat-dot dot-present"></span> <strong>${student.present}</strong>&nbsp;Presentes</div>
                        <div class="stat-item"><span class="stat-dot dot-late"></span> <strong>${student.late}</strong>&nbsp;Tardanzas</div>
                        <div class="stat-item"><span class="stat-dot dot-absent"></span> <strong>${student.absent}</strong>&nbsp;Faltas</div>
                        ${student.excused > 0 ? `<div class="stat-item"><span class="stat-dot dot-excused"></span> <strong>${student.excused}</strong>&nbsp;Excusadas</div>` : ''}
                    </div>
                    ${hasDates ? `<div class="divider"></div>${presentDatesHtml}${lateDatesHtml}${absentDatesHtml}${excusedDatesHtml}` : ''}
                </div>
            </div>`;
    }).join('')}

        <div class="footer">
            Documento generado el ${new Date().toLocaleString('es-CO')} &bull; Sistema de Asistencia UPN &bull; Universidad Pedagógica Nacional
        </div>
        <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
