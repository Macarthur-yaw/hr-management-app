import { Link } from 'react-router-dom'
import { AlertTriangle, Home, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F4FBFD] px-5 py-12 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-10 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E6F7F9] text-[#049FA7] shadow-inner">
          <AlertTriangle size={36} />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#049FA7]">
            Page not found
          </p>
          <h1 className="mt-4 text-6xl font-extrabold tracking-tight text-slate-950 md:text-7xl">
            404
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            The page you are looking for doesn’t exist anymore. Let’s take you back to the main dashboard or get you signed in.
          </p>
        </div>

        <div className="grid w-full gap-6 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-[#F8FDFF] p-6 shadow-sm">
            <div className="flex items-center gap-3 text-[#049FA7]">
              <Sparkles size={20} />
              <p className="text-sm font-semibold">Designed for HR teams</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Clear navigation, reliable workflow, and an elegant user interface to help your HR team move faster.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[#EEF8FA] p-6 shadow-sm">
            <div className="flex items-center gap-3 text-[#049FA7]">
              <Home size={20} />
              <p className="text-sm font-semibold">Ready to jump back</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Use the buttons below to return to the home experience or sign in to continue managing people and payroll.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button className="rounded-full bg-[#049FA7] px-8 py-3 text-sm font-semibold text-white hover:bg-[#038891]">
              Back to home
            </Button>
          </Link>
          <Link to="/signin">
            <Button className="rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
