import React from 'react';
import { Product } from '@infinityhub/types';
interface QuickStockBottomSheetProps {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
    onSuccess?: () => void;
}
export declare const QuickStockBottomSheet: React.FC<QuickStockBottomSheetProps>;
export {};
//# sourceMappingURL=QuickStockBottomSheet.d.ts.map