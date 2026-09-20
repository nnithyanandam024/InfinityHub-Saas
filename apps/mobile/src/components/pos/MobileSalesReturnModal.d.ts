import React from 'react';
import { Invoice } from '@infinityhub/types';
interface MobileSalesReturnModalProps {
    visible: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onSuccess: (creditNoteNumber: string) => void;
}
export declare const MobileSalesReturnModal: React.FC<MobileSalesReturnModalProps>;
export {};
//# sourceMappingURL=MobileSalesReturnModal.d.ts.map