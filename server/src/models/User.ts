import mongoose, { Schema, Document } from 'mongoose';
import { User, UserPreferences } from '../types';

export interface IUser extends Omit<User, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const UserPreferencesSchema = new Schema<UserPreferences>({
  categories: {
    type: [String],
    default: []
  },
  priceRange: {
    type: [Number],
    default: [1, 4],
    validate: {
      validator: function(v: number[]) {
        return v.length === 2 && v[0] >= 1 && v[1] <= 4 && v[0] <= v[1];
      },
      message: 'Price range must be [min, max] where min and max are between 1-4'
    }
  },
  maxDistance: {
    type: Number,
    default: 1000,
    min: 100,
    max: 50000
  },
  preferredHours: {
    start: {
      type: Number,
      default: 8,
      min: 0,
      max: 23
    },
    end: {
      type: Number,
      default: 22,
      min: 0,
      max: 23
    }
  },
  accessibility: {
    wheelchairAccessible: {
      type: Boolean,
      default: false
    },
    parkingRequired: {
      type: Boolean,
      default: false
    }
  }
});

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    sparse: true, // Allow multiple documents without email
    validate: {
      validator: function(v: string) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({})
  },
  location: {
    lat: {
      type: Number,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      min: -180,
      max: 180
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'location.lat': 1, 'location.lng': 1 });
UserSchema.index({ createdAt: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// Export the model as named export for consistency
export { UserModel as User };
