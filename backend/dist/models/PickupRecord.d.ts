import mongoose, { Document } from 'mongoose';
export interface IPickupRecord extends Document {
    pickupCodeId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    merchantId: mongoose.Types.ObjectId;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPickupRecord, {}, {}, {}, mongoose.Document<unknown, {}, IPickupRecord, {}> & IPickupRecord & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PickupRecord.d.ts.map