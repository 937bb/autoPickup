import mongoose, { Document } from 'mongoose';
export interface IDictionaryItem extends Document {
    code: string;
    name: string;
    value: string;
    description?: string;
    sort: number;
    isActive: boolean;
    parentCode?: string;
    extra?: any;
    createdAt: Date;
    updatedAt: Date;
}
export interface IDictionaryType extends Document {
    typeCode: string;
    typeName: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DictionaryItem: mongoose.Model<IDictionaryItem, {}, {}, {}, mongoose.Document<unknown, {}, IDictionaryItem, {}> & IDictionaryItem & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export declare const DictionaryType: mongoose.Model<IDictionaryType, {}, {}, {}, mongoose.Document<unknown, {}, IDictionaryType, {}> & IDictionaryType & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Dictionary.d.ts.map