/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const ScheduleModal = ({ isOpen, onClose, course, onSave }) => {
    const [schedule, setSchedule] = useState([{ day: 'MON', start: '08:00', end: '10:00' }]);

    useEffect(() => {
        if (course?.all_schedules && course.all_schedules.length > 0) {
            setSchedule(course.all_schedules);
        } else if (course?.schedule && Array.isArray(course.schedule) && course.schedule.length > 0) {
            // Manejar caso donde el campo se llama 'schedule' directamente
            setSchedule(course.schedule);
        } else {
            setSchedule([{ day: 'MON', start: '08:00', end: '10:00' }]);
        }
    }, [course]);

    const handleChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index][field] = value;
        setSchedule(newSchedule);
    };

    const addSlot = () => {
        setSchedule([...schedule, { day: 'MON', start: '08:00', end: '10:00' }]);
    };

    const removeSlot = (index) => {
        const newSchedule = schedule.filter((_, i) => i !== index);
        setSchedule(newSchedule);
    };

    const handleSave = () => {
        onSave(course.id, schedule);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Programar Horario</h3>
                        <p className="text-sm text-slate-500">{course?.name} ({course?.code})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {schedule.map((slot, index) => (
                        <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <select
                                value={slot.day}
                                onChange={(e) => handleChange(index, 'day', e.target.value)}
                                className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 flex-1"
                            >
                                <option value="MON">Lunes</option>
                                <option value="TUE">Martes</option>
                                <option value="WED">Miércoles</option>
                                <option value="THU">Jueves</option>
                                <option value="FRI">Viernes</option>
                                <option value="SAT">Sábado</option>
                                <option value="SUN">Domingo</option>
                            </select>
                            <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => handleChange(index, 'start', e.target.value)}
                                className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 w-24"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => handleChange(index, 'end', e.target.value)}
                                className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 w-24"
                            />
                            <button onClick={() => removeSlot(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <button onClick={addSlot} className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700">
                    <Plus size={16} /> Agregar horario
                </button>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all">
                        Guardar Horario
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
