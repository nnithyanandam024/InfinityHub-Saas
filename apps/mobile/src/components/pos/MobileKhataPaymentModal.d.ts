import React from 'react';
import { PosCustomer } from '@infinityhub/types';
interface MobileKhataPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    customer: PosCustomer | null;
    onRecordPayment: (customerId: string, amount: number, paymentMethod?: string, reference?: string) => Promise<void>;
}
export declare const MobileKhataPaymentModal: React.FC<MobileKhataPaymentModalProps>;
export {};
//# sourceMappingURL=MobileKhataPaymentModal.d.ts.map