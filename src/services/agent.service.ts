import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserRoleService } from './user-role.service';
import { environment } from '../environments/environment';

// Interfaces for type safety
export interface AgentRegistrationRequest {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
}

export interface AgentLoginRequest {
  email: string;
  password: string;
}

export interface Agent {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number: string;
  national_id: string | null;
  active: number;
  role: string | null;
}

export interface AgentRegistrationResponse {
  message: string;
  agent: Agent;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AgentLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: Agent;
}

export interface ValidationError {
  message: string;
  errors: {
    [key: string]: string[];
  };
}

export interface LoginError {
  error: string;
}

export interface LogoutResponse {
  message: string;
}

export interface UnauthenticatedResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private userRoleService: UserRoleService
  ) {}

  /**
   * Register a new agent
   * @param registrationData - The agent registration data
   * @returns Observable of the registration response
   */
  registerAgent(
    registrationData: AgentRegistrationRequest
  ): Observable<AgentRegistrationResponse> {
    const url = `${this.baseUrl}/agent/register`;

    return this.http
      .post<AgentRegistrationResponse>(url, registrationData)
      .pipe(
        map((response) => {
          // Store the access token in localStorage for future use
          if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('token_type', response.token_type);
            localStorage.setItem(
              'token_expires_in',
              response.expires_in.toString()
            );
          }
          return response;
        }),
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  /**
   * Login an agent
   * @param loginData - The agent login data
   * @returns Observable of the login response
   */
  loginAgent(loginData: AgentLoginRequest): Observable<AgentLoginResponse> {
    const url = `${this.baseUrl}/agent/login`;

    return this.http.post<AgentLoginResponse>(url, loginData).pipe(
      map((response) => {
        // Store the access token in localStorage for future use
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('token_type', response.token_type);
          localStorage.setItem(
            'token_expires_in',
            response.expires_in.toString()
          );
        }

        // Store user data in user role service
        this.userRoleService.setUserData(response.user);

        return response;
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * Logout the current user
   */
  logout(): void {
    this.clearAuthData();
    this.userRoleService.clearUserData();
  }

  /**
   * Logout agent by calling the API
   * @returns Observable of the logout response
   */
  logoutAgent(): Observable<LogoutResponse> {
    const url = `${this.baseUrl}/auth/logout`;
    const token = this.getAccessToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post<LogoutResponse>(url, {}, { headers }).pipe(
      map((response) => {
        // Clear local data after successful API logout
        this.logout();
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        // Even if API call fails, clear local data
        this.logout();
        return this.handleError(error);
      })
    );
  }

  /**
   * Get the current access token
   * @returns The access token or null if not available
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Check if the user is authenticated
   * @returns True if user has a valid token
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    const expiresIn = localStorage.getItem('token_expires_in');
    if (expiresIn) {
      const expirationTime = parseInt(expiresIn) * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      if (currentTime > expirationTime) {
        this.logout();
        return false;
      }
    }

    return true;
  }

  /**
   * Check if the current user is active
   * @returns True if user is active (active = 1)
   */
  isUserActive(): boolean {
    return this.userRoleService.isUserActive();
  }

  /**
   * Clear authentication data
   */
  clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('token_expires_in');
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 422) {
        // Validation error
        const validationError = error.error as ValidationError;
        errorMessage = this.formatValidationErrors(validationError);
      } else if (error.status === 401) {
        // Invalid credentials or account not approved
        const loginError = error.error as LoginError;
        const unauthenticatedResponse = error.error as UnauthenticatedResponse;

        if (loginError?.error?.toLowerCase().includes('invalid credentials')) {
          errorMessage = 'ERRORS.INCORRECT_EMAIL_OR_PASSWORD';
        } else if (
          unauthenticatedResponse?.message
            ?.toLowerCase()
            .includes('unauthenticated')
        ) {
          errorMessage = 'ERRORS.SESSION_EXPIRED';
        } else {
          errorMessage =
            loginError?.error || 'ERRORS.INVALID_EMAIL_OR_PASSWORD';
        }
      } else if (error.status === 403) {
        // Account not active
        const loginError = error.error as LoginError;
        errorMessage = loginError?.error || 'ERRORS.ACCOUNT_NOT_ACTIVE';
      } else if (error.status === 409) {
        errorMessage = 'ERRORS.EMAIL_OR_PHONE_EXISTS';
      } else if (error.status === 500) {
        errorMessage = 'ERRORS.SERVER_ERROR';
      } else {
        errorMessage = 'ERRORS.GENERIC_ERROR';
      }
    }

    console.error('Agent service error:', error);
    return throwError(() => new Error(errorMessage));
  };

  /**
   * Format validation errors into a readable string
   * @param validationError - The validation error response
   * @returns Formatted error message
   */
  private formatValidationErrors(validationError: ValidationError): string {
    if (!validationError.errors) {
      return validationError.message || 'Validation failed';
    }

    const errorMessages: string[] = [];

    Object.keys(validationError.errors).forEach((field) => {
      const fieldErrors = validationError.errors[field];
      if (fieldErrors && fieldErrors.length > 0) {
        // Convert field names to user-friendly labels
        const fieldLabel = this.getFieldLabel(field);

        fieldErrors.forEach((error) => {
          // Make error messages more user-friendly
          const friendlyError = this.getFriendlyErrorMessage(field, error);
          errorMessages.push(friendlyError);
        });
      }
    });

    // If multiple errors, format them nicely with HTML line breaks and bullet points
    if (errorMessages.length > 1) {
      return errorMessages.map((error) => `• ${error}`).join('<br>');
    }

    return errorMessages.length > 0
      ? errorMessages.join('; ')
      : validationError.message || 'Validation failed';
  }

  /**
   * Get user-friendly field labels
   * @param field - The field name
   * @returns User-friendly field label
   */
  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      name: 'Full Name',
      email: 'Email Address',
      phone_number: 'Phone Number',
      password: 'Password',
      password_confirmation: 'Confirm Password',
    };
    return labels[field] || field;
  }

  /**
   * Get user-friendly error messages
   * @param field - The field name
   * @param error - The error message
   * @returns User-friendly error message
   */
  private getFriendlyErrorMessage(field: string, error: string): string {
    const fieldLabel = this.getFieldLabel(field);

    // Handle common validation error patterns
    if (error.includes('already been taken')) {
      if (field === 'email') {
        return 'ERRORS.EMAIL_ALREADY_REGISTERED';
      }
      if (field === 'phone_number') {
        return 'ERRORS.PHONE_ALREADY_REGISTERED';
      }
      return 'ERRORS.FIELD_ALREADY_IN_USE';
    }

    if (error.includes('required')) {
      return 'ERRORS.FIELD_REQUIRED';
    }

    if (error.includes('email')) {
      return 'ERRORS.INVALID_EMAIL_FORMAT';
    }

    if (error.includes('min')) {
      return 'ERRORS.FIELD_TOO_SHORT';
    }

    if (error.includes('max')) {
      return 'ERRORS.FIELD_TOO_LONG';
    }

    if (error.includes('numeric')) {
      return 'ERRORS.FIELD_MUST_BE_NUMERIC';
    }

    if (error.includes('confirmed')) {
      return 'ERRORS.PASSWORDS_DO_NOT_MATCH';
    }

    // For any other errors, return a generic but friendly message
    return 'ERRORS.GENERIC_ERROR';
  }
}
