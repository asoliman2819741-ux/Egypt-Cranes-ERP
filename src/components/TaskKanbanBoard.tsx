import React, { useState } from 'react';
import { TaskAssignment, Crane, MaintenanceOrder } from '../types';
import { 
  Plus, Search, Clock, CheckCircle2, User, Wrench, AlertCircle, 
  Calendar, ArrowRightLeft, Eye, MessageSquare, Filter, 
  Sparkles, Check, ChevronDown, Tag, GripVertical
} from 'lucide-react';

interface TaskKanbanBoardProps {
  tasks: TaskAssignment[];
  onAddTask?: (task: TaskAssignment) => void;
  onUpdateTask?: (id: string, updated: Partial<TaskAssignment>) => void;
  cranes?: Crane[];
  maintenanceOrders?: MaintenanceOrder[];
}

type ColumnStatus = 'pending' | 'in_progress' | 'completed';

export default function TaskKanbanBoard({
  tasks,
  onAddTask,
  onUpdateTask,
  cranes = [],
  maintenanceOrders = []
}: TaskKanbanBoardProps) {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [craneFilter, setCraneFilter] = useState<string>('all');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnStatus | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskAssignment | null>(null);
  const [showCompletionNotesModal, setShowCompletionNotesModal] = useState<{ taskId: string; taskTitle: string } | null>(null);
  const [completionNotesText, setCompletionNotesText] = useState('');

  // Form state for new task
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('ياسر حسن (مهندس الصيانة)');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newStatus, setNewStatus] = useState<ColumnStatus>('pending');
  const [newDueDate, setNewDueDate] = useState('2026-08-15');
  const [selectedCraneId, setSelectedCraneId] = useState<string>('');

  // Filtering tasks
  const filteredTasks = tasks.filter(t => {
    // Treat 'overdue' as pending for Kanban columns, but keep original flag
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.taskNo.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedToEmpName.toLowerCase().includes(search.toLowerCase()) ||
      (t.relatedEntityName && t.relatedEntityName.toLowerCase().includes(search.toLowerCase()));

    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCrane = craneFilter === 'all' || (t.relatedEntityName && t.relatedEntityName.includes(craneFilter));

    return matchesSearch && matchesPriority && matchesCrane;
  });

  const getTasksByStatus = (status: ColumnStatus) => {
    return filteredTasks.filter(t => {
      if (status === 'pending') {
        return t.status === 'pending' || t.status === 'overdue';
      }
      return t.status === status;
    });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: ColumnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colStatus) {
      setDragOverColumn(colStatus);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ColumnStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggedTaskId(null);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    changeTaskStatus(taskId, targetStatus);
  };

  const changeTaskStatus = (taskId: string, targetStatus: ColumnStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (targetStatus === 'completed' && task.status !== 'completed') {
      // Prompt for completion notes or open modal
      setShowCompletionNotesModal({ taskId: task.id, taskTitle: task.title });
      setCompletionNotesText(task.completionNotes || 'تم تنفيذ المهمة وفحص المعدة واختبار التشغيل بنجاح.');
      return;
    }

    const updatedData: Partial<TaskAssignment> = {
      status: targetStatus
    };

    if (onUpdateTask) {
      onUpdateTask(taskId, updatedData);
    }
  };

  const handleSaveCompletionNotes = () => {
    if (!showCompletionNotesModal) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    if (onUpdateTask) {
      onUpdateTask(showCompletionNotesModal.taskId, {
        status: 'completed',
        completionNotes: completionNotesText,
        completedAt: nowStr
      });
    }

    setShowCompletionNotesModal(null);
    setCompletionNotesText('');
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const craneObj = cranes.find(c => c.id === selectedCraneId);
    const relatedName = craneObj ? craneObj.nameAr : 'صيانة المعدات العامة بالورشة';

    const newTaskObj: TaskAssignment = {
      id: `task-${Date.now()}`,
      taskNo: `TSK-2026-${String(tasks.length + 1).padStart(3, '0')}`,
      title: newTitle,
      description: newDescription || 'مهمة صيانة دورية وفحص فني محدد.',
      assignedToEmpId: 'emp3',
      assignedToEmpName: newAssignedTo,
      assignedBy: 'م. إبراهيم فوزي (إدارة الصيانة)',
      relatedType: 'maintenance',
      relatedEntityId: selectedCraneId || 'm1',
      relatedEntityName: relatedName,
      dueDate: newDueDate,
      priority: newPriority,
      status: newStatus
    };

    if (onAddTask) {
      onAddTask(newTaskObj);
    }

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const columnsConfig: { status: ColumnStatus; title: string; subtitle: string; bgHeader: string; badgeBg: string; textColor: string; borderColor: string; icon: any }[] = [
    {
      status: 'pending',
      title: 'قيد الانتظار',
      subtitle: 'المهام المعلقة والمجدولة لبدء التنفيذ',
      bgHeader: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeBg: 'bg-amber-500 text-white',
      textColor: 'text-amber-800 dark:text-amber-300',
      borderColor: 'border-amber-200 dark:border-amber-800/60',
      icon: Clock
    },
    {
      status: 'in_progress',
      title: 'قيد التنفيذ والعمل',
      subtitle: 'المهام التي يعمل عليها المهندسون والفنيون حالياً',
      bgHeader: 'bg-sky-500/10 dark:bg-sky-500/20',
      badgeBg: 'bg-sky-600 text-white',
      textColor: 'text-sky-800 dark:text-sky-300',
      borderColor: 'border-sky-200 dark:border-sky-800/60',
      icon: ArrowRightLeft
    },
    {
      status: 'completed',
      title: 'مكتملة ومغلقة',
      subtitle: 'المهام التي تم إنهاؤها واختبار جودتها بنجاح',
      bgHeader: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeBg: 'bg-emerald-600 text-white',
      textColor: 'text-emerald-800 dark:text-emerald-300',
      borderColor: 'border-emerald-200 dark:border-emerald-800/60',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="space-y-6">

      {/* Header & Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0F4C81]/10 text-[#0F4C81] dark:text-sky-400 rounded-xl">
              <GripVertical className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                لوحة كانبان لمهام الصيانة (Maintenance Tasks Kanban)
                <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-sky-950 text-[#0F4C81] dark:text-sky-300 rounded-full text-xs font-bold border border-sky-200 dark:border-sky-800">
                  {tasks.length} مهمة إجمالاً
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                يمكنك سحب وإفلات البطاقات بين الأعمدة لتحديث حالة تنفيذ المهام فورياً
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#0F4C81] hover:bg-[#0c3d67] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer self-stretch md:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>إسناد مهمة صيانة جديدة</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم المهمة، العنوان، اسم المهندس أو معدة الصيانة..."
            className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500 dark:text-slate-400 ml-1">الأولوية:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">كافة الأولويات</option>
              <option value="high">عالية 🔥</option>
              <option value="medium">متوسطة ⚡</option>
              <option value="low">منخفضة 📌</option>
            </select>
          </div>

          {/* Crane filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500 dark:text-slate-400 ml-1">المعدة:</span>
            <select
              value={craneFilter}
              onChange={(e) => setCraneFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer max-w-[160px]"
            >
              <option value="all">كافة المعدات والأوناش</option>
              {cranes.map(c => (
                <option key={c.id} value={c.nameAr}>{c.nameAr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columnsConfig.map((col) => {
          const colTasks = getTasksByStatus(col.status);
          const isDragOver = dragOverColumn === col.status;
          const ColumnIcon = col.icon;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[550px] ${
                isDragOver 
                  ? 'border-2 border-dashed border-sky-500 bg-sky-500/10 shadow-lg scale-[1.01]' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40'
              }`}
            >
              {/* Column Header */}
              <div className={`p-4 rounded-t-2xl border-b ${col.borderColor} ${col.bgHeader} flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${col.badgeBg}`}>
                    <ColumnIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-black ${col.textColor} flex items-center gap-1.5`}>
                      <span>{col.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black ${col.badgeBg}`}>
                        {colTasks.length}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {col.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tasks List Drop Area */}
              <div className="p-3 flex-1 space-y-3 overflow-y-auto max-h-[700px]">
                {colTasks.length === 0 ? (
                  <div className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-slate-400 font-bold">لا توجد مهام حالياً في هذا العمود</p>
                    <p className="text-[10px] text-slate-400 mt-1">اسحب أي بطاقة مهمة وأسقطها هنا لنقلها</p>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isBeingDragged = draggedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative group ${
                          isBeingDragged ? 'opacity-40 scale-95 ring-2 ring-[#0F4C81]' : ''
                        }`}
                      >
                        {/* Task Top Row: Number & Priority */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-[11px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                            {task.taskNo}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {task.priority === 'high' && (
                              <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-[10px] font-black flex items-center gap-1">
                                🔥 عالية جداً
                              </span>
                            )}
                            {task.priority === 'medium' && (
                              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-[10px] font-black flex items-center gap-1">
                                ⚡ متوسطة
                              </span>
                            )}
                            {task.priority === 'low' && (
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-bold">
                                📌 منخفضة
                              </span>
                            )}

                            {task.status === 'overdue' && (
                              <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black animate-pulse">
                                متأخرة!
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-relaxed mb-1.5">
                          {task.title}
                        </h5>

                        {/* Description */}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-normal mb-3 font-medium">
                          {task.description}
                        </p>

                        {/* Equipment Tag if available */}
                        {task.relatedEntityName && (
                          <div className="mb-3 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-800/60 rounded-lg text-[11px] font-extrabold text-[#0F4C81] dark:text-sky-300 flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-sky-600 shrink-0" />
                            <span className="truncate">{task.relatedEntityName}</span>
                          </div>
                        )}

                        {/* Bottom Row: Assigned User, Due Date, View button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[130px]">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{task.assignedToEmpName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px]">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{task.dueDate}</span>
                            </div>

                            <button
                              onClick={() => setSelectedTaskDetail(task)}
                              className="p-1 text-slate-400 hover:text-[#0F4C81] dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title="عرض التفاصيل الكاملة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile / Direct Status Changer Controls */}
                        <div className="mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700/50 flex items-center justify-between gap-1 text-[10px]">
                          <span className="text-slate-400 font-medium">تغيير الحالة:</span>
                          <div className="flex items-center gap-1">
                            {col.status !== 'pending' && (
                              <button
                                onClick={() => changeTaskStatus(task.id, 'pending')}
                                className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-md font-bold transition-colors cursor-pointer"
                              >
                                ← انتظار
                              </button>
                            )}
                            {col.status !== 'in_progress' && (
                              <button
                                onClick={() => changeTaskStatus(task.id, 'in_progress')}
                                className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-md font-bold transition-colors cursor-pointer"
                              >
                                {col.status === 'pending' ? 'بدء التنفيذ ←' : '← تنفيذ'}
                              </button>
                            )}
                            {col.status !== 'completed' && (
                              <button
                                onClick={() => changeTaskStatus(task.id, 'completed')}
                                className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-md font-bold transition-colors cursor-pointer"
                              >
                                إكتمال ✓
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Task */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#0F4C81] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-300" />
                <h4 className="font-bold text-base">إسناد مهمة صيانة جديدة</h4>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان المهمة *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: فحص طلمبة الهيدروليك والزيوت للونش LTM 1100"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تفاصيل ووصف العمل المطلوبة
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="ادخل الشرح الفني والتوجيهات الخاصة بالمهمة..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المسؤول عن التنفيذ (المهندس/الفني)
                  </label>
                  <input
                    type="text"
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المعدة أو الأوناش ذات الصلة
                  </label>
                  <select
                    value={selectedCraneId}
                    onChange={(e) => setSelectedCraneId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0F4C81] cursor-pointer"
                  >
                    <option value="">صيانة ورشة عامة</option>
                    {cranes.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    درجة الأولوية
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
                  >
                    <option value="high">عالية 🔥</option>
                    <option value="medium">متوسطة ⚡</option>
                    <option value="low">منخفضة 📌</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الحالة المبدئية
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">مكتملة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الاستحقاق
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F4C81] hover:bg-[#0c3d67] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  إضافة وإسناد المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Task Details */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-400" />
                <div>
                  <h4 className="font-bold text-sm">{selectedTaskDetail.taskNo}</h4>
                  <p className="text-[11px] text-slate-300">{selectedTaskDetail.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTaskDetail(null)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">وصف المهمة:</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedTaskDetail.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] font-bold">المسؤول عن التنفيذ:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                    {selectedTaskDetail.assignedToEmpName}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] font-bold">المكلف بالمهمة:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                    {selectedTaskDetail.assignedBy}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] font-bold">تاريخ الاستحقاق:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                    {selectedTaskDetail.dueDate}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] font-bold">درجة الأولوية:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                    {selectedTaskDetail.priority === 'high' ? 'عالية 🔥' : selectedTaskDetail.priority === 'medium' ? 'متوسطة ⚡' : 'منخفضة 📌'}
                  </span>
                </div>
              </div>

              {selectedTaskDetail.relatedEntityName && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-[#0F4C81] dark:text-sky-300 font-bold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-sky-600" />
                  <span>المعدة: {selectedTaskDetail.relatedEntityName}</span>
                </div>
              )}

              {selectedTaskDetail.completionNotes && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ملاحظات إغلاق المهمة ({selectedTaskDetail.completedAt || ''}):</span>
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                    {selectedTaskDetail.completionNotes}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Completion Notes prompt */}
      {showCompletionNotesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <h4 className="font-bold text-sm">إغلاق وتأكيد اكتمال المهمة</h4>
              </div>
              <button 
                onClick={() => setShowCompletionNotesModal(null)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                المهمة: {showCompletionNotesModal.taskTitle}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  ملاحظات الفحص ونتائج التشغيل بعد الصيانة:
                </label>
                <textarea
                  rows={3}
                  value={completionNotesText}
                  onChange={(e) => setCompletionNotesText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCompletionNotesModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompletionNotes}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  تأكيد الإغلاق واكتمال المهمة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
