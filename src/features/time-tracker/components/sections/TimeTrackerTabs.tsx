import {BarChart3, Timer, Users} from 'lucide-react';
import type {TrackerTab} from '../timeTracker.types';

interface TimeTrackerTabsProps {
    activeTab: TrackerTab;
    hasTeamAccess: boolean;
    onTabChange: (tab: TrackerTab) => void;
}

export function TimeTrackerTabs({activeTab, hasTeamAccess, onTabChange}: TimeTrackerTabsProps) {
    return (
        <section className="mb-4 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">

            <button
                type="button"
                onClick={() => onTabChange('timer')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeTab === 'timer'
                        ? 'role-accent-btn'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                <Timer size={14}/>
                Timerim
            </button>


            <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeTab === 'dashboard'
                        ? 'role-accent-btn'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                <BarChart3 size={14}/>
                Dashboard
            </button>


            {hasTeamAccess && (
                <button
                    type="button"
                    onClick={() => onTabChange('team')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        activeTab === 'team'
                            ? 'role-accent-btn'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <Users size={14}/>
                    Takim Gorunumu
                </button>
            )}
        </section>
    );
}
