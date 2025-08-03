import { SearchHistory } from '../models/SearchHistory';
import { Feedback } from '../models/Feedback';
import { SearchParams, UserContext, FeedbackItem } from '../types';
import { logger } from '../utils/logger';

export class SearchHistoryService {
  /**
   * Log a search performed by a user
   */
  async logSearch(
    userId: string,
    searchParams: SearchParams,
    resultIds: string[],
    userContext: UserContext
  ): Promise<void> {
    try {
      const searchHistory = new SearchHistory({
        userId,
        query: searchParams.query,
        location: {
          type: 'Point',
          coordinates: searchParams.ll.split(',').map(coord => parseFloat(coord)).reverse()
        },
        filters: {
          radius: searchParams.radius,
          categories: searchParams.categories?.split(',') || [],
          limit: searchParams.limit
        },
        results: resultIds,
        userContext,
        timestamp: new Date()
      });

      await searchHistory.save();
      logger.info('Search logged successfully', { userId, query: searchParams.query });
    } catch (error) {
      logger.error('Error logging search', { error, userId, searchParams });
      throw new Error('Failed to log search');
    }
  }

  /**
   * Get user's search history
   */
  async getUserSearchHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const history = await SearchHistory.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      return history;
    } catch (error) {
      logger.error('Error getting user search history', { error, userId });
      throw new Error('Failed to get search history');
    }
  }

  /**
   * Get user's feedback for learning
   */
  async getUserFeedback(userId: string, limit: number = 50): Promise<FeedbackItem[]> {
    try {
      const feedback = await Feedback.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return feedback.map(f => ({
        placeId: f.placeId,
        rating: f.rating,
        comment: f.comment,
        actionTaken: f.actionTaken,
        context: f.context,
        timestamp: f.timestamp
      }));
    } catch (error) {
      logger.error('Error getting user feedback', { error, userId });
      throw new Error('Failed to get user feedback');
    }
  }

  /**
   * Get user's feedback for a specific place
   */
  async getUserFeedbackForPlace(userId: string, placeId: string): Promise<FeedbackItem | null> {
    try {
      const feedback = await Feedback.findOne({ userId, placeId })
        .sort({ timestamp: -1 })
        .lean();

      if (!feedback) {
        return null;
      }

      return {
        placeId: feedback.placeId,
        rating: feedback.rating,
        comment: feedback.comment,
        actionTaken: feedback.actionTaken,
        context: feedback.context,
        timestamp: feedback.timestamp
      };
    } catch (error) {
      logger.error('Error getting user feedback for place', { error, userId, placeId });
      throw new Error('Failed to get place feedback');
    }
  }

  /**
   * Save user feedback
   */
  async saveFeedback(
    userId: string,
    placeId: string,
    rating: number,
    context: UserContext,
    comment?: string,
    actionTaken?: string
  ): Promise<void> {
    try {
      const feedback = new Feedback({
        userId,
        placeId,
        rating,
        comment,
        actionTaken,
        context,
        timestamp: new Date()
      });

      await feedback.save();
      logger.info('Feedback saved successfully', { userId, placeId, rating });
    } catch (error) {
      logger.error('Error saving feedback', { error, userId, placeId });
      throw new Error('Failed to save feedback');
    }
  }

  /**
   * Get popular searches for analytics
   */
  async getPopularSearches(timeframe: 'day' | 'week' | 'month' = 'week', limit: number = 10): Promise<any[]> {
    try {
      const timeframeDays = {
        day: 1,
        week: 7,
        month: 30
      };

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeDays[timeframe]);

      const popularSearches = await SearchHistory.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return popularSearches;
    } catch (error) {
      logger.error('Error getting popular searches', { error, timeframe });
      throw new Error('Failed to get popular searches');
    }
  }

  /**
   * Get search analytics for a user
   */
  async getUserSearchAnalytics(userId: string): Promise<any> {
    try {
      const analytics = await SearchHistory.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            uniqueQueries: { $addToSet: '$query' },
            avgResultsPerSearch: { $avg: { $size: '$results' } },
            mostCommonContext: { $addToSet: '$userContext.intent' }
          }
        },
        {
          $project: {
            _id: 0,
            totalSearches: 1,
            uniqueQueriesCount: { $size: '$uniqueQueries' },
            avgResultsPerSearch: { $round: ['$avgResultsPerSearch', 2] },
            mostCommonContext: 1
          }
        }
      ]);

      return analytics[0] || {
        totalSearches: 0,
        uniqueQueriesCount: 0,
        avgResultsPerSearch: 0,
        mostCommonContext: []
      };
    } catch (error) {
      logger.error('Error getting user search analytics', { error, userId });
      throw new Error('Failed to get search analytics');
    }
  }

  /**
   * Clean up old search history
   */
  async cleanupOldHistory(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await SearchHistory.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      logger.info('Cleaned up old search history', { 
        deletedCount: result.deletedCount, 
        cutoffDate 
      });

      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up search history', { error, daysToKeep });
      throw new Error('Failed to cleanup search history');
    }
  }
}
