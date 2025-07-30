import mongoose, { Document } from 'mongoose';
export interface IOrder extends Document {
    orderNumber: string;
    productId: mongoose.Types.ObjectId;
    merchantId: mongoose.Types.ObjectId;
    pickupKey: string;
    quantity: number;
    totalAmount: number;
    status: 'pending' | 'delivered' | 'expired' | 'cancelled';
    deliveryData?: any;
    customerInfo?: {
        email?: string;
        phone?: string;
        note?: string;
    };
    pickedUpAt?: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}> & IOrder & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Order.d.ts.map