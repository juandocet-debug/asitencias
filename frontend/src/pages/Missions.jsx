import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Gamepad2, Loader2, Search, Sparkles, Trophy, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/ui/Toast';
import MissionManager from '../components/classDetails/MissionManager';

export default function Missions() {
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  const selectedId = params.get('course');
  const selectedCourse = useMemo(() => {
    if (!courses.length) return null;
    return courses.find(course => String(course.id) === String(selectedId)) || courses[0];
  }, [courses, selectedId]);

  const filteredCourses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter(course => `${course.name} ${course.code}`.toLowerCase().includes(term));
  }, [courses, query]);

  useEffect(() => {
    if (!selectedId && selectedCourse) setParams({ course: selectedCourse.id });
  }, [selectedCourse, selectedId, setParams]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/academic/courses/');
      const list = Array.isArray(data) ? data : data.results || [];
      setCourses(list.filter(course => !course.is_archived));
    } catch {
      showToast('No se pudieron cargar tus clases', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative -m-4 min-h-[calc(100vh-4rem)] overflow-hidden bg-[#050219] p-4 pb-24 font-['Montserrat'] text-white md:m-0 md:rounded-[2rem] md:p-6">
      <NeonBackdrop />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <section className="relative z-10 mx-auto max-w-7xl space-y-5">
        <StudioHero courses={courses} />

        {loading ? (
          <LoadingState />
        ) : courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[20rem_1fr]">
            <aside className="space-y-4">
              <SearchBox value={query} onChange={setQuery} />
              <CourseSelector courses={filteredCourses} selectedId={selectedCourse?.id} onSelect={(course) => setParams({ course: course.id })} />
            </aside>
            <section className="space-y-4">
              <SelectedCourseCard course={selectedCourse} />
              <MissionManager courseId={selectedCourse.id} showToast={showToast} />
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function NeonBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(204,255,0,0.14),transparent_28%),radial-gradient(circle_at_86%_6%,rgba(139,109,255,0.30),transparent_32%),linear-gradient(135deg,#09051e_0%,#071022_55%,#0b081c_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(204,255,0,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(139,109,255,0.12)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute -right-16 top-16 h-48 w-48 rounded-full bg-[#ccff00]/20 blur-3xl" />
      <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-[#7657f6]/25 blur-3xl" />
    </div>
  );
}

function StudioHero({ courses }) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-[#ccff00]/25 bg-black/45 p-5 shadow-[0_0_45px_rgba(124,76,255,0.22)] backdrop-blur">
      <div className="absolute right-4 top-4 hidden rounded-3xl border border-[#ccff00]/25 bg-[#ccff00]/10 p-4 sm:block">
        <Gamepad2 className="text-[#ccff00]" size={38} />
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#ccff00]">Studio de campaña</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight md:text-5xl">Misiones, objetos, cartas y recursos.</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold text-violet-100/75">
        Elige una clase y configura la experiencia gamer que verá el estudiante: portada, personaje, lore, grupos, recompensa y materiales.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <HeroChip icon={BookOpen} label={`${courses.length} clases`} />
        <HeroChip icon={Users} label="Grupos por asistencia" />
        <HeroChip icon={Trophy} label="Inventario y premios" />
      </div>
    </header>
  );
}

function HeroChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black">
      <Icon size={15} className="text-[#ccff00]" /> {label}
    </span>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-3xl border border-white/10 bg-black/40 px-4 py-3">
      <Search size={17} className="text-[#ccff00]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar clase o código..."
        className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-violet-100/35"
      />
    </label>
  );
}

function CourseSelector({ courses, selectedId, onSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {courses.map(course => (
        <button
          key={course.id}
          type="button"
          onClick={() => onSelect(course)}
          className={`group rounded-3xl border p-4 text-left transition ${String(selectedId) === String(course.id)
            ? 'border-[#ccff00] bg-[#ccff00]/12 shadow-[0_0_28px_rgba(204,255,0,0.20)]'
            : 'border-white/10 bg-white/[0.06] hover:border-[#ccff00]/50'}`}
        >
          <span className="text-sm font-black">{course.name}</span>
          <span className="mt-1 block text-xs font-bold text-violet-100/60">{course.year}-{course.period}</span>
          <span className="mt-3 inline-flex rounded-full bg-black/35 px-3 py-1 text-[11px] font-black text-[#ccff00]">#{course.code}</span>
        </button>
      ))}
    </div>
  );
}

function SelectedCourseCard({ course }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ccff00]">Clase seleccionada</p>
          <h2 className="mt-1 text-2xl font-black">{course.name}</h2>
          <p className="text-sm font-semibold text-violet-100/65">
            Código {course.code} · {course.students?.length || 0} estudiantes · periodo {course.year}-{course.period}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ccff00]/25 bg-[#ccff00]/10 px-4 py-3 text-sm font-black text-[#ccff00]">
          Modo creador activo
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="relative z-10 grid min-h-72 place-items-center rounded-[2rem] border border-white/10 bg-black/35">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-[#ccff00]" size={42} />
        <p className="mt-3 text-sm font-black uppercase tracking-[0.25em] text-violet-100/70">Cargando misiones</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative z-10 rounded-[2rem] border border-white/10 bg-black/40 p-8 text-center">
      <Sparkles className="mx-auto text-[#ccff00]" size={42} />
      <h2 className="mt-3 text-2xl font-black">No hay clases para configurar</h2>
      <p className="mt-2 text-sm text-violet-100/65">Crea una clase primero y vuelve a este centro de misiones.</p>
    </div>
  );
}
