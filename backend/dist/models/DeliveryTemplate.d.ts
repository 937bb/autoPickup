import mongoose, { Document } from 'mongoose';
export interface ITemplateField {
    name: string;
    label: string;
    type: 'text' | 'url' | 'password' | 'file' | 'textarea' | 'number';
    required: boolean;
    placeholder?: string;
    validation?: {
        pattern?: string;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
    };
    defaultValue?: string;
    options?: string[];
}
export interface IDeliveryTemplate extends Document {
    templateCode: string;
    templateName: string;
    deliveryType: string;
    fields: ITemplateField[];
    description?: string;
    isActive: boolean;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IDeliveryTemplate, {}, {}, {}, mongoose.Document<unknown, {}, IDeliveryTemplate, {}> & IDeliveryTemplate & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=DeliveryTemplate.d.ts.map