import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface NotesSectionProps {
    notes: string
    onChange: (notes: string) => void
}

export function NotesSection({ notes, onChange }: NotesSectionProps) {
    return (
        <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
                value={notes}
                onChange={e => onChange(e.target.value)}
                placeholder="Observações sobre o agendamento..."
                rows={2}
                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 resize-none"
            />
        </div>
    )
}
