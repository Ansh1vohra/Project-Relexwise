import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Avatar } from './ui/Avatar'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

export default function AppLayout() {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#F8FAFC' }}>
            <aside className="hidden md:flex md:flex-col fixed inset-y-0 border-r border-gray-200 shadow-sm" style={{ width: 260, backgroundColor: '#F8FAFC' }}>
                <div className="h-14 flex items-center px-5 text-textPrimary font-semibold">ContractHub</div>
                <nav className="px-3 py-2 space-y-1 text-sm">
                    <NavLink to="/app/dashboard" className={({isActive}) => `flex items-center px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'text-textPrimary hover:bg-slate-100'}`}>Dashboard</NavLink>
                    <NavLink to="/app/insights" className={({isActive}) => `flex items-center px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'text-textPrimary hover:bg-slate-100'}`}>Insights</NavLink>
                    <NavLink to="/app/reports" className={({isActive}) => `flex items-center px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'text-textPrimary hover:bg-slate-100'}`}>Reports</NavLink>
                    <NavLink to="/app/settings" className={({isActive}) => `flex items-center px-3 py-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'text-textPrimary hover:bg-slate-100'}`}>Settings</NavLink>
                </nav>
            </aside>
            <main className="flex-1 md:ml-[260px]">
                <div className="sticky top-0 bg-white border-b z-10">
                    <div className="px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button className="md:hidden px-3 py-2">☰</button>
                            <Link to="/app/dashboard" className="font-semibold md:hidden">ContractHub</Link>
                            <div className="hidden md:block w-[400px]">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search contracts, vendors, clauses..." className="pl-9 rounded-[12px]" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/app/upload" className="btn-primary">Upload</Link>
                            <Avatar name="A N" />
                            <button onClick={() => { localStorage.removeItem('token'); navigate('/') }} className="px-3 py-2 border rounded-[12px]">Logout</button>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-12">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
