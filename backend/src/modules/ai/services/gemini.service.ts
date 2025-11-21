import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    this.logger.log('GeminiService constructor called');
    
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.logger.log(`GEMINI_API_KEY status: ${apiKey ? 'Found (length: ' + apiKey.length + ')' : 'NOT FOUND'}`);
    
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables!');
      this.logger.error('Please add GEMINI_API_KEY to your .env file and restart the server');
      throw new Error('GEMINI_API_KEY is required but not found in environment variables');
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      this.logger.log('✅ Gemini AI initialized successfully with model: gemini-2.0-flash');
    } catch (error) {
      this.logger.error('Failed to initialize Gemini AI:', error);
      throw error;
    }
  }

  /**
   * Generate content using Gemini AI
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      this.logger.log('Generating content with Gemini AI...');
      this.logger.log(`Prompt length: ${prompt.length} characters`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.logger.log(`Generated content length: ${text.length} characters`);
      return text;
    } catch (error) {
      this.logger.error('Error generating content:', error);
      throw new Error(`Failed to generate content with Gemini AI: ${error.message}`);
    }
  }

  /**
   * Generate structured JSON response
   */
  async generateStructuredResponse<T>(prompt: string): Promise<T> {
    try {
      this.logger.log('Generating structured response...');
      const text = await this.generateContent(prompt);
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }
      
      this.logger.log('Parsing JSON response...');
      const parsed = JSON.parse(jsonText) as T;
      this.logger.log('✅ Structured response parsed successfully');
      return parsed;
    } catch (error) {
      this.logger.error('Error parsing structured response:', error);
      this.logger.error('Response text:', error);
      throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
    }
  }
}
