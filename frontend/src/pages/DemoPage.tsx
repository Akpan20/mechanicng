import { Helmet } from 'react-helmet-async'
import VideoDemo from '@/components/ui/VideoDemo'

export default function DemoPage() {
  return (
    <>
      <Helmet>
        <title>MechanicNG Demo – Interactive Preview</title>
      </Helmet>

      {/* Interactive iframe */}
      <div className="w-full bg-surface-900 border-b border-gray-800">
        <iframe
          src="/demo.html"
          title="MechanicNG Interactive Demo"
          className="w-full h-[600px] border-0"
        />
      </div>

      {/* Video walkthrough */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-extrabold mb-2">Video Walkthrough</h2>
        <p className="text-gray-400 mb-6">
          Prefer to watch? Here's a short guide to using MechanicNG.
        </p>
        <VideoDemo
          url="https://www.youtube.com/watch?v=l-mG7LxpCn8"
          poster="/images/poster.png"
          title="MechanicNG Demo – 7 min"
          className="w-full max-w-xl"
        />
      </div>
    </>
  )
}