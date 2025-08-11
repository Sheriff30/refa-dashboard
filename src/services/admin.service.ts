import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserRoleService } from './user-role.service';
import { environment } from '../environments/environment';

// Interfaces
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface Admin {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number?: string;
  national_id?: string;
  active: number;
  role?: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: Admin;
}

export interface AdminValidationError {
  message: string;
  errors: {
    [key: string]: string[];
  };
}

export interface AdminLoginError {
  error: string;
}

export interface AdminUnauthenticatedResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private userRoleService: UserRoleService
  ) {}

  loginAdmin(loginData: AdminLoginRequest): Observable<AdminLoginResponse> {
    return this.http
      .post<AdminLoginResponse>(`${this.baseUrl}/admin/login`, loginData)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 422) {
        const validationError = error.error as AdminValidationError;
        errorMessage = this.formatValidationErrors(validationError);
      } else if (error.status === 401) {
        const loginError = error.error as AdminLoginError;
        const unauthenticatedResponse =
          error.error as AdminUnauthenticatedResponse;

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
        const loginError = error.error as AdminLoginError;
        errorMessage = loginError?.error || 'ERRORS.ACCOUNT_NOT_ACTIVE';
      } else if (error.status === 409) {
        errorMessage = 'ERRORS.EMAIL_OR_PHONE_EXISTS';
      } else if (error.status === 500) {
        errorMessage = 'ERRORS.SERVER_ERROR';
      } else {
        errorMessage = 'ERRORS.GENERIC_ERROR';
      }
    }

    console.error('Admin service error:', error);
    return throwError(() => new Error(errorMessage));
  };

  private formatValidationErrors(
    validationError: AdminValidationError
  ): string {
    const errors: string[] = [];

    if (validationError.errors) {
      Object.keys(validationError.errors).forEach((field) => {
        const fieldErrors = validationError.errors[field];
        fieldErrors.forEach((error) => {
          const friendlyMessage = this.getFriendlyErrorMessage(field, error);
          errors.push(friendlyMessage);
        });
      });
    }

    return errors.length > 0
      ? errors.map((error) => `• ${error}`).join('<br>')
      : 'ERRORS.GENERIC_ERROR';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      name: 'Name',
      phone_number: 'Phone Number',
    };
    return labels[field] || field;
  }

  private getFriendlyErrorMessage(field: string, error: string): string {
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
    return 'ERRORS.GENERIC_ERROR';
  }
}
