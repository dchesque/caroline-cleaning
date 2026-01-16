import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface NotesSectionProps {
    notes: string
    onChange: (notes: string) => void
}

export function NotesSection({ notes, onChange }: NotesSectionProps) {
    const { t } = useAdminI18n()
    const agendaT = t('agenda')

    return (
        <div className="space-y-2">
            <Label>{agendaT.form?.notes}</Label>
            <Textarea
                value={notes}
                onChange={e => onChange(e.target.value)}
                placeholder={agendaT.form?.notesPlaceholder}
                rows={2}
                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none"
            />
        </div>
    )
}
