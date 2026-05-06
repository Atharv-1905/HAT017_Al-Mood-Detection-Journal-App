import React, { Suspense, lazy, useState } from 'react';
const Journal = lazy(() => import('./components/Journal'));
const LiveTracker = lazy(() => import('./components/LiveTracker'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const PermissionsOverlay = lazy(() => import('./components/PermissionsOverlay'));
import { hasCompletedPermissions } from './components/PermissionsOverlay';
import DevTimeTravel from './components/DevTimeTravel';
import GlobalToasts from './components/GlobalToasts';
import { PenTool, LayoutDashboard, UserCircle } from 'lucide-react';


export default function App() {
  const [activeTab, setActiveTab] = useState('onboarding');
  const [timeTravelOffset, setTimeTravelOffset] = useState('present');
  const [userProfile, setUserProfile] = useState(null);
  const [needsPermissions, setNeedsPermissions] = useState(false);

  const loadingPane = (
    <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-text-light">
      Loading...
    </div>
  );

  // ── Stage 1: Onboarding (signup / login) ──────────────────
  if (activeTab === 'onboarding') {
    return (
      <>
        <GlobalToasts />
        <Suspense fallback={loadingPane}>
          <Onboarding onComplete={(data) => {
            setUserProfile(data);
            // Check if permissions have been granted before
            if (!hasCompletedPermissions()) {
              setNeedsPermissions(true);
            }
            setActiveTab('journal');
          }} />
        </Suspense>
      </>
    );
  }

  // ── Stage 2: Permissions overlay (one-time, post-login) ───
  if (needsPermissions) {
    return (
      <>
        <GlobalToasts />
        <Suspense fallback={loadingPane}>
          <PermissionsOverlay onComplete={() => setNeedsPermissions(false)} />
        </Suspense>
      </>
    );
  }

  // ── Stage 3: Main application ─────────────────────────────
  const tabs = [
    { id: 'journal', label: 'Journal', icon: PenTool },
    { id: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <GlobalToasts />
      <DevTimeTravel timeTravelOffset={timeTravelOffset} setTimeTravelOffset={setTimeTravelOffset} />

      <nav className="bg-surface border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-primary" /></div>
          <span className="font-semibold text-lg text-text tracking-tight">MindTrace <span className="text-primary">AI+</span></span>
        </div>
        <div className="flex space-x-1 bg-background p-1 rounded-full border border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white shadow-sm text-text' : 'text-text-light hover:text-text'}`}>
              <t.icon size={16} className="mr-2" />{t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 bg-background pt-8 pb-32">
        <Suspense fallback={loadingPane}>
          {activeTab === 'journal' && <Journal />}
          {activeTab === 'dashboard' && <Dashboard timeTravelOffset={timeTravelOffset} userProfile={userProfile} />}
          {activeTab === 'profile' && <UserProfile userProfile={userProfile} />}
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <LiveTracker />
      </Suspense>
    </div>
  );
}
