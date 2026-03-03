// utils/pdfExport.js
// Generador de PDF de asistencia. Abre impresión en una nueva ventana del navegador.
// No depende de React — función pura que recibe datos y genera HTML.

import { formatDate } from './dateUtils';

export function generateAttendancePDF({ course, stats, globalStats, studentReport }) {
    const printWindow = window.open('', '_blank');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reporte de Asistencia - ${course?.name || 'Clase'}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; font-size: 11px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #0F4C81; padding-bottom: 15px; }
            .header-left h1 { color: #0F4C81; font-size: 22px; margin-bottom: 3px; }
            .header-left p { color: #64748b; font-size: 12px; }
            .header-right { text-align: right; color: #64748b; font-size: 10px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
            .summary-box strong { display: block; font-size: 24px; color: #0F4C81; }
            .summary-box span { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
            .student-section { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 12px; page-break-inside: avoid; overflow: hidden; }
            .student-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-bottom: 1px solid #e2e8f0; }
            .student-info h3 { font-size: 13px; color: #1e293b; margin-bottom: 2px; }
            .student-info p { font-size: 10px; color: #64748b; }
            .student-rate { font-size: 18px; font-weight: bold; padding: 6px 14px; border-radius: 20px; }
            .rate-good { background: #dcfce7; color: #166534; }
            .rate-warning { background: #fef3c7; color: #92400e; }
            .rate-danger { background: #fee2e2; color: #991b1b; }
            .student-body { padding: 12px 15px; }
            .stats-inline { display: flex; gap: 20px; margin-bottom: 10px; }
            .stat-item { display: flex; align-items: center; gap: 5px; }
            .stat-dot { width: 8px; height: 8px; border-radius: 50%; }
            .dot-present { background: #22c55e; }
            .dot-late { background: #f59e0b; }
            .dot-absent { background: #ef4444; }
            .dates-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
            .date-tag { font-size: 9px; padding: 3px 8px; border-radius: 4px; background: #fee2e2; color: #991b1b; }
            .date-tag.late { background: #fef3c7; color: #92400e; }
            .footer { margin-top: 25px; text-align: center; color: #94a3b8; font-size: 9px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            @media print { body { padding: 15px; } .student-section { break-inside: avoid; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="header-left">
                <h1>📋 Reporte de Asistencia</h1>
                <p><strong>${course?.name || 'Clase'}</strong> &bull; Período ${course?.year}-${course?.period}</p>
            </div>
            <div class="header-right">
                <p>Fecha: ${new Date().toLocaleDateString('es-CO')}</p>
                <p>Total Sesiones: ${stats?.total_sessions || 0}</p>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-box"><strong>${stats?.total_students || 0}</strong><span>Estudiantes</span></div>
            <div class="summary-box"><strong>${stats?.total_sessions || 0}</strong><span>Sesiones</span></div>
            <div class="summary-box"><strong>${globalStats.avgRate}%</strong><span>Promedio Asistencia</span></div>
            <div class="summary-box">
                <strong style="color: ${stats?.alert_count > 0 ? '#dc2626' : '#16a34a'}">
                    ${stats?.alert_count || 0}
                </strong>
                <span>Alertas (3+ fallas)</span>
            </div>
        </div>

        ${studentReport.map(student => {
        const rateClass = student.attendance_rate >= 80 ? 'rate-good'
            : student.attendance_rate >= 50 ? 'rate-warning' : 'rate-danger';
        return `
            <div class="student-section">
                <div class="student-header">
                    <div class="student-info">
                        <h3>${student.first_name} ${student.last_name}</h3>
                        <p>Doc: ${student.document_number}
                           ${student.email ? `• ${student.email}` : ''}
                           ${student.phone_number ? `• Tel: ${student.phone_number}` : ''}
                        </p>
                    </div>
                    <div class="student-rate ${rateClass}">${student.attendance_rate}%</div>
                </div>
                <div class="student-body">
                    <div class="stats-inline">
                        <div class="stat-item"><span class="stat-dot dot-present"></span> ${student.present} Presentes</div>
                        <div class="stat-item"><span class="stat-dot dot-late"></span> ${student.late} Tardanzas</div>
                        <div class="stat-item"><span class="stat-dot dot-absent"></span> ${student.absent} Fallas</div>
                    </div>
                    ${student.absent_dates?.length > 0
                ? `<div><strong style="font-size:10px;color:#dc2626;">Fechas de Fallas:</strong>
                           <div class="dates-row">${student.absent_dates.map(d => `<span class="date-tag">${formatDate(d)}</span>`).join('')}</div></div>`
                : ''}
                    ${student.late_dates?.length > 0
                ? `<div style="margin-top:6px;"><strong style="font-size:10px;color:#d97706;">Fechas de Tardanzas:</strong>
                           <div class="dates-row">${student.late_dates.map(d => `<span class="date-tag late">${formatDate(d)}</span>`).join('')}</div></div>`
                : ''}
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
