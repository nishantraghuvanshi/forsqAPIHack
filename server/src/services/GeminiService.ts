import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Place, 
  RankedPlace, 
  UserContext, 
  UserPreferences, 
  AIRankingResponse,
  ActionSuggestion,
  FeedbackItem 
} from '../types';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.gemini.model,
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: config.gemini.maxTokens,
      }
    });
  }

  /**
   * Rank places based on user context and preferences using Gemini AI
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
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini AI');
      }

      return this.parseAIResponse(text, places);
    } catch (error) {
      logger.error('Error ranking places with Gemini AI', { error, userQuery });
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
Categories: ${place.categories.map((c: any) => c.name).join(', ')}
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

Format your response as valid JSON only, no additional text:
{
  "actions": [
    {
      "type": "navigate",
      "label": "Get Directions",
      "priority": 5,
      "availability": "available"
    }
  ]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        return this.getDefaultActions(place);
      }

      try {
        const parsed = JSON.parse(text);
        return parsed.actions || this.getDefaultActions(place);
      } catch (parseError) {
        logger.warn('Failed to parse Gemini action suggestions', { parseError, text });
        return this.getDefaultActions(place);
      }
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

Format your response as valid JSON only, no additional text:
{
  "categories": [],
  "priceRange": [1, 4],
  "maxDistance": 1000,
  "preferredHours": {"start": 8, "end": 22}
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        return this.getDefaultPreferences();
      }

      try {
        const parsed = JSON.parse(text);
        return {
          categories: parsed.categories || [],
          priceRange: parsed.priceRange || [1, 4],
          maxDistance: parsed.maxDistance || 1000,
          preferredHours: parsed.preferredHours || { start: 8, end: 22 }
        };
      } catch (parseError) {
        logger.warn('Failed to parse Gemini feedback analysis', { parseError, text });
        return this.getDefaultPreferences();
      }
    } catch (error) {
      logger.error('Error analyzing user feedback', { error });
      return this.getDefaultPreferences();
    }
  }

  /**
   * Build the ranking prompt for Gemini AI
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
   - Categories: ${place.categories.map((c: any) => c.name).join(', ')}
   - Distance: ${place.distance ? `${place.distance}m` : 'Unknown'}
   - Rating: ${place.rating || 'N/A'}
   - Price: ${place.price ? '$'.repeat(place.price) : 'N/A'}
   - Hours: ${place.hours?.display || 'N/A'}
   - Open now: ${place.hours?.open_now ? 'Yes' : 'No'}
`).join('\n');

    return `
You are an intelligent location recommendation assistant. Your job is to rank places based on user intent, context, and preferences.

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

Consider factors like:
- Relevance to user's stated intent and query
- Current time and day of week appropriateness
- Distance and convenience
- User's price and category preferences
- Opening hours and current availability
- Group size suitability
- Urgency level

Format your response as valid JSON only, no additional text:
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
   * Parse AI response and merge with place data
   */
  private parseAIResponse(response: string, originalPlaces: Place[]): AIRankingResponse {
    try {
      // Clean response to extract JSON
      let jsonText = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText);
      
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
      logger.error('Error parsing Gemini AI response', { error, response });
      
      // Fallback: return places with default scoring
      const fallbackRankedPlaces: RankedPlace[] = originalPlaces.map((place, index) => ({
        ...place,
        relevanceScore: Math.max(0.1, 1 - (index * 0.1)),
        aiReasoning: 'Fallback ranking due to AI parsing error',
        recommendationTags: ['general'],
        estimatedBusyTime: 'medium'
      }));

      return {
        rankedPlaces: fallbackRankedPlaces,
        reasoning: 'Fallback ranking applied due to AI response parsing error',
        confidence: 0.3,
        suggestedActions: []
      };
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
   * Health check for Gemini AI API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Test message');
      const response = result.response;
      return !!response.text();
    } catch (error) {
      logger.error('Gemini AI API health check failed', error);
      return false;
    }
  }
}
