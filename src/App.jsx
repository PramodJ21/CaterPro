import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Inventory from './pages/Inventory';
import Workers from './pages/Workers';
import RecipeLibrary from './pages/RecipeLibrary';
import Procurement from './pages/Procurement';
import ActionItems from './pages/ActionItems';
import Reports from './pages/Reports';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile drawer
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#F7F3EE] overflow-x-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          isMobile={isMobile}
        />
        <div
          className="flex-1 flex flex-col transition-all duration-300 min-w-0"
          style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 260) }}
        >
          <Header
            currentEvent={currentEvent}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            toggleSidebar={toggleSidebar}
            isMobile={isMobile}
          />
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail setCurrentEvent={setCurrentEvent} />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/workers" element={<Workers />} />
                <Route path="/recipes" element={<RecipeLibrary />} />
                <Route path="/procurement" element={<Procurement />} />
                <Route path="/action-items" element={<ActionItems />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
