import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  /**
   * Get the API base URL
   */
  get apiBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  /**
   * Get the application name
   */
  get appName(): string {
    return environment.appName;
  }

  /**
   * Get the application version
   */
  get version(): string {
    return environment.version;
  }

  /**
   * Check if the application is running in production mode
   */
  get isProduction(): boolean {
    return environment.production;
  }

  /**
   * Get the full API URL for a specific endpoint
   * @param endpoint - The API endpoint (e.g., '/agent/login')
   * @returns The complete API URL
   */
  getApiUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.apiBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Get the complete URL for agent-related endpoints
   * @param endpoint - The agent endpoint (e.g., 'login' or 'register')
   * @returns The complete agent API URL
   */
  getAgentApiUrl(endpoint: string): string {
    return this.getApiUrl(`agent/${endpoint}`);
  }

  /**
   * Get the complete URL for admin-related endpoints
   * @param endpoint - The admin endpoint (e.g., 'login' or 'register')
   * @returns The complete admin API URL
   */
  getAdminApiUrl(endpoint: string): string {
    return this.getApiUrl(`admin/${endpoint}`);
  }
}
