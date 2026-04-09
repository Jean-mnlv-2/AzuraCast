import React, { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { 
  Info, 
  Settings2, 
  GripVertical, 
  Plus,
  Trash2
} from 'lucide-react';

interface ScheduleItem {
  id: number;
  start_time: number;
  end_time: number;
  days: string;
}

interface Playlist {
  id: number;
  name: string;
  type: string;
  is_enabled: boolean;
  playback_order: string;
  weight: number;
  source: string;
  schedule_items: ScheduleItem[];
}

interface VisualSchedulerProps {
  playlists: Playlist[];
  onEdit: (playlist: Playlist) => void;
  onSaveSchedule: (playlistId: number, schedules: ScheduleItem[]) => void;
}

const DAYS = [
  { id: 1, name: 'Lundi' },
  { id: 2, name: 'Mardi' },
  { id: 3, name: 'Mercredi' },
  { id: 4, name: 'Jeudi' },
  { id: 5, name: 'Vendredi' },
  { id: 6, name: 'Samedi' },
  { id: 7, name: 'Dimanche' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getPlaylistColor = (id: number) => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f97316'
  ];
  return colors[id % colors.length];
};

// --- DnD Components ---

const DraggablePlaylistItem: React.FC<{ playlist: Playlist }> = ({ playlist }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `playlist-${playlist.id}`,
    data: { type: 'new-schedule', playlist }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white border shadow-sm mb-2 transition-all cursor-grab ${isDragging ? 'opacity-50' : 'hover-bg-light-soft'}`}
    >
      <GripVertical size={16} className="text-muted-soft" />
      <div 
        className="rounded-circle" 
        style={{ width: '10px', height: '10px', backgroundColor: getPlaylistColor(playlist.id) }}
      ></div>
      <span className="small fw-700 text-main text-truncate">{playlist.name}</span>
    </div>
  );
};

const ScheduledBlock: React.FC<{ 
  playlist: Playlist; 
  item: ScheduleItem; 
  dayId: number;
  onEdit: (p: Playlist) => void;
  onDelete: (pId: number, itemId: number) => void;
}> = ({ playlist, item, dayId, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${playlist.id}-${item.id}-${dayId}`,
    data: { type: 'move-schedule', playlist, item, dayId }
  });

  const startHour = Math.floor(item.start_time / 100);
  const startMin = item.start_time % 100;
  const endHour = Math.floor(item.end_time / 100);
  const endMin = item.end_time % 100;
  
  const rowStart = startHour + 2;
  const rowEnd = endHour + 2;
  const colIndex = dayId + 1;

  let displayRowEnd = rowEnd;
  if (endHour < startHour || (endHour === 0 && startHour > 0)) {
     displayRowEnd = 26;
  }

  const height = (((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60) * 60 - 4;

  return (
    <div 
      ref={setNodeRef}
      className={`bw-scheduler-block rounded-2 p-2 shadow-sm transition-all border border-white border-opacity-25 ${isDragging ? 'opacity-0' : 'hover-elevate cursor-grab'}`}
      style={{
        gridRow: `${rowStart} / ${displayRowEnd + 1}`,
        gridColumn: colIndex,
        marginTop: `${(startMin / 60) * 60}px`,
        height: `${height > 20 ? height : 20}px`,
        marginLeft: '4px',
        marginRight: '4px',
        backgroundColor: getPlaylistColor(playlist.id),
        color: 'white',
        zIndex: 10,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div {...listeners} {...attributes} className="position-absolute top-0 start-0 w-100 h-100" style={{ zIndex: 1 }}></div>
      <div className="position-relative d-flex flex-column h-100" style={{ zIndex: 2 }}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="fw-800 smaller text-truncate pe-2">{playlist.name}</div>
          <div className="d-flex gap-1">
            <button 
              className="btn btn-link p-0 text-white opacity-50 hover-opacity-100" 
              onClick={() => onEdit(playlist)}
            >
              <Settings2 size={10} />
            </button>
            <button 
              className="btn btn-link p-0 text-white opacity-50 hover-opacity-100" 
              onClick={(e) => { e.stopPropagation(); onDelete(playlist.id, item.id); }}
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>
        <div className="fw-600 mt-auto" style={{ fontSize: '9px', opacity: 0.9 }}>
          {String(startHour).padStart(2, '0')}:{String(startMin).padStart(2, '0')} - {String(endHour).padStart(2, '0')}:{String(endMin).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

const GridCell: React.FC<{ dayId: number; hour: number }> = ({ dayId, hour }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${dayId}-${hour}`,
    data: { dayId, hour }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`border-bottom border-end position-relative transition-all ${isOver ? 'bg-primary-soft' : 'bg-white hover-bg-light-soft'}`}
      style={{ height: '60px' }}
    >
      <div className="position-absolute w-100 border-top border-light-soft opacity-50" style={{ top: '30px' }}></div>
    </div>
  );
};

// --- Main Component ---

const VisualScheduler: React.FC<VisualSchedulerProps> = ({ playlists, onEdit, onSaveSchedule }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveData(null);
    const { active, over } = event;

    if (!over) return;

    const overData = over.data.current;
    if (!overData) return;

    const { dayId, hour } = overData;
    const activeData = active.data.current;

    if (activeData?.type === 'new-schedule') {
      const playlist = activeData.playlist;
      const newSchedule: ScheduleItem = {
        id: Math.random(), // Temp ID, backend will provide real one
        start_time: hour * 100,
        end_time: (hour + 1) * 100,
        days: String(dayId)
      };
      
      const existingSchedules = playlist.schedule_items || [];
      onSaveSchedule(playlist.id, [...existingSchedules, newSchedule]);
    } else if (activeData?.type === 'move-schedule') {
      const { playlist, item } = activeData;
      const duration = (item.end_time - item.start_time);
      
      const updatedItem = {
        ...item,
        start_time: hour * 100,
        end_time: (hour * 100) + duration,
        days: String(dayId)
      };

      const otherSchedules = playlist.schedule_items.filter((si: any) => si.id !== item.id);
      onSaveSchedule(playlist.id, [...otherSchedules, updatedItem]);
    }
  };

  const handleDeleteSchedule = (playlistId: number, itemId: number) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      const newSchedules = playlist.schedule_items.filter(si => si.id !== itemId);
      onSaveSchedule(playlistId, newSchedules);
    }
  };

  const scheduledPlaylists = playlists.filter(p => p.schedule_items && p.schedule_items.length > 0);

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      modifiers={[restrictToFirstScrollableAncestor]}
    >
      <div className="bw-scheduler-layout d-flex gap-4 p-4 rounded-4 shadow-sm border bg-white overflow-hidden" style={{ minHeight: '600px' }}>
        
        {/* Sidebar: Available Playlists */}
        <div className="bw-scheduler-sidebar d-flex flex-column gap-3" style={{ width: '220px', flexShrink: 0 }}>
          <div className="p-3 bg-light-soft rounded-3 border border-white-soft">
            <h6 className="fw-800 text-main mb-2 d-flex align-items-center gap-2">
              <Plus size={16} className="text-primary" /> Playlists
            </h6>
            <p className="smaller text-muted-soft mb-3">Glissez une playlist sur la grille pour programmer un horaire.</p>
            <div className="d-flex flex-column">
              {playlists.map(p => (
                <DraggablePlaylistItem key={p.id} playlist={p} />
              ))}
            </div>
          </div>

          <div className="mt-auto p-3 bg-primary-soft rounded-3 border border-primary border-opacity-10">
            <h6 className="fw-800 text-primary mb-1 small d-flex align-items-center gap-2">
              <Info size={14} /> Astuce
            </h6>
            <p className="smaller text-primary opacity-75 mb-0">
              Déplacez les blocs sur la grille pour ajuster les horaires.
            </p>
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-grow-1 overflow-hidden d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-800 text-main mb-0">Planificateur Visuel BantuWave</h5>
              <p className="smaller text-muted-soft mb-0">Ici, vous pouvez visualiser la programmation de votre station sur une grille hebdomadaire. Les playlists programmées s'afficheront sous forme de blocs de couleur.</p>
            </div>
            <div className="d-flex gap-2">
               {scheduledPlaylists.length === 0 && (
                 <span className="badge bg-light-soft text-muted border border-white-soft px-3 py-2 fw-600">
                   Aucune playlist n'a encore d'horaire programmé. Modifiez une playlist ou glissez-en une ici.
                 </span>
               )}
            </div>
          </div>

          <div className="bw-scheduler-grid-wrapper border rounded-4 overflow-auto bg-white shadow-inner custom-scrollbar">
            <div className="bw-scheduler-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '70px repeat(7, 1fr)',
              gridTemplateRows: '45px repeat(24, 60px)',
              minWidth: '800px',
              position: 'relative'
            }}>
              {/* Header Row */}
              <div className="bg-light-soft border-bottom border-end sticky-top z-index-30"></div>
              {DAYS.map(day => (
                <div key={day.id} className="bg-light-soft border-bottom border-end d-flex align-items-center justify-content-center fw-800 text-muted-soft smaller text-uppercase ls-1 sticky-top z-index-30">
                  {day.name}
                </div>
              ))}

              {/* Hour Rows and Droppable Cells */}
              {HOURS.map(hour => (
                <React.Fragment key={hour}>
                  <div className="border-bottom border-end d-flex align-items-start justify-content-center pt-2 fw-700 text-muted-soft smaller bg-light-soft sticky-left">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {DAYS.map(day => (
                    <GridCell key={`${day.id}-${hour}`} dayId={day.id} hour={hour} />
                  ))}
                </React.Fragment>
              ))}

              {/* Absolute Positioned Blocks (Scheduled Items) */}
              {playlists.map(playlist => (
                playlist.schedule_items.map(item => {
                  const days = String(item.days).split(',').map(Number);
                  return days.map(dayId => (
                    <ScheduledBlock 
                      key={`${playlist.id}-${item.id}-${dayId}`} 
                      playlist={playlist} 
                      item={item} 
                      dayId={dayId} 
                      onEdit={onEdit}
                      onDelete={handleDeleteSchedule}
                    />
                  ));
                })
              ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId && activeData ? (
          activeData.type === 'new-schedule' ? (
            <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white border shadow-lg border-primary" style={{ width: '200px' }}>
              <div 
                className="rounded-circle" 
                style={{ width: '10px', height: '10px', backgroundColor: getPlaylistColor(activeData.playlist.id) }}
              ></div>
              <span className="small fw-800 text-main">{activeData.playlist.name}</span>
            </div>
          ) : (
            <div 
              className="rounded-2 p-2 shadow-lg border border-white border-opacity-50"
              style={{
                width: '100px',
                height: '60px',
                backgroundColor: getPlaylistColor(activeData.playlist.id),
                color: 'white',
                opacity: 0.9
              }}
            >
              <div className="fw-800 smaller text-truncate">{activeData.playlist.name}</div>
              <div className="fw-600" style={{ fontSize: '9px' }}>Déplacement...</div>
            </div>
          )
        ) : null}
      </DragOverlay>

      <style>{`
        .bw-scheduler-layout {
          background-color: #f8fafc;
        }
        .bw-scheduler-grid-wrapper {
          max-height: 700px;
        }
        .hover-elevate:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          z-index: 20 !important;
        }
        .sticky-left {
          position: sticky;
          left: 0;
          z-index: 25;
        }
        .z-index-30 { z-index: 30; }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </DndContext>
  );
};

export default VisualScheduler;
