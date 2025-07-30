import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Property Types, Categories, and Amenities interfaces
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
  category: {
    id: number;
    name_en: string;
    name_ar: string;
    name: string;
    slug: string;
  };
}

export interface PropertyCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyAmenity {
  id: number;
  name_en: string;
  name_ar: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyTypesResponse {
  data: PropertyType[];
}

export interface PropertyCategoriesResponse {
  data: PropertyCategory[];
}

export interface PropertyAmenitiesResponse {
  data: PropertyAmenity[];
}

// Create Property interfaces
export interface PropertyAmenityRequest {
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
  amenities: PropertyAmenityRequest[];
  images: File[];
  primary_image_index: number;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  url: string;
  thumbnail_url: string;
  is_primary: boolean;
  order: number;
  alt_text: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyAmenityResponse {
  id: number;
  name_en: string;
  name_ar: string;
  icon: string;
  distance: string;
  created_at: string;
  updated_at: string;
}

export interface UpdatedBy {
  id: number;
  name: string;
  email: string;
}

export interface PropertyCategoryResponse {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyTypeResponse {
  id: number;
  name_en: string;
  name_ar: string;
  name: string;
  slug: string;
  property_category_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: PropertyCategoryResponse;
}

export interface CreatePropertyResponse {
  id: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
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
  primary_image_url: string;
  created_at: string;
  updated_at: string;
  updated_by: UpdatedBy;
  category: PropertyCategoryResponse;
  type: PropertyTypeResponse;
  images: PropertyImage[];
  amenities: PropertyAmenityResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class AgentPropertiesService {
  private readonly baseUrl = 'http://dev.refa.sa:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all active property types
   */
  getPropertyTypes(): Observable<PropertyTypesResponse> {
    const url = `${this.baseUrl}/agent/property-types`;

    return this.http.get<PropertyTypesResponse>(url);
  }

  /**
   * Get all active property categories
   */
  getPropertyCategories(): Observable<PropertyCategoriesResponse> {
    const url = `${this.baseUrl}/agent/categories`;

    return this.http.get<PropertyCategoriesResponse>(url);
  }

  /**
   * Get all active property amenities
   */
  getPropertyAmenities(): Observable<PropertyAmenitiesResponse> {
    const url = `${this.baseUrl}/agent/amenities`;

    return this.http.get<PropertyAmenitiesResponse>(url);
  }

  /**
   * Create a new property
   */
  createProperty(
    propertyData: CreatePropertyRequest
  ): Observable<CreatePropertyResponse> {
    const url = `${this.baseUrl}/agent/properties`;

    return this.http.post<CreatePropertyResponse>(url, propertyData);
  }
}
