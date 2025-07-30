import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { inject } from '@angular/core';
import { ToastService } from './toast.service';

// Global variable to track active requests
let activeRequests = 0;

export function httpInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  // Increment active requests counter
  activeRequests++;

  // Add authentication header if token exists
  const token = getAuthToken();
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Add common headers
  request = request.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Log the request
  logRequest(request);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      handleError(error);
      return throwError(() => error);
    }),
    finalize(() => {
      // Decrement active requests counter
      activeRequests--;
      logResponse(request);
    })
  );
}

function getAuthToken(): string | null {
  // Get token from localStorage or sessionStorage
  return (
    localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  );
}

function logRequest(request: HttpRequest<unknown>): void {
  console.log(`🚀 HTTP Request: ${request.method} ${request.url}`, {
    headers: request.headers,
    body: request.body,
  });
}

function logResponse(request: HttpRequest<unknown>): void {
  console.log(`✅ HTTP Response: ${request.method} ${request.url}`);
}

function handleError(error: HttpErrorResponse): void {
  let errorMessage = 'An error occurred';

  if (error.error instanceof ErrorEvent) {
    // Client-side error
    errorMessage = `Client Error: ${error.error.message}`;
    console.error('Client Error:', error.error);
  } else {
    // Server-side error
    errorMessage = `Server Error: ${error.status} ${error.statusText}`;
    console.error('Server Error:', error);

    // Handle specific HTTP status codes
    switch (error.status) {
      case 401:
        handleUnauthorized();
        break;
      case 403:
        handleForbidden();
        break;
      case 404:
        handleNotFound();
        break;
      case 500:
        handleServerError();
        break;
      default:
        handleGenericError(error);
    }
  }

  // Show error in toast service
  try {
    const toastService = inject(ToastService);
    toastService.show(errorMessage);
  } catch (e) {
    console.error('HTTP Error:', errorMessage);
  }
}

function handleUnauthorized(): void {
  // Clear authentication data and redirect to login
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  // You can inject Router and navigate to login page
  console.warn('User unauthorized, redirecting to login...');
}

function handleForbidden(): void {
  console.warn('Access forbidden - user may not have required permissions');
}

function handleNotFound(): void {
  console.warn('Resource not found');
}

function handleServerError(): void {
  console.error('Internal server error occurred');
}

function handleGenericError(error: HttpErrorResponse): void {
  console.error('Generic error occurred:', error);
}

// Export utility functions for external use
export function hasActiveRequests(): boolean {
  return activeRequests > 0;
}

export function getActiveRequestsCount(): number {
  return activeRequests;
}
