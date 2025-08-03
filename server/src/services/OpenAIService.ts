import OpenAI from 'openai';
import { 
  Place, 
  RankedPlace, 
  UserContext, 
  UserPreferences, 
  AIRankingResponse,
  ActionSuggestion,
  FeedbackItem 
} from '@recommendation-engine/shared';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  /**
   * Rank places based on user context and preferences using AI
   */
  async rankPlaces(
    places: Place[],
    userQuery: string,
    userContext: UserContext,
    userPreferences?: UserPreferences,
    userHistory?: FeedbackItem[]
  ): Promise<AIRankingResponse> {
    try {
      const prompt = this.buildRankingPrompt(places, userQuery, userContext, userPreferences, userHistory);
      
      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: 0.3, // Lower temperature for more consistent rankings
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return this.parseAIResponse(response, places);
    } catch (error) {
      logger.error('Error ranking places with OpenAI', { error, userQuery });
      throw new Error('Failed to rank places using AI');
    }
  }

  /**
   * Generate action suggestions for a specific place
   */
  async generateActionSuggestions(
    place: Place,
    userContext: UserContext
  ): Promise<ActionSuggestion[]> {
    try {
      const prompt = `
Given this place and user context, suggest the most relevant actions the user can take:

Place: ${place.name}
Location: ${place.location.formatted_address}
Categories: ${place.categories.map(c => c.name).join(', ')}
Rating: ${place.rating || 'N/A'}
Price: ${place.price ? '$'.repeat(place.price) : 'N/A'}
Website: ${place.website || 'N/A'}
Phone: ${place.tel || 'N/A'}

User Context:
- Intent: ${userContext.intent}
- Time: ${userContext.currentTime}
- Group Size: ${userContext.groupSize}
- Urgency: ${userContext.urgency}

Return a JSON array of action suggestions with type, label, priority (1-5), and any relevant URL.
Available action types: navigate, call, book, save, share, visit_website
`;

      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that suggests contextual actions for places. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.4,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return this.getDefaultActions(place);
      }

      const parsed = JSON.parse(response);
      return parsed.actions || this.getDefaultActions(place);
    } catch (error) {
      logger.error('Error generating action suggestions', { error, place: place.fsq_id });
      return this.getDefaultActions(place);
    }
  }

  /**
   * Analyze user feedback to extract insights
   */
  async analyzeUserFeedback(feedback: FeedbackItem[]): Promise<UserPreferences> {
    try {
      if (feedback.length === 0) {
        return this.getDefaultPreferences();
      }

      const prompt = `
Analyze this user feedback to extract preferences:

${feedback.map(f => `
Rating: ${f.rating}/5
Comment: ${f.comment || 'No comment'}
Context: ${f.context.intent}
Action: ${f.actionTaken || 'None'}
`).join('\n')}

Extract user preferences and return JSON with:
- categories: array of preferred place categories
- priceRange: [min, max] where 1=cheap, 4=expensive
- maxDistance: preferred search radius in meters
- preferredHours: {start: hour, end: hour} in 24h format

Base this on patterns in the feedback data.
`;

      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that analyzes user behavior to extract preferences. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return this.getDefaultPreferences();
      }

      const parsed = JSON.parse(response);
      return {
        categories: parsed.categories || [],
        priceRange: parsed.priceRange || [1, 4],
        maxDistance: parsed.maxDistance || 1000,
        preferredHours: parsed.preferredHours || { start: 8, end: 22 }
      };
    } catch (error) {
      logger.error('Error analyzing user feedback', { error });
      return this.getDefaultPreferences();
    }
  }

  /**
   * Build the ranking prompt for OpenAI
   */
  private buildRankingPrompt(
    places: Place[],
    userQuery: string,
    userContext: UserContext,
    userPreferences?: UserPreferences,
    userHistory?: FeedbackItem[]
  ): string {
    const placesInfo = places.map((place, index) => `
${index + 1}. ${place.name}
   - Location: ${place.location.formatted_address}
   - Categories: ${place.categories.map(c => c.name).join(', ')}
   - Distance: ${place.distance ? `${place.distance}m` : 'Unknown'}
   - Rating: ${place.rating || 'N/A'}
   - Price: ${place.price ? '$'.repeat(place.price) : 'N/A'}
   - Hours: ${place.hours?.display || 'N/A'}
   - Open now: ${place.hours?.open_now ? 'Yes' : 'No'}
`).join('\n');

    return `
User Query: "${userQuery}"

Current Context:
- Time: ${userContext.currentTime}
- Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][userContext.dayOfWeek]}
- Intent: ${userContext.intent}
- Group Size: ${userContext.groupSize}
- Urgency: ${userContext.urgency}
- Duration: ${userContext.duration ? `${userContext.duration} minutes` : 'Not specified'}

User Preferences:
- Categories: ${userPreferences?.categories.join(', ') || 'None specified'}
- Price Range: ${userPreferences?.priceRange ? `${'$'.repeat(userPreferences.priceRange[0])}-${'$'.repeat(userPreferences.priceRange[1])}` : 'Any'}
- Max Distance: ${userPreferences?.maxDistance || 'Any'}m

Available Places:
${placesInfo}

Rank these places from most to least relevant (1 being best) and provide:
1. Ranking with relevance scores (0-1)
2. Brief reasoning for each recommendation
3. Suggested tags for each place
4. Overall confidence in recommendations (0-1)

Return JSON format:
{
  "rankedPlaces": [
    {
      "fsq_id": "place_id",
      "relevanceScore": 0.95,
      "aiReasoning": "explanation",
      "recommendationTags": ["tag1", "tag2"],
      "estimatedBusyTime": "low|medium|high"
    }
  ],
  "reasoning": "overall explanation",
  "confidence": 0.85
}
`;
  }

  /**
   * Get system prompt for AI assistant
   */
  private getSystemPrompt(): string {
    return `You are an intelligent location recommendation assistant. Your job is to rank places based on user intent, context, and preferences. Consider factors like:

1. Relevance to user's stated intent and query
2. Current time and day of week appropriateness
3. Distance and convenience
4. User's price and category preferences
5. Opening hours and current availability
6. Group size suitability
7. Urgency level

Provide thoughtful, personalized recommendations with clear reasoning. Always respond with valid JSON format.`;
  }

  /**
   * Parse AI response and merge with place data
   */
  private parseAIResponse(response: string, originalPlaces: Place[]): AIRankingResponse {
    try {
      const parsed = JSON.parse(response);
      
      const rankedPlaces: RankedPlace[] = parsed.rankedPlaces.map((rankedPlace: any) => {
        const originalPlace = originalPlaces.find(p => p.fsq_id === rankedPlace.fsq_id);
        if (!originalPlace) {
          throw new Error(`Place ${rankedPlace.fsq_id} not found in original places`);
        }

        return {
          ...originalPlace,
          relevanceScore: rankedPlace.relevanceScore,
          aiReasoning: rankedPlace.aiReasoning,
          recommendationTags: rankedPlace.recommendationTags || [],
          estimatedBusyTime: rankedPlace.estimatedBusyTime || 'medium'
        };
      });

      // Sort by relevance score
      rankedPlaces.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return {
        rankedPlaces,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
        suggestedActions: [] // Will be filled by separate action suggestion call
      };
    } catch (error) {
      logger.error('Error parsing AI response', { error, response });
      throw new Error('Failed to parse AI ranking response');
    }
  }

  /**
   * Get default action suggestions
   */
  private getDefaultActions(place: Place): ActionSuggestion[] {
    const actions: ActionSuggestion[] = [
      {
        type: 'navigate',
        label: 'Get Directions',
        priority: 5,
        availability: 'available'
      }
    ];

    if (place.tel) {
      actions.push({
        type: 'call',
        label: 'Call',
        url: `tel:${place.tel}`,
        priority: 4,
        availability: 'available'
      });
    }

    if (place.website) {
      actions.push({
        type: 'visit_website',
        label: 'Visit Website',
        url: place.website,
        priority: 3,
        availability: 'available'
      });
    }

    actions.push({
      type: 'save',
      label: 'Save to Favorites',
      priority: 2,
      availability: 'available'
    });

    return actions;
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      categories: [],
      priceRange: [1, 4],
      maxDistance: 1000,
      preferredHours: { start: 8, end: 22 }
    };
  }

  /**
   * Health check for OpenAI API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'user',
            content: 'Test message'
          }
        ],
        max_tokens: 10
      });
      return true;
    } catch (error) {
      logger.error('OpenAI API health check failed', error);
      return false;
    }
  }
}
