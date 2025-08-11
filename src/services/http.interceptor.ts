import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Only intercept API calls to our backend
    if (!request.url.includes(environment.apiBaseUrl)) {
      return next.handle(request);
    }

    // Skip authentication for login/register endpoints
    if (this.isAuthEndpoint(request.url)) {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return next.handle(request);
    }

    // Add authentication headers if token exists
    const token = this.getAuthToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    } else {
      // For requests that don't need authentication, still set content type
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    }

    // Handle the request and catch errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // For validation errors (422), pass through the original error object
        if (error.status === 422) {
          return throwError(() => error);
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Check if the request URL is an authentication endpoint
   * @param url - The request URL
   * @returns True if it's an auth endpoint
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = [
      '/agent/login',
      '/agent/register',
      '/admin/login',
      '/admin/register',
    ];
    return authEndpoints.some((endpoint) => url.includes(endpoint));
  }

  /**
   * Get authentication token from localStorage
   * @returns The stored token or null if not found
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request - Invalid data provided';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please login again';
          this.handleUnauthorized();
          break;
        case 403:
          errorMessage = 'Forbidden - Access denied';
          break;
        case 404:
          errorMessage = 'Not Found - Resource not available';
          break;

        case 500:
          errorMessage = 'Server Error - Please try again later';
          break;
        case 503:
          errorMessage = 'Service Unavailable - Please try again later';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Handle unauthorized access
   * Clears local storage and redirects to login
   */
  private handleUnauthorized(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    // Redirect to login page
    window.location.href = '/login';
  }
}
