
import React from 'react';

interface NavTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const NavTabs: React.FC<NavTabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="bg-gray-100 border-b-2 border-gray-200">
      <nav className="flex space-x-2 overflow-x-auto p-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 font-bold text-sm sm:text-base rounded-xl whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default NavTabs;
