import { Clock } from 'lucide-react'

export default function ComingSoon({ module = 'Module', member = '' }) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-700 mb-2">{module}</h1>
      <p className="text-slate-500 text-sm mb-1">This module is being implemented by <strong>{member}</strong></p>
      <p className="text-slate-400 text-xs">It will be available after GitHub integration</p>
      <div className="mt-6 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
        🚧 Coming Soon
      </div>
    </div>
  )
}
