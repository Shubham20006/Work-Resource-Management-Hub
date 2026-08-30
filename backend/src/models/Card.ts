import mongoose, { Document, Schema } from 'mongoose';

export interface IResource {
  id: string;
  itemId?: string;
  cardId?: string;
  subGroupId?: string;
  name: string;
  description?: string;
  url: string;
  emailsUsed?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubGroup {
  id: string;
  itemId?: string;
  cardId?: string;
  name: string;
  description?: string;
  order: number;
  resources: IResource[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IItem {
  id: string;
  cardId?: string;
  name: string;
  description?: string;
  githubUrl?: string; // For Projects category
  resourceUrl?: string; // For non-Projects category (direct Sheet / Resource URL)
  order: number;
  resources: IResource[];
  subGroups: ISubGroup[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICard extends Document {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  order: number;
  items: IItem[];
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    url: { type: String, required: true, trim: true },
    emailsUsed: { type: [String], default: [] },
  },
  {
    timestamps: true,
    _id: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const SubGroupSchema = new Schema<ISubGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    resources: { type: [ResourceSchema], default: [] },
  },
  {
    timestamps: true,
    _id: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    resourceUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    resources: { type: [ResourceSchema], default: [] },
    subGroups: { type: [SubGroupSchema], default: [] },
  },
  {
    timestamps: true,
    _id: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const CardSchema = new Schema<ICard>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, default: 'FolderKanban' },
    color: { type: String, default: 'indigo' },
    category: { type: String, default: 'Other' },
    order: { type: Number, default: 0 },
    items: { type: [ItemSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CardSchema.index({ name: 'text', description: 'text' });

export const CardModel = mongoose.model<ICard>('Card', CardSchema);
