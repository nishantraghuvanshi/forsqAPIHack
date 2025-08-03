import mongoose, { Schema, Document } from 'mongoose';
import { SearchHistory, SearchQuery, Place, UserContext, LatLng } from '@recommendation-engine/shared';

export interface ISearchHistory extends Omit<SearchHistory, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const LatLngSchema = new Schema<LatLng>({
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  }
});

const SearchQuerySchema = new Schema<SearchQuery>({
  query: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: LatLngSchema,
    required: true
  },
  radius: {
    type: Number,
    default: 1000,
    min: 100,
    max: 50000
  },
  categories: {
    type: [String],
    default: []
  },
  limit: {
    type: Number,
    default: 20,
    min: 1,
    max: 50
  },
  sort: {
    type: String,
    enum: ['distance', 'popularity', 'rating', 'relevance'],
    default: 'relevance'
  }
});

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
    min: 1
  }
});

const SearchHistorySchema = new Schema<ISearchHistory>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  query: {
    type: SearchQuerySchema,
    required: true
  },
  results: {
    type: [Schema.Types.Mixed], // Store Place objects as mixed type
    default: []
  },
  selectedPlace: {
    type: String, // fsq_id of selected place
    index: true
  },
  context: {
    type: UserContextSchema,
    required: true
  },
  sessionId: {
    type: String,
    index: true
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

// Indexes for efficient queries
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ 'query.query': 'text' }); // Text search on query
SearchHistorySchema.index({ 'context.intent': 1 });
SearchHistorySchema.index({ sessionId: 1 });

export const SearchHistoryModel = mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema);
