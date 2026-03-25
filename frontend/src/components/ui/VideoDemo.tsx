import { Helmet } from 'react-helmet-async'
import VideoDemo from '@/components/ui/VideoDemo'

export default function DemoPage() {
  return (
    <>
      <Helmet>
        <title>Interactive Demo – MechanicNG</title>
        <meta name="description" content="See how MechanicNG works in this interactive demo." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold mb-2">Interactive Demo</h1>
        <p className="text-gray-400 mb-8">
          Watch a short walkthrough of how to find mechanics, request quotes, and manage your listings.
        </p>

        <VideoDemo
          url="https://www.youtube.com/watch?v=l-mG7LxpCn8"
          poster="/images/poster.png"
          title="MechanicNG Demo – 7 min"
          className="mb-8"
        />

        <div className="bg-surface-800 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-3">What you'll see</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Searching for mechanics by city or location</li>
            <li>Viewing mechanic profiles and services</li>
            <li>Sending a quote request</li>
            <li>Managing your listing (for mechanics)</li>
          </ul>
        </div>
      </div>
    </>
  )
}