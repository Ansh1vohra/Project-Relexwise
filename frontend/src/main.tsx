import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import ContractDetail from './pages/ContractDetail'
import Query from './pages/Query'
import Insights from './pages/Insights'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AppLayout from './shared/AppLayout'

const router = createBrowserRouter([
	{ path: '/', element: <Login /> },
	{
		path: '/app',
		element: <AppLayout />,
		children: [
			{ path: 'dashboard', element: <Dashboard /> },
			{ path: 'insights', element: <Insights /> },
			{ path: 'reports', element: <Reports /> },
			{ path: 'settings', element: <Settings /> },
			{ path: 'upload', element: <Upload /> },
			{ path: 'contracts/:id', element: <ContractDetail /> },
			{ path: 'query', element: <Query /> },
		],
	},
])

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
)
