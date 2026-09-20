import React from 'react';
import { AppId } from '../../context/AppContext';
interface AppLauncherModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectApp?: (appId: AppId) => void;
}
export declare const AppLauncherModal: React.FC<AppLauncherModalProps>;
export {};
//# sourceMappingURL=AppLauncherModal.d.ts.map