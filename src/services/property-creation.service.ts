import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces for type safety
export interface PropertyAmenity {
  id: number;
  distance: string;
}

export interface CreatePropertyRequest {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  property_category_id: number;
  property_type_id: number;
  area: number;
  available_from: string;
  furnishing_status: string;
  bedrooms: number;
  bathrooms: number;
  floor_number: number;
  total_floors: number;
  insurance_amount: number;
  fal_number: string;
  ad_number: string;
  annual_rent: number;
  building_number: string;
  country: string;
  region: string;
  city: string;
  district: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  amenities: PropertyAmenity[];
  images: string[];
  primary_image_index: number;
}

export interface CreatePropertyResponse {
  message: string;
  property: {
    id: number;
    name_en: string;
    name_ar: string;
    description_en: string;
    description_ar: string;
    property_category_id: number;
    property_type_id: number;
    area: number;
    available_from: string;
    furnishing_status: string;
    bedrooms: number;
    bathrooms: number;
    floor_number: number;
    total_floors: number;
    insurance_amount: number;
    fal_number: string;
    ad_number: string;
    annual_rent: number;
    building_number: string;
    country: string;
    region: string;
    city: string;
    district: string;
    postal_code: string;
    latitude: number;
    longitude: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface PropertyCreationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class PropertyCreationService {
  private readonly baseUrl = 'http://dev.refa.sa:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Create a new property
   * @param propertyData - The property data to create
   * @returns Observable of the creation response
   */
  createProperty(
    propertyData: CreatePropertyRequest
  ): Observable<CreatePropertyResponse> {
    const url = `${this.baseUrl}/agent/properties`;
    const headers = this.getAuthHeaders();

    return this.http
      .post<CreatePropertyResponse>(url, propertyData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get authentication headers for API requests
   * @returns HttpHeaders with authentication token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred while creating the property';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = this.formatValidationErrors(error.error);
          break;
        case 401:
          errorMessage = 'Unauthenticated. Please log in again.';
          break;
        case 403:
          errorMessage = 'Forbidden. Agent access required.';
          break;
        case 422:
          errorMessage = this.formatValidationErrors(error.error);
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Property Creation Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };

  /**
   * Format validation errors from the server
   * @param error - The error response from server
   * @returns Formatted error message
   */
  private formatValidationErrors(error: any): string {
    if (error.errors && typeof error.errors === 'object') {
      const errorMessages: string[] = [];

      Object.keys(error.errors).forEach((field) => {
        if (Array.isArray(error.errors[field])) {
          errorMessages.push(
            `${this.getFieldLabel(field)}: ${error.errors[field].join(', ')}`
          );
        }
      });

      return errorMessages.join('\n');
    }

    return error.message || 'Validation error occurred';
  }

  /**
   * Get user-friendly field labels
   * @param field - The field name
   * @returns User-friendly field label
   */
  private getFieldLabel(field: string): string {
    const fieldLabels: { [key: string]: string } = {
      name_en: 'Property Name (English)',
      name_ar: 'Property Name (Arabic)',
      description_en: 'Description (English)',
      description_ar: 'Description (Arabic)',
      property_category_id: 'Property Category',
      property_type_id: 'Property Type',
      area: 'Area',
      available_from: 'Available From',
      furnishing_status: 'Furnishing Status',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      floor_number: 'Floor Number',
      total_floors: 'Total Floors',
      insurance_amount: 'Insurance Amount',
      fal_number: 'FAL Number',
      ad_number: 'Advertising Number',
      annual_rent: 'Annual Rent',
      building_number: 'Building Number',
      country: 'Country',
      region: 'Region',
      city: 'City',
      district: 'District',
      postal_code: 'Postal Code',
      latitude: 'Latitude',
      longitude: 'Longitude',
      amenities: 'Amenities',
      images: 'Images',
    };

    return fieldLabels[field] || field;
  }
}
