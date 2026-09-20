import React from 'react';
interface MobileDrawerMovementModalProps {
    visible: boolean;
    onClose: () => void;
    onRecordMovement: (type: 'cash_in' | 'cash_out' | 'drawer_pop_no_sale', amount: number, reason: string) => Promise<void>;
}
export declare const MobileDrawerMovementModal: React.FC<MobileDrawerMovementModalProps>;
export {};
//# sourceMappingURL=MobileDrawerMovementModal.d.ts.map