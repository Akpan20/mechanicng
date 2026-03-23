import { Helmet } from 'react-helmet-async'

export default function DemoPage() {
  return (
    <>
      <Helmet>
        <title>MechanicNG Demo – Interactive Preview</title>
      </Helmet>
      <iframe
        src="/demo.html"
        title="MechanicNG Interactive Demo"
        className="w-full h-[calc(100vh-64px)] border-0"
      />
    </>
  )
}