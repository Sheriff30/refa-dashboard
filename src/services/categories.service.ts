import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces for type safety
export interface Category {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CategoriesResponse {
  data: Category[];
}

export interface CategoriesError {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly baseUrl = environment.apiBaseUrl;
  private categoriesCache: Category[] = [];
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get all categories from the API
   * @returns Observable of categories array
   */
  getCategories(): Observable<Category[]> {
    // Check if we have valid cached data
    if (this.categoriesCache.length > 0 && Date.now() < this.cacheExpiry) {
      return of(this.categoriesCache);
    }

    const url = `${this.baseUrl}/agent/categories`;

    return this.http.get<CategoriesResponse>(url).pipe(
      map((response) => {
        this.categoriesCache = response.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get a specific category by ID
   * @param id - The category ID
   * @returns Observable of the category or undefined if not found
   */
  getCategoryById(id: number): Observable<Category | undefined> {
    return this.getCategories().pipe(
      map((categories) => categories.find((category) => category.id === id))
    );
  }

  /**
   * Get a specific category by slug
   * @param slug - The category slug
   * @returns Observable of the category or undefined if not found
   */
  getCategoryBySlug(slug: string): Observable<Category | undefined> {
    return this.getCategories().pipe(
      map((categories) => categories.find((category) => category.slug === slug))
    );
  }

  /**
   * Get categories by language (English or Arabic)
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of categories with localized names
   */
  getCategoriesByLanguage(language: 'en' | 'ar'): Observable<Category[]> {
    return this.getCategories().pipe(
      map((categories) =>
        categories.map((category) => ({
          ...category,
          name: language === 'en' ? category.name_en : category.name_ar,
        }))
      )
    );
  }

  /**
   * Search categories by name (case-insensitive)
   * @param searchTerm - The search term
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of matching categories
   */
  searchCategories(
    searchTerm: string,
    language: 'en' | 'ar' = 'en'
  ): Observable<Category[]> {
    return this.getCategories().pipe(
      map((categories) =>
        categories.filter((category) => {
          const name = language === 'en' ? category.name_en : category.name_ar;
          return name.toLowerCase().includes(searchTerm.toLowerCase());
        })
      )
    );
  }

  /**
   * Get category names as a simple array for dropdowns
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of category names array
   */
  getCategoryNames(language: 'en' | 'ar' = 'en'): Observable<string[]> {
    return this.getCategories().pipe(
      map((categories) =>
        categories.map((category) =>
          language === 'en' ? category.name_en : category.name_ar
        )
      )
    );
  }

  /**
   * Get categories as key-value pairs for dropdowns
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of category key-value pairs
   */
  getCategoriesAsKeyValue(
    language: 'en' | 'ar' = 'en'
  ): Observable<{ [key: string]: string }> {
    return this.getCategories().pipe(
      map((categories) => {
        const keyValue: { [key: string]: string } = {};
        categories.forEach((category) => {
          const name = language === 'en' ? category.name_en : category.name_ar;
          keyValue[category.slug] = name;
        });
        return keyValue;
      })
    );
  }

  /**
   * Clear the categories cache
   */
  clearCache(): void {
    this.categoriesCache = [];
    this.cacheExpiry = 0;
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred while fetching categories';

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
          errorMessage = 'Categories not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    console.error('Categories Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
