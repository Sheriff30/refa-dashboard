import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces for type safety
export interface PropertyCategory {
  id: number;
  name_en: string;
  name_ar: string;
  name: string;
  slug: string;
}

export interface PropertyType {
  id: number;
  property_category_id: number;
  name_en: string;
  name_ar: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: PropertyCategory;
}

export interface PropertyTypesResponse {
  data: PropertyType[];
}

export interface PropertyTypesError {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PropertyTypesService {
  private readonly baseUrl = environment.apiBaseUrl;
  private propertyTypesCache: PropertyType[] = [];
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get all property types from the API
   * @returns Observable of property types array
   */
  getPropertyTypes(): Observable<PropertyType[]> {
    // Check if we have valid cached data
    if (this.propertyTypesCache.length > 0 && Date.now() < this.cacheExpiry) {
      return of(this.propertyTypesCache);
    }

    const url = `${this.baseUrl}/agent/property-types`;

    return this.http.get<PropertyTypesResponse>(url).pipe(
      map((response) => {
        this.propertyTypesCache = response.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get a specific property type by ID
   * @param id - The property type ID
   * @returns Observable of the property type or undefined if not found
   */
  getPropertyTypeById(id: number): Observable<PropertyType | undefined> {
    return this.getPropertyTypes().pipe(
      map((propertyTypes) => propertyTypes.find((type) => type.id === id))
    );
  }

  /**
   * Get active property types only
   * @returns Observable of active property types array
   */
  getActivePropertyTypes(): Observable<PropertyType[]> {
    return this.getPropertyTypes().pipe(
      map((propertyTypes) => propertyTypes.filter((type) => type.is_active))
    );
  }

  /**
   * Get property types by category
   * @param categoryId - The category ID
   * @returns Observable of property types in the specified category
   */
  getPropertyTypesByCategory(categoryId: number): Observable<PropertyType[]> {
    return this.getPropertyTypes().pipe(
      map((propertyTypes) =>
        propertyTypes.filter((type) => type.property_category_id === categoryId)
      )
    );
  }

  /**
   * Get property types by category slug
   * @param categorySlug - The category slug (e.g., 'residential', 'commercial')
   * @returns Observable of property types in the specified category
   */
  getPropertyTypesByCategorySlug(
    categorySlug: string
  ): Observable<PropertyType[]> {
    return this.getPropertyTypes().pipe(
      map((propertyTypes) =>
        propertyTypes.filter((type) => type.category.slug === categorySlug)
      )
    );
  }

  /**
   * Get property types by language (English or Arabic)
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of property types with localized names
   */
  getPropertyTypesByLanguage(
    language: 'en' | 'ar'
  ): Observable<PropertyType[]> {
    return this.getPropertyTypes().pipe(
      map((propertyTypes) =>
        propertyTypes.map((type) => ({
          ...type,
          name: language === 'en' ? type.name_en : type.name_ar,
          category: {
            ...type.category,
            name:
              language === 'en' ? type.category.name_en : type.category.name_ar,
          },
        }))
      )
    );
  }

  /**
   * Search property types by name (case-insensitive)
   * @param searchTerm - The search term
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of matching property types
   */
  searchPropertyTypes(
    searchTerm: string,
    language: 'en' | 'ar' = 'en'
  ): Observable<PropertyType[]> {
    return this.getPropertyTypes().pipe(
      map((propertyTypes) =>
        propertyTypes.filter((type) => {
          const name = language === 'en' ? type.name_en : type.name_ar;
          return name.toLowerCase().includes(searchTerm.toLowerCase());
        })
      )
    );
  }

  /**
   * Get all unique categories
   * @returns Observable of unique categories array
   */
  getCategories(): Observable<PropertyCategory[]> {
    return this.getPropertyTypes().pipe(
      map((propertyTypes) => {
        const categories = propertyTypes.map((type) => type.category);
        // Remove duplicates based on category ID
        return categories.filter(
          (category, index, self) =>
            index === self.findIndex((c) => c.id === category.id)
        );
      })
    );
  }

  /**
   * Clear the property types cache
   */
  clearCache(): void {
    this.propertyTypesCache = [];
    this.cacheExpiry = 0;
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred while fetching property types';

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
          errorMessage = 'Property types not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Property Types Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
