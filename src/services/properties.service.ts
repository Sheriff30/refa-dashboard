import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private propertiesData: any[] = [];
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Load properties from JSON file
  loadProperties(): Observable<any[]> {
    if (this.propertiesData.length > 0) {
      return of(this.propertiesData);
    }
    return this.http.get<any[]>('assets/data/properties.json').pipe(
      tap((data) => (this.propertiesData = data)),
      catchError((error) => {
        console.error('Error loading properties:', error);
        return of([]);
      })
    );
  }

  getProperties(): Observable<any[]> {
    return this.loadProperties();
  }

  /**
   * Get agent properties from API with pagination and search
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 15)
   * @param search - Search term (optional)
   * @returns Observable of agent properties response
   */
  getAgentProperties(
    page: number = 1,
    perPage: number = 15,
    search?: string
  ): Observable<any> {
    let url = `${this.baseUrl}/agent/properties?page=${page}&per_page=${perPage}`;

    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    return this.http.get<any>(url).pipe(
      catchError((error) => {
        console.error('Error fetching agent properties:', error);
        return of({ data: [], links: {}, meta: {} });
      })
    );
  }

  getPropertyById(id: number): Observable<any | undefined> {
    return this.loadProperties().pipe(
      map((properties) => properties.find((p) => p.id === id))
    );
  }

  updateProperty(id: number, property: any): Observable<boolean> {
    const index = this.propertiesData.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.propertiesData[index] = {
        ...this.propertiesData[index],
        ...property,
      };
      return of(true);
    }
    return of(false);
  }

  deleteProperty(id: number): Observable<boolean> {
    const index = this.propertiesData.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.propertiesData.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  /**
   * Delete a property by ID using the API
   * @param id - The property ID to delete
   * @returns Observable of the delete response
   */
  deleteAgentProperty(id: number): Observable<any> {
    const url = `${this.baseUrl}/agent/properties/${id}`;
    return this.http.delete<any>(url).pipe(
      catchError((error) => {
        console.error('Error deleting property:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single property by ID using the API
   * @param id - The property ID to retrieve
   * @returns Observable of the property data
   */
  getAgentPropertyById(id: number): Observable<any> {
    const url = `${this.baseUrl}/agent/properties/${id}`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        console.error('Error fetching property:', error);
        return throwError(() => error);
      })
    );
  }
}
