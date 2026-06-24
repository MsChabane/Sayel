'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { Sidebar } from '@/components/admin/Sidebar'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, GripVertical, X, Check, Info, Save
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
import { motion, AnimatePresence } from 'framer-motion'
import { Question, QuestionCreate } from '@/lib/types'

// ── Install command ────────────────────────────────────────────────────────────
// npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers

// ── Validation ─────────────────────────────────────────────────────────────────

const slugRegex = /^[a-z0-9_]{2,120}$/

const questionSchema = z.object({
  title: z.string().min(3, 'العنوان مطلوب (3 أحرف على الأقل)'),
  slug: z
    .string()
    .min(2, 'الـ Slug مطلوب')
    .regex(
      slugRegex,
      'يجب أن يحتوي الـ Slug على حروف إنجليزية صغيرة وأرقام وشرطة سفلية فقط'
    ),
  description: z.string().optional(),
  type: z.string(),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(
    z.object({
      label: z.string().min(1, 'الخيار مطلوب'),
      value: z.string().min(1, 'القيمة مطلوبة'),
      order_index: z.coerce.number(),
    })
  ),
})

type QuestionForm = z.infer<typeof questionSchema>

// ── Constants ──────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  { value: 'text',          label: 'نص قصير' },
  { value: 'textarea',      label: 'نص طويل' },
  { value: 'single_choice', label: 'اختيار واحد' },
  { value: 'multi_choice',  label: 'اختيار متعدد' },
  { value: 'number',        label: 'رقم' },
  { value: 'email',         label: 'بريد إلكتروني' },
  { value: 'phone',         label: 'رقم هاتف' },
  { value: 'date',          label: 'تاريخ' },
]

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u0600-\u06FF\s]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'question'
}

// ── Field helper ───────────────────────────────────────────────────────────────

function Field({
  label, error, children, hint,
}: {
  label: string
  error?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {hint}
        </p>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 ' +
  'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 ' +
  'placeholder-gray-400 dark:placeholder-gray-500 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'

// ── Drag Overlay Card (shown while dragging) ───────────────────────────────────

function DragOverlayCard({ question, index }: { question: Question; index: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5
                    border-2 border-blue-400 dark:border-blue-500
                    flex items-center gap-4 shadow-2xl opacity-95
                    rotate-1 scale-105">
      <div className="text-blue-400 cursor-grabbing">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-lg
                      flex items-center justify-center text-sm font-bold
                      text-blue-600 dark:text-blue-400 flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
          {question.title}
        </p>
        <span className="text-xs font-mono text-gray-400">#{question.slug}</span>
      </div>
    </div>
  )
}

// ── Sortable Question Row ──────────────────────────────────────────────────────

interface SortableRowProps {
  question: Question
  index: number
  isDragging: boolean
  onEdit: (q: Question) => void
  onDelete: (id: number) => void
}

function SortableRow({
  question, index, isDragging, onEdit, onDelete,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging: isThisRowDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Keep the placeholder visible while the item is being dragged
    opacity: isThisRowDragging ? 0.3 : 1,
    zIndex: isThisRowDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-900 rounded-2xl p-5
                  border flex items-center gap-4 group
                  transition-all duration-150
                  ${isThisRowDragging
                    ? 'border-blue-300 dark:border-blue-700 shadow-lg'
                    : 'border-gray-100 dark:border-gray-800 hover:shadow-sm'
                  }`}
    >
      {/* Drag handle — only this element triggers the drag */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={`touch-none flex-shrink-0 p-1 rounded-lg
                    transition-colors select-none
                    ${isDragging
                      ? 'cursor-grabbing text-blue-500'
                      : 'cursor-grab text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'
                    }`}
        title="اسحب لإعادة الترتيب"
        aria-label="اسحب لإعادة الترتيب"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Index badge */}
      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-lg
                      flex items-center justify-center text-sm font-bold
                      text-blue-600 dark:text-blue-400 flex-shrink-0
                      transition-all duration-300">
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
          {question.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950
                           text-blue-600 dark:text-blue-400 rounded-full">
            {QUESTION_TYPES.find((t) => t.value === question.type)?.label}
          </span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800
                           text-gray-500 dark:text-gray-400 rounded-full
                           font-mono flex items-center gap-1">
            <span className="opacity-60">#</span>
            {question.slug}
          </span>
          {!question.is_active && (
            <span className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-950
                             text-red-500 rounded-full">
              معطّل
            </span>
          )}
          {question.required && (
            <span className="text-xs text-gray-400 dark:text-gray-500">إلزامي</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1
                      opacity-0 group-hover:opacity-100 transition-opacity
                      flex-shrink-0">
        <button
          onClick={() => onEdit(question)}
          className="p-2 text-gray-400 hover:text-blue-600
                     hover:bg-blue-50 dark:hover:bg-blue-950
                     rounded-lg transition-colors"
          title="تعديل"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(question.id)}
          className="p-2 text-gray-400 hover:text-red-600
                     hover:bg-red-50 dark:hover:bg-red-950
                     rounded-lg transition-colors"
          title="حذف"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const [questions, setQuestions]         = useState<Question[]>([])
  const [showForm, setShowForm]           = useState(false)
  const [editingId, setEditingId]         = useState<number | null>(null)
  const [loading, setLoading]             = useState(true)
  const [activeId, setActiveId]           = useState<number | null>(null)
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false)
  const [savingOrder, setSavingOrder]     = useState(false)

  // ── Form ────────────────────────────────────────────────────────────────────

  const {
    register, handleSubmit, control, watch,
    reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: { type: 'text', required: true,  options: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'options' })
  const watchedType  = watch('type')
  const watchedTitle = watch('title')
  const needsOptions = watchedType === 'single_choice' || watchedType === 'multi_choice'

  useEffect(() => {
    if (editingId === null && watchedTitle) {
      setValue('slug', titleToSlug(watchedTitle), { shouldValidate: false })
    }
  }, [watchedTitle, editingId, setValue])

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  // PointerSensor   → mouse and stylus
  // TouchSensor     → mobile / tablet
  // KeyboardSensor  → keyboard accessibility

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the pointer to move 8px before starting a drag
      // so normal clicks on buttons still work
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      // Require 250ms hold before drag starts on touch devices
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchQuestions = useCallback(async () => {
    try {
      const data = await api.adminGetQuestions()
      setQuestions(data)
      setHasUnsavedOrder(false)
    } catch {
      toast.error('فشل تحميل الأسئلة')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  // ── Drag handlers ────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    setQuestions((prev) => {
      const oldIndex = prev.findIndex((q) => q.id === active.id)
      const newIndex = prev.findIndex((q) => q.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return prev

      const reordered = arrayMove(prev, oldIndex, newIndex)
      return reordered
    })

    // Mark that we have unsaved order changes
    setHasUnsavedOrder(true)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  // ── Save new order to backend ────────────────────────────────────────────────

  const saveOrder = async () => {
    setSavingOrder(true)
    try {
      const ids = questions.map((q) => q.id)
      await api.reorderQuestions(ids)
      setHasUnsavedOrder(false)
      toast.success('تم حفظ الترتيب الجديد')

      // Refresh to get updated order_index values from server
      await fetchQuestions()
    } catch {
      toast.error('فشل حفظ الترتيب')
      // Revert to server order
      await fetchQuestions()
    } finally {
      setSavingOrder(false)
    }
  }

  const discardOrder = async () => {
    await fetchQuestions()
    toast.info('تم التراجع عن التغييرات')
  }

  // ── Form handlers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    reset({ type: 'text', required: true,  options: [] })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (q: Question) => {
    reset({
      title: q.title,
      slug: q.slug,
      description: q.description ?? '',
      type: q.type,
      required: q.required,
      placeholder: q.placeholder ?? '',
      options: q.options.map((o) => ({
        label: o.label, value: o.value, order_index: o.order_index,
      })),
    })
    setEditingId(q.id)
    setShowForm(true)
  }

  const onSubmit = async (data: QuestionForm) => {
    try {
      if (editingId) {
        await api.updateQuestion(editingId, data as QuestionCreate)
        toast.success('تم تحديث السؤال')
      } else {
        await api.createQuestion(data as QuestionCreate)
        toast.success('تم إضافة السؤال')
      }
      setShowForm(false)
      fetchQuestions()
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return
    try {
      await api.deleteQuestion(id)
      toast.success('تم حذف السؤال')
      fetchQuestions()
    } catch {
      toast.error('فشل حذف السؤال')
    }
  }

  // ── Active question (for drag overlay) ──────────────────────────────────────

  const activeQuestion = activeId
    ? questions.find((q) => q.id === activeId) ?? null
    : null
  const activeIndex = activeQuestion
    ? questions.findIndex((q) => q.id === activeId)
    : -1

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">

        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              إدارة الأسئلة
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              اسحب الأسئلة لإعادة ترتيبها · الـ Slug يُستخدم كعنوان للعمود في Google Sheets
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white
                       rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة سؤال
          </button>
        </div>

        {/* ── Unsaved order banner ── */}
        <AnimatePresence>
          {hasUnsavedOrder && (
            <motion.div
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4"
            >
              <div className="flex items-center justify-between gap-4
                              px-5 py-3 bg-amber-50 dark:bg-amber-950
                              border border-amber-200 dark:border-amber-800
                              rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    تم تغيير الترتيب — لم يُحفظ بعد
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={discardOrder}
                    disabled={savingOrder}
                    className="px-3 py-1.5 text-xs font-medium
                               text-amber-700 dark:text-amber-300
                               hover:bg-amber-100 dark:hover:bg-amber-900
                               rounded-lg transition-colors disabled:opacity-50"
                  >
                    تراجع
                  </button>
                  <button
                    onClick={saveOrder}
                    disabled={savingOrder}
                    className="flex items-center gap-1.5 px-3 py-1.5
                               bg-amber-500 hover:bg-amber-600 text-white
                               rounded-lg text-xs font-medium transition-colors
                               disabled:opacity-50"
                  >
                    {savingOrder ? (
                      <div className="w-3 h-3 border-2 border-white
                                      border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    حفظ الترتيب
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Question Form Modal ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-start
                         justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl
                           shadow-2xl my-8"
              >
                {/* Modal header */}
                <div className="flex items-center justify-between p-6 border-b
                                border-gray-100 dark:border-gray-800">
                  <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    {editingId ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800
                               transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

                  <Field label="نص السؤال *" error={errors.title?.message}>
                    <input
                      {...register('title')}
                      placeholder="مثال: ما اسمك الكريم؟"
                      className={inputCls}
                    />
                  </Field>

                  <Field
                    label="الـ Slug (عنوان عمود Google Sheets) *"
                    error={errors.slug?.message}
                    hint="يجب أن يكون فريداً — حروف إنجليزية صغيرة وأرقام وشرطة سفلية فقط. مثال: client_name"
                  >
                    <input
                      {...register('slug')}
                      placeholder="client_name"
                      dir="ltr"
                      className={`${inputCls} font-mono text-left`}
                    />
                  </Field>

                
                    <Field label="نوع السؤال" error={errors.type?.message}>
                      <select {...register('type')} className={inputCls}>
                        {QUESTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </Field>
                    
                 

                  <Field label="وصف إضافي (اختياري)" error={errors.description?.message}>
                    <textarea
                      {...register('description')}
                      rows={2}
                      placeholder="تفاصيل أو توضيحات تظهر أسفل السؤال..."
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  <Field label="نص التلميح (Placeholder)" error={errors.placeholder?.message}>
                    <input
                      {...register('placeholder')}
                      placeholder="مثال: اكتب اسمك هنا..."
                      className={inputCls}
                    />
                  </Field>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      {...register('required')}
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      إجابة مطلوبة (إلزامي)
                    </span>
                  </label>

                  {needsOptions && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          خيارات الإجابة
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            append({ label: '', value: '', order_index: fields.length })
                          }
                          className="flex items-center gap-1 text-xs text-blue-600
                                     hover:text-blue-700 font-medium"
                        >
                          <Plus className="w-3 h-3" />
                          إضافة خيار
                        </button>
                      </div>
                      <div className="space-y-2">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5 text-center">
                              {index + 1}
                            </span>
                            <input
                              {...register(`options.${index}.label`)}
                              placeholder={`الخيار ${index + 1}`}
                              onChange={(e) => {
                                register(`options.${index}.label`).onChange(e)
                                setValue(`options.${index}.value`, e.target.value)
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200
                                         dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                                         text-gray-800 dark:text-gray-100
                                         focus:outline-none focus:ring-2
                                         focus:ring-blue-500 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {fields.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">
                            لا توجد خيارات بعد. أضف خياراً للبدء.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 py-3
                                 bg-blue-600 text-white rounded-xl font-medium
                                 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent
                                        rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {editingId ? 'حفظ التعديلات' : 'إضافة السؤال'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3 border border-gray-200 dark:border-gray-700
                                 rounded-xl font-medium text-gray-600 dark:text-gray-400
                                 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Question List ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                            rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-600">
            <p className="text-lg mb-2">لا توجد أسئلة</p>
            <p className="text-sm">اضغط على "إضافة سؤال" للبدء</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <SortableRow
                    key={q.id}
                    question={q}
                    index={index}
                    isDragging={activeId !== null}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Drag overlay — renders the card being dragged above everything */}
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: '0.3' } },
                }),
              }}
            >
              {activeQuestion && (
                <DragOverlayCard
                  question={activeQuestion}
                  index={activeIndex}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  )
}