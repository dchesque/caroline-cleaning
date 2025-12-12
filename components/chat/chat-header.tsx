import { Button } from '@/components/ui/button'
import { X, Minimize2, MessageCircle } from 'lucide-react'

interface ChatHeaderProps {
    onClose: () => void
    onMinimize?: () => void
}

export function ChatHeader({ onClose, onMinimize }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between p-4 bg-white border-b border-pampas rounded-t-xl">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pot-pourri flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-brandy-rose-600" />
                </div>
                <div>
                    <h3 className="font-heading font-semibold text-foreground">Carol</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                        Online
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {onMinimize && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onMinimize}>
                        <Minimize2 className="w-4 h-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
