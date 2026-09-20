import React from 'react';
import { AppliedDiscount } from '../../context/PosContext';
interface MobileDiscountModalProps {
    visible: boolean;
    onClose: () => void;
    subtotal: number;
    currentDiscount: AppliedDiscount | null;
    onApplyDiscount: (discount: AppliedDiscount | null) => void;
}
export declare const MobileDiscountModal: React.FC<MobileDiscountModalProps>;
export {};
//# sourceMappingURL=MobileDiscountModal.d.ts.map