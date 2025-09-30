import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import Header from './Header'

export default function AppLayout() {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    return (
        <div className="min-h-screen flex bg-[#F8FAFC]">
            <aside className="hidden md:flex md:flex-col fixed inset-y-0 border-r border-gray-200 shadow-sm z-40" style={{ width: 260, backgroundColor: '#F8FAFC' }}>
                <div className="h-14 flex items-center px-5 text-textPrimary font-semibold">ContractHub</div>
                <nav className="px-3 py-2 space-y-1 text-sm">
                    <NavLink to="/app/dashboard" className={({isActive}) => `flex items-center px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'text-textPrimary hover:bg-slate-100'}`}>Dashboard</NavLink>
                    <NavLink to="/app/insights" className={({isActive}) => `flex items-center px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'text-textPrimary hover:bg-slate-100'}`}>Insights</NavLink>
                    <NavLink to="/app/reports" className={({isActive}) => `flex items-center px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'text-textPrimary hover:bg-slate-100'}`}>Reports</NavLink>
                    <NavLink to="/app/settings" className={({isActive}) => `flex items-center px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'text-textPrimary hover:bg-slate-100'}`}>Settings</NavLink>
                </nav>
            </aside>
            <main className="flex-1 md:ml-[260px] min-h-screen flex flex-col min-w-0 overflow-x-hidden">
                <div className="sticky top-0 z-30">
                    <Header />
                </div>
                <div className="px-6 py-12 flex-1 min-w-0">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
