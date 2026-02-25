import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  return (
    <div className="text-center py-24 px-4">
      <div className="text-7xl mb-6">🔧</div>
      <h1 className="text-5xl font-extrabold mb-3">404</h1>
      <p className="text-gray-400 text-lg mb-8">This page isn't in the workshop.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  )
}
