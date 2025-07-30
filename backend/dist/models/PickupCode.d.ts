import mongoose, { Document, Model } from 'mongoose';
export interface IPickupCode extends Document {
    code: string;
    productId: mongoose.Types.ObjectId;
    merchantId: mongoose.Types.ObjectId;
    isActive: boolean;
    usageLimit?: number;
    usedCount: number;
    expiresAt?: Date;
    deletedAt?: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    isExpired: boolean;
    isAvailable: boolean;
}
export interface IPickupCodeModel extends Model<IPickupCode> {
    generateCode(): string;
    createWithCode(data: {
        productId: mongoose.Types.ObjectId;
        merchantId: mongoose.Types.ObjectId;
        usageLimit?: number;
        expiresInDays?: number;
    }): Promise<IPickupCode>;
}
declare const _default: IPickupCodeModel;
export default _default;
//# sourceMappingURL=PickupCode.d.ts.map