'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, GitBranch, Mail, Calendar,
  BarChart3, Settings, LogOut, FileText, Building2, Handshake, ClipboardList, Truck, Sparkles, Upload, Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { href: '/accounts', icon: Building2, label: 'Accounts' },
  { href: '/opportunities', icon: Handshake, label: 'Opportunities' },
  { href: '/workflow', icon: ClipboardList, label: 'Workflow' },
  { href: '/campaigns', icon: Mail, label: 'Campaigns' },
  { href: '/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/templates', icon: FileText, label: 'Templates' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },

  // PentraCore modules
  { href: '/pentracore/executive', icon: LayoutDashboard, label: 'Deal Intelligence' },
  { href: '/pentracore/wealth-engine', icon: Database, label: 'Wealth Engine' },
  { href: '/pentracore/deals/pipeline', icon: GitBranch, label: 'Deal Pipeline' },
  { href: '/pentracore/commodities', icon: BarChart3, label: 'Commodities' },
  { href: '/pentracore/logistics', icon: Truck, label: 'Logistics' },
  { href: '/pentracore/ai-insights', icon: Sparkles, label: 'AI Insights' },
  { href: '/pentracore/documents', icon: FileText, label: 'Document Center' },
  { href: '/pentracore/import', icon: Upload, label: 'Import Master Data' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-[#0d1420] border-r border-[#1e293b] flex flex-col h-full fixed left-0 top-0">
      <div className="p-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">P</div>
          <div>
            <div className="text-white font-semibold text-sm leading-none">Pentracore</div>
            <div className="text-slate-500 text-xs mt-0.5">CRM Platform</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href} href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-indigo-500/15 text-indigo-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-[#1e293b] space-y-0.5">
        <Link href="/settings" className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          pathname === '/settings' ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        )}>
          <Settings size={16} />Settings
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-colors">
          <LogOut size={16} />Sign Out
        </button>
      </div>
    </aside>
  )
}
