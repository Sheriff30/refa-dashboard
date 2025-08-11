import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces for type safety
export interface Amenity {
  id: number;
  name_en: string;
  name_ar: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AmenitiesResponse {
  data: Amenity[];
}

export interface AmenitiesError {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AmenitiesService {
  private readonly baseUrl = environment.apiBaseUrl;
  private amenitiesCache: Amenity[] = [];
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get all amenities from the API
   * @returns Observable of amenities array
   */
  getAmenities(): Observable<Amenity[]> {
    // Check if we have valid cached data
    if (this.amenitiesCache.length > 0 && Date.now() < this.cacheExpiry) {
      return of(this.amenitiesCache);
    }

    const url = `${this.baseUrl}/agent/amenities`;

    return this.http.get<AmenitiesResponse>(url).pipe(
      map((response) => {
        this.amenitiesCache = response.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get a specific amenity by ID
   * @param id - The amenity ID
   * @returns Observable of the amenity or undefined if not found
   */
  getAmenityById(id: number): Observable<Amenity | undefined> {
    return this.getAmenities().pipe(
      map((amenities) => amenities.find((amenity) => amenity.id === id))
    );
  }

  /**
   * Get active amenities only
   * @returns Observable of active amenities array
   */
  getActiveAmenities(): Observable<Amenity[]> {
    return this.getAmenities().pipe(
      map((amenities) => amenities.filter((amenity) => amenity.is_active))
    );
  }

  /**
   * Get amenities by language (English or Arabic)
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of amenities with localized names
   */
  getAmenitiesByLanguage(language: 'en' | 'ar'): Observable<Amenity[]> {
    return this.getAmenities().pipe(
      map((amenities) =>
        amenities.map((amenity) => ({
          ...amenity,
          name: language === 'en' ? amenity.name_en : amenity.name_ar,
        }))
      )
    );
  }

  /**
   * Search amenities by name (case-insensitive)
   * @param searchTerm - The search term
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of matching amenities
   */
  searchAmenities(
    searchTerm: string,
    language: 'en' | 'ar' = 'en'
  ): Observable<Amenity[]> {
    return this.getAmenities().pipe(
      map((amenities) =>
        amenities.filter((amenity) => {
          const name = language === 'en' ? amenity.name_en : amenity.name_ar;
          return name.toLowerCase().includes(searchTerm.toLowerCase());
        })
      )
    );
  }

  /**
   * Clear the amenities cache
   */
  clearCache(): void {
    this.amenitiesCache = [];
    this.cacheExpiry = 0;
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred while fetching amenities';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthenticated. Please log in again.';
          break;
        case 403:
          errorMessage = 'Forbidden. Agent access required.';
          break;
        case 404:
          errorMessage = 'Amenities not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Amenities Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
