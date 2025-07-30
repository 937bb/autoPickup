import mongoose, { Document } from 'mongoose';
export interface IProduct extends Document {
    name: string;
    description: string;
    categoryCode: string;
    deliveryTypeCode: string;
    price: number;
    stock: number;
    merchantId: mongoose.Types.ObjectId;
    isActive: boolean;
    images: string[];
    tags: string[];
    sales: number;
    deliveryTemplateCode?: string;
    deliveryData?: any;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}> & IProduct & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Product.d.ts.map