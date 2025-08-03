import mongoose, { Schema, Document } from 'mongoose';
import { FeedbackItem, UserContext } from '@recommendation-engine/shared';

export interface IFeedbackItem extends Omit<FeedbackItem, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const UserContextSchema = new Schema<UserContext>({
  currentTime: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  weather: {
    temperature: Number,
    condition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'snowy']
    },
    humidity: Number
  },
  intent: {
    type: String,
    required: true,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  groupSize: {
    type: Number,
    default: 1,
    min: 1
  },
  duration: {
    type: Number,
    min: 1 // minutes
  }
});

const FeedbackItemSchema = new Schema<IFeedbackItem>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  placeId: {
    type: String,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  context: {
    type: UserContextSchema,
    required: true
  },
  actionTaken: {
    type: String,
    enum: ['navigate', 'call', 'book', 'save', 'share', 'visit_website'],
    index: true
  },
  helpful: {
    type: Boolean,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for analytics and queries
FeedbackItemSchema.index({ userId: 1, createdAt: -1 });
FeedbackItemSchema.index({ placeId: 1, rating: -1 });
FeedbackItemSchema.index({ 'context.intent': 1 });
FeedbackItemSchema.index({ actionTaken: 1 });

export const FeedbackModel = mongoose.model<IFeedbackItem>('FeedbackItem', FeedbackItemSchema);
