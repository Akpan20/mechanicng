import { useState, useRef } from 'react'

interface VideoDemoProps {
  url: string
  poster?: string
  title?: string
  className?: string
}

export default function VideoDemo({ url, poster, title, className = '' }: VideoDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const getEmbedUrl = (autoplay = false) => {
    const baseUrl = url
      .trim()
      .replace('watch?v=', 'embed/')
      .replace('youtu.be/', 'youtube.com/embed/')
    
    const separator = baseUrl.includes('?') ? '&' : '?'
    const params = [
      'rel=0',
      'modestbranding=1',
      autoplay ? 'autoplay=1' : '',
      'enablejsapi=1',
    ].filter(Boolean).join('&')
    
    return `${baseUrl}${separator}${params}`
  }

  const handlePlay = () => setIsPlaying(true)

  const handlePause = () => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'pauseVideo' }),
      '*'
    )
    setIsPlaying(false)
  }

  const handleStop = () => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'stopVideo' }),
      '*'
    )
    setIsPlaying(false)
  }

  return (
    // VideoDemo.tsx
    <div className={`relative rounded-xl overflow-hidden bg-surface-900 shadow-lg max-w-2xl mx-auto ${className}`}>
      <div className="aspect-video relative">
        
        {!isPlaying && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer group"
            onClick={handlePlay}
          >
            {poster ? (
              <img 
                src={poster} 
                alt={title || 'Video thumbnail'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
            )}
            
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                className="w-12 h-12 rounded-full bg-brand-500/90 hover:bg-brand-500 hover:scale-110 transition-all duration-200 flex items-center justify-center shadow-xl"
                aria-label="Play video"
              >
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            
            {title && (
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white font-medium text-xs line-clamp-1">{title}</p>
              </div>
            )}
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={getEmbedUrl(isPlaying)}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      <div className="flex items-center justify-center gap-2 p-2 bg-surface-800 border-t border-gray-700">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            Pause
          </button>
        )}
        
        <button
          onClick={handleStop}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
          Stop
        </button>
      </div>
    </div>
  )
}