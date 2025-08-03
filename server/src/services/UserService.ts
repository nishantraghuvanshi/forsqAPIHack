import { User } from '../models/User';
import { UserPreferences } from '../types';
import { logger } from '../utils/logger';

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any | null> {
    try {
      const user = await User.findById(userId).lean();
      return user;
    } catch (error) {
      logger.error('Error getting user by ID', { error, userId });
      throw new Error('Failed to get user');
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    email: string;
    name: string;
    preferences?: UserPreferences;
    currentLocation?: {
      lat: number;
      lng: number;
      address?: string;
    };
  }): Promise<any> {
    try {
      const user = new User({
        email: userData.email,
        name: userData.name,
        preferences: userData.preferences || {
          categories: [],
          priceRange: [1, 4],
          maxDistance: 1000,
          preferredHours: { start: 8, end: 22 }
        },
        currentLocation: userData.currentLocation ? {
          type: 'Point',
          coordinates: [userData.currentLocation.lng, userData.currentLocation.lat],
          address: userData.currentLocation.address
        } : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await user.save();
      logger.info('User created successfully', { userId: user._id, email: userData.email });
      return user;
    } catch (error) {
      logger.error('Error creating user', { error, userData });
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        { 
          preferences,
          updatedAt: new Date()
        },
        { new: true }
      );

      logger.info('User preferences updated', { userId });
    } catch (error) {
      logger.error('Error updating user preferences', { error, userId });
      throw new Error('Failed to update preferences');
    }
  }

  /**
   * Update user location
   */
  async updateUserLocation(
    userId: string,
    location: { lat: number; lng: number; address?: string }
  ): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        {
          currentLocation: {
            type: 'Point',
            coordinates: [location.lng, location.lat],
            address: location.address
          },
          updatedAt: new Date()
        },
        { new: true }
      );

      logger.info('User location updated', { userId });
    } catch (error) {
      logger.error('Error updating user location', { error, userId });
      throw new Error('Failed to update location');
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const user = await User.findOne({ email }).lean();
      return user;
    } catch (error) {
      logger.error('Error getting user by email', { error, email });
      throw new Error('Failed to get user');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await User.findByIdAndDelete(userId);
      logger.info('User deleted successfully', { userId });
    } catch (error) {
      logger.error('Error deleting user', { error, userId });
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        return null;
      }

      return {
        joinDate: user.createdAt,
        lastActive: user.updatedAt,
        hasPreferences: Boolean(user.preferences),
        hasLocation: Boolean(user.currentLocation),
        preferredCategories: user.preferences?.categories || [],
        priceRange: user.preferences?.priceRange || [1, 4]
      };
    } catch (error) {
      logger.error('Error getting user stats', { error, userId });
      throw new Error('Failed to get user stats');
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await User.countDocuments();
      return true;
    } catch (error) {
      logger.error('User service health check failed', error);
      return false;
    }
  }
}
