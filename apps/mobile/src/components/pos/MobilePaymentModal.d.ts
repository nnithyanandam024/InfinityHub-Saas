import React from 'react';
import { PosPaymentRecord } from '@infinityhub/types';
interface MobilePaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onCompleteCheckout: (paymentData: {
        payments: PosPaymentRecord[];
        tenderedAmount?: number;
        changeDue?: number;
        notes?: string;
    }) => Promise<void>;
}
export declare const MobilePaymentModal: React.FC<MobilePaymentModalProps>;
export {};
//# sourceMappingURL=MobilePaymentModal.d.ts.map