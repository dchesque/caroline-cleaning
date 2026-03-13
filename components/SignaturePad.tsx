'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface SignaturePadProps {
    onSave?: (signatureDataUrl: string) => void
    onClear?: () => void
    disabled?: boolean
}

export function SignaturePad({ onSave, onClear, disabled = false }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasContent, setHasContent] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Mudar fundo do canvas inicialmente
        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.lineWidth = 2
            ctx.lineCap = 'round'
            ctx.strokeStyle = '#000000'
        }
    }, [])

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            }
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            }
        }
    }

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (disabled) return
        e.preventDefault()
        const { x, y } = getCoordinates(e)
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
            ctx.beginPath()
            ctx.moveTo(x, y)
            setIsDrawing(true)
        }
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || disabled) return
        e.preventDefault()
        const { x, y } = getCoordinates(e)
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
            ctx.lineTo(x, y)
            ctx.stroke()
            setHasContent(true)
        }
    }

    const stopDrawing = () => {
        if (!isDrawing) return
        setIsDrawing(false)
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
            ctx.closePath()
        }
        
        // Auto-save callback
        if (hasContent && onSave && canvasRef.current) {
            onSave(canvasRef.current.toDataURL('image/png'))
        }
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            setHasContent(false)
            if (onClear) onClear()
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white touch-none">
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full max-w-full h-auto object-contain bg-white cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ touchAction: 'none' }}
                />
            </div>
            <div className="flex justify-end">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearCanvas} 
                    disabled={disabled || !hasContent}
                    className="text-muted-foreground gap-2"
                    type="button"
                >
                    <Trash2 className="w-4 h-4" />
                    Limpar Assinatura
                </Button>
            </div>
        </div>
    )
}
