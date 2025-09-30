import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onUpload?: () => void;
  onNewContract?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onUpload, onNewContract }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side - Logo Only */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ReLexWise</h1>
              <p className="text-sm text-gray-500">Contract Intelligence Dashboard</p>
            </div>
          </div>
          
          {/* Right Side - Actions + User */}
          <div className="flex items-center space-x-4">
            
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* User Avatar */}
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AN</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload handled via route navigation to /app/upload */}
    </div>
  );
};

export default Header;
