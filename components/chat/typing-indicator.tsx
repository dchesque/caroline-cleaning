export function TypingIndicator() {
    return (
        <div className="flex w-full mb-4 justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-pot-pourri rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm flex items-center gap-1.5 min-h-[44px]">
                <div className="w-1.5 h-1.5 bg-brandy-rose-400 rounded-full animate-bounce [animation-delay:-0.32s]" />
                <div className="w-1.5 h-1.5 bg-brandy-rose-400 rounded-full animate-bounce [animation-delay:-0.16s]" />
                <div className="w-1.5 h-1.5 bg-brandy-rose-400 rounded-full animate-bounce" />
            </div>
        </div>
    )
}
