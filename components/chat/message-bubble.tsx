import { cn } from '@/lib/utils'
import { Message } from '@/hooks/use-chat'
import { format } from 'date-fns'

interface MessageBubbleProps {
    message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user'

    return (
        <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    isUser
                        ? "bg-brandy-rose-500 text-white rounded-tr-sm"
                        : "bg-pot-pourri text-foreground rounded-tl-sm"
                )}
            >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <div className={cn(
                    "text-[10px] mt-1 text-right opacity-70",
                    isUser ? "text-white" : "text-muted-foreground"
                )}>
                    {message.created_at ? format(new Date(message.created_at), 'HH:mm') : ''}
                </div>
            </div>
        </div>
    )
}
