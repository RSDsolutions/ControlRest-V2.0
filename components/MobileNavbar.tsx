
import React from 'react';
import { UserRole } from '../types';

interface MobileNavbarProps {
    onMenuClick: () => void;
    user: { name: string; role: UserRole; restaurantName?: string };
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ onMenuClick, user }) => {
    return (
        <header className="xl:hidden flex items-center justify-between h-14 bg-[#0f172a] border-b border-white/[0.06] px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-1.5 rounded-lg bg-white/[0.05] text-white/70 hover:text-white transition-colors border border-white/10"
                    aria-label="Menu"
                >
                    <span className="material-icons-round text-[22px]">menu</span>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#136dec] flex items-center justify-center font-bold text-[10px] shadow-sm">C</div>
                    <span className="text-sm font-semibold text-white/90 truncate max-w-[150px]">
                        {user.restaurantName || 'RESTOGESTIÓN'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=136dec&color=fff&bold=true&size=64`}
                    alt="Perfil"
                    className="h-7 w-7 rounded-md object-cover border border-white/10"
                />
            </div>
        </header>
    );
};

export default MobileNavbar;
