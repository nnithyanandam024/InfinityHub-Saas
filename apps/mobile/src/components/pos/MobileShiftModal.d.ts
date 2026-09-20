import React from 'react';
import { RegisterShift } from '@infinityhub/types';
interface MobileShiftModalProps {
    visible: boolean;
    onClose: () => void;
    mode: 'open' | 'close';
    currentShift: RegisterShift | null;
    onOpenShift: (startingFloat: number, notes?: string) => Promise<RegisterShift>;
    onCloseShift: (actualCashCounted: number, notes?: string) => Promise<RegisterShift>;
}
export declare const MobileShiftModal: React.FC<MobileShiftModalProps>;
export {};
//# sourceMappingURL=MobileShiftModal.d.ts.map