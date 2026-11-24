import { Mail, Phone, User, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getMediaUrl } from '../../utils/dateUtils';

export default function ClassIdentityModals({ course, qrOpen, selectedStudent, closeQr, closeStudent }) {
    return (<>
            {/* -- Modal QR -- */}
            {qrOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => closeQr()}>
                    <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => closeQr()} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Código de Acceso</h3>
                        <div className="bg-white p-6 rounded-2xl mb-6 shadow-inner inline-block border-4 border-slate-900">
                            <QRCodeSVG value={`${window.location.origin}/login?code=${course.code}`} size={200} level="H" includeMargin={false} />
                        </div>
                        <div className="bg-upn-50 py-3 px-6 rounded-xl font-mono text-3xl font-black text-upn-900 tracking-widest border border-upn-100">{course.code}</div>
                        <p className="mt-4 text-slate-500 text-sm">Escanea el QR y continúa con Google para unirte a la clase.</p>
                    </div>
                </div>
            )}

            {/* -- Modal foto estudiante -- */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => closeStudent()}>
                    <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="relative aspect-square bg-slate-100">
                            {selectedStudent.photo
                                ? <img src={getMediaUrl(selectedStudent.photo)} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={120} /></div>}
                            <button onClick={() => closeStudent()} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 text-center">
                            <h3 className="text-2xl font-bold text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                            <p className="text-slate-500 font-mono mt-1">{selectedStudent.document_number}</p>
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <a href={`mailto:${selectedStudent.email}`} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Mail size={20} /></a>
                                {selectedStudent.phone_number && <a href={`tel:${selectedStudent.phone_number}`} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"><Phone size={20} /></a>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

    </>);
}
