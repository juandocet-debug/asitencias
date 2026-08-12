import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Box, Gamepad2, Loader2, Plus, Search, Sparkles, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/ui/Toast';
import MissionManager from '../components/classDetails/MissionManager';

export default function Missions() {
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    const courseId = params.get('course');
    if (!courseId || !courses.length || nodes.length) return;
    const course = courses.find(item => String(item.id) === String(courseId));
    if (course) addCampaignNode(course);
  }, [courses, params, nodes.length]);

  const filteredCourses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter(course => `${course.name} ${course.code}`.toLowerCase().includes(term));
  }, [courses, query]);

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

  const addCampaignNode = (course) => {
    const nextNode = {
      id: `campaign-${course.id}`,
      type: 'campaign',
      title: course.name,
      subtitle: `Código ${course.code}`,
      courseId: course.id,
      course,
    };
    setNodes(prev => prev.some(item => item.id === nextNode.id) ? prev : [...prev, nextNode]);
    setParams({ course: course.id });
    setActiveNode(nextNode);
    setPickerOpen(false);
    setQuery('');
  };

  return (
    <main className="relative -m-4 min-h-[calc(100vh-4rem)] overflow-hidden bg-[#050219] font-['Montserrat'] text-white md:m-0 md:rounded-[2rem]">
      <NeonBackdrop />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <section className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col">
        <StudioTopBar onAdd={() => setPickerOpen(true)} nodes={nodes} />

        {loading ? (
          <LoadingState />
        ) : courses.length === 0 ? (
          <EmptyState />
        ) : (
          <FlowCanvas nodes={nodes} onAdd={() => setPickerOpen(true)} onSelect={setActiveNode} />
        )}
      </section>

      {pickerOpen && (
        <CampaignPicker
          courses={filteredCourses}
          query={query}
          setQuery={setQuery}
          onClose={() => setPickerOpen(false)}
          onSelect={addCampaignNode}
        />
      )}

      {activeNode && (
        <NodeConfigurator node={activeNode} onClose={() => setActiveNode(null)} showToast={showToast} />
      )}
    </main>
  );
}

function StudioTopBar({ nodes, onAdd }) {
  return (
    <header className="flex items-center justify-between border-b border-[#ccff00]/20 bg-[#08091f]/95 px-4 py-3 shadow-[0_4px_30px_rgba(204,255,0,0.10)] backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ccff00] text-slate-950 shadow-[0_0_25px_rgba(204,255,0,0.55)]">
          <Gamepad2 size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ccff00]">Make gamer</p>
          <h1 className="text-sm font-black uppercase md:text-lg">Mapa de campañas y misiones</h1>
        </div>
      </div>
      <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full bg-[#ccff00] px-4 py-2 text-xs font-black text-slate-950 shadow-[0_0_25px_rgba(204,255,0,0.35)]">
        <Plus size={16} /> Agregar
      </button>
      <span className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black text-violet-100/70 md:inline">
        {nodes.length} nodos activos
      </span>
    </header>
  );
}

function FlowCanvas({ nodes, onAdd, onSelect }) {
  if (!nodes.length) {
    return (
      <div className="relative grid flex-1 place-items-center p-6">
        <div className="text-center">
          <button
            onClick={onAdd}
            className="group mx-auto grid h-32 w-32 place-items-center rounded-full border-4 border-[#ccff00] bg-[#ccff00] text-slate-950 shadow-[0_0_70px_rgba(204,255,0,0.55)] transition hover:scale-105"
          >
            <Plus size={68} strokeWidth={4} className="transition group-hover:rotate-90" />
          </button>
          <p className="mt-5 rounded-full border border-[#ccff00]/30 bg-black/60 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ccff00]">
            Empieza creando una campaña
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-violet-100/60">
            El sistema te irá preguntando la clase, campaña, misión, recursos y objetos para armar el mapa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-auto p-6">
      <GridLines />
      <div className="relative z-10 flex min-h-[28rem] min-w-[48rem] items-center gap-8">
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <FlowNode node={node} index={index} onSelect={() => onSelect(node)} />
            {index < nodes.length - 1 && <Connector />}
          </React.Fragment>
        ))}
        <button onClick={onAdd} className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#ccff00] bg-[#ccff00] text-slate-950 shadow-[0_0_35px_rgba(204,255,0,0.45)]">
          <Plus size={32} strokeWidth={4} />
        </button>
      </div>
    </div>
  );
}

function FlowNode({ node, index, onSelect }) {
  const Icon = node.type === 'campaign' ? BookOpen : Box;
  return (
    <button onClick={onSelect} className="group relative flex w-56 flex-col items-center gap-3 rounded-[2rem] border border-[#ccff00]/35 bg-black/65 p-4 text-center shadow-[0_0_35px_rgba(124,76,255,0.22)] transition hover:-translate-y-1 hover:border-[#ccff00]">
      <span className="absolute -top-3 right-4 rounded-full border border-[#ccff00]/50 bg-[#050219] px-3 py-1 text-[10px] font-black text-[#ccff00]">#{index + 1}</span>
      <span className="grid h-20 w-20 place-items-center rounded-full bg-[#ccff00] text-slate-950 shadow-[0_0_35px_rgba(204,255,0,0.55)]">
        <Icon size={36} />
      </span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ccff00]">Campaña</p>
        <h3 className="mt-1 text-base font-black leading-tight">{node.title}</h3>
        <p className="mt-1 text-xs font-bold text-violet-100/60">{node.subtitle}</p>
      </div>
      <span className="rounded-full bg-white px-4 py-2 text-[11px] font-black text-slate-950">Configurar</span>
    </button>
  );
}

function CampaignPicker({ courses, query, setQuery, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[2rem] border border-[#ccff00]/40 bg-[#08091f] p-5 shadow-[0_0_60px_rgba(204,255,0,0.20)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ccff00]">Nuevo nodo</p>
            <h2 className="text-xl font-black">¿Qué campaña vas a configurar?</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/10 p-2 text-violet-100"><X size={18} /></button>
        </div>
        <label className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
          <Search size={17} className="text-[#ccff00]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Buscar clase o código..." className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-violet-100/35" />
        </label>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {courses.map(course => (
            <button key={course.id} onClick={() => onSelect(course)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-[#ccff00] hover:bg-[#ccff00]/10">
              <span>
                <span className="block text-sm font-black">{course.name}</span>
                <span className="text-xs font-bold text-violet-100/55">Código {course.code} · {course.students?.length || 0} estudiantes</span>
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#ccff00] text-slate-950"><Plus size={18} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NodeConfigurator({ node, onClose, showToast }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/82 p-4 backdrop-blur-md">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-[#ccff00]/35 bg-[#08091f] p-5 shadow-[0_0_70px_rgba(124,76,255,0.25)]">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ccff00]">Configurador del nodo</p>
            <h2 className="text-xl font-black">{node.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/10 p-2 text-violet-100"><X size={20} /></button>
        </div>
        <MissionManager courseId={node.courseId} showToast={showToast} />
      </div>
    </div>
  );
}

function Connector() {
  return <div className="h-1 w-20 rounded-full bg-[#ccff00] shadow-[0_0_18px_rgba(204,255,0,0.75)]" />;
}

function GridLines() {
  return <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(204,255,0,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(139,109,255,0.12)_1px,transparent_1px)] [background-size:34px_34px]" />;
}

function NeonBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(204,255,0,0.14),transparent_28%),radial-gradient(circle_at_86%_6%,rgba(139,109,255,0.30),transparent_32%),linear-gradient(135deg,#09051e_0%,#071022_55%,#0b081c_100%)]" />
      <div className="absolute -right-16 top-16 h-48 w-48 rounded-full bg-[#ccff00]/20 blur-3xl" />
      <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-[#7657f6]/25 blur-3xl" />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-[#ccff00]" size={42} />
        <p className="mt-3 text-sm font-black uppercase tracking-[0.25em] text-violet-100/70">Cargando mapa</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid flex-1 place-items-center p-6 text-center">
      <div>
        <Sparkles className="mx-auto text-[#ccff00]" size={42} />
        <h2 className="mt-3 text-2xl font-black">No hay clases para configurar</h2>
        <p className="mt-2 text-sm text-violet-100/65">Crea una clase primero y vuelve al mapa de misiones.</p>
      </div>
    </div>
  );
}
