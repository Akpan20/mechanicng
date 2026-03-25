import { useState } from 'react'
import ReactPlayer from 'react-player'

interface VideoDemoProps {
  url: string
  poster?: string
  title?: string
  className?: string
}

export default function VideoDemo({ url, poster, title, className = '' }: VideoDemoProps) {
  const [hasStarted, setHasStarted] = useState(false)

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-surface-900 shadow-xl ${className}`}>
      <ReactPlayer
        url={url}
        controls
        width="100%"
        height="auto"
        playing={hasStarted}
        light={poster ? poster : true}
        config={{
          youtube: { playerVars: { modestbranding: 1, rel: 0 } },
        }}
        style={{ aspectRatio: '16/9' }}
        onPlay={() => setHasStarted(true)}
      />
      {title && (
        <div className="absolute bottom-4 left-4 text-white text-sm font-semibold bg-black/50 px-2 py-1 rounded pointer-events-none">
          {title}
        </div>
      )}
    </div>
  )
}