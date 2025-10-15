import { useState } from 'react'

const tabs = ['Profile', 'Organization', 'Integrations', 'Security', 'Billing'] as const

export default function Settings() {
  const [active, setActive] = useState<typeof tabs[number]>('Profile')
  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-h1 text-textPrimary">Settings</h1>
      </section>

      <div className="bg-white rounded-lg shadow-card border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex gap-2">
          {tabs.map(t => (
            <button key={t} onClick={() => setActive(t)} className={`px-4 py-2 rounded-[12px] ${active===t ? 'bg-primary text-white' : 'bg-gray-100 text-textPrimary hover:bg-gray-200'}`}>{t}</button>
          ))}
        </div>
        <div className="p-6">
          {active === 'Profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-caption text-textSecondary mb-2">Name</label>
                <input className="search-input" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-caption text-textSecondary mb-2">Email</label>
                <input className="search-input" placeholder="name@example.com" />
              </div>
              <div>
                <label className="block text-caption text-textSecondary mb-2">Phone</label>
                <input className="search-input" placeholder="(123) 456-7890" />
              </div>
            </div>
          )}
          {active === 'Organization' && (
            <div className="space-y-4">
              <div>
                <label className="block text-caption text-textSecondary mb-2">Company Name</label>
                <input className="search-input" placeholder="ContractHub Inc." />
              </div>
              <div>
                <label className="block text-caption text-textSecondary mb-2">Brand Color</label>
                <input className="search-input" placeholder="#6366F1" />
              </div>
            </div>
          )}
          {active === 'Integrations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'DocuSign', status: 'Connected', color: 'bg-green-100 text-green-700' },
                { name: 'Salesforce', status: 'Not Connected', color: 'bg-gray-100 text-gray-700' },
                { name: 'Microsoft 365', status: 'Connected', color: 'bg-green-100 text-green-700' },
                { name: 'Slack', status: 'Not Connected', color: 'bg-gray-100 text-gray-700' },
              ].map(i => (
                <div key={i.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-textPrimary">{i.name}</div>
                  <div className={`inline-block mt-2 px-2 py-1 rounded ${i.color}`}>{i.status}</div>
                </div>
              ))}
            </div>
          )}
          {active === 'Security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-textPrimary">Two-Factor Authentication</div>
                  <div className="text-body text-textSecondary">Add an extra layer of security</div>
                </div>
                <button className="btn-secondary">Set up</button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-textPrimary">Session Management</div>
                  <div className="text-body text-textSecondary">View and manage active sessions</div>
                </div>
                <button className="btn-secondary">Manage</button>
              </div>
            </div>
          )}
          {active === 'Billing' && (
            <div className="space-y-4">
              <div className="card">
                <div className="card-header"><div className="font-medium text-textPrimary">Current Plan</div></div>
                <div className="p-6 pt-0">Enterprise – Unlimited users</div>
              </div>
              <div className="card">
                <div className="card-header"><div className="font-medium text-textPrimary">Billing History</div></div>
                <div className="p-6 pt-0 text-textSecondary">No invoices yet.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


