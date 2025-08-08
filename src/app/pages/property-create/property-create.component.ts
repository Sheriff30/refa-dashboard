import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';
import { PropertiesService } from '../../../services/properties.service';
import {
  AmenitiesService,
  Amenity,
} from '../../../services/amenitites.service';
import { LanguageService } from '../../../services/language.service';
import {
  PropertyTypesService,
  PropertyType,
  PropertyCategory,
} from '../../../services/property-types.service';
import {
  CategoriesService,
  Category,
} from '../../../services/categories.service';
import {
  PropertyCreationService,
  CreatePropertyRequest,
  PropertyAmenity,
} from '../../../services/property-creation.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-property-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './property-create.component.html',
  styleUrl: './property-create.component.scss',
})
export class PropertyCreateComponent implements OnInit, AfterViewInit {
  propertyForm: FormGroup;
  private map!: L.Map;
  private marker!: L.Marker;
  defaultLat = 24.7136; // Default latitude for Saudi Arabia
  defaultLng = 46.6753; // Default longitude for Saudi Arabia
  uploadedFiles: File[] = [];
  amenities: Amenity[] = [];
  propertyTypes: PropertyType[] = [];
  propertyCategories: PropertyCategory[] = [];
  categories: Category[] = [];
  backendErrors: any = {};
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertiesService: PropertiesService,
    private amenitiesService: AmenitiesService,
    private languageService: LanguageService,
    private propertyTypesService: PropertyTypesService,
    private categoriesService: CategoriesService,
    private propertyCreationService: PropertyCreationService,
    private toastService: ToastService
  ) {
    this.propertyForm = this.fb.group({
      // Names
      propertyName: ['test', Validators.required],
      propertyNameAr: ['test', Validators.required],
      // Category/Type
      propertyCategory: ['', Validators.required],
      propertyType: ['', Validators.required],
      // Area & availability & furnishing
      propertySize: ['123', [Validators.required, Validators.min(0)]],
      availableFrom: ['', Validators.required],
      furnishment: ['', Validators.required],
      // Beds/Baths/Floors
      bedrooms: ['123', [Validators.required, Validators.min(0)]],
      bathrooms: ['123', [Validators.required, Validators.min(0)]],
      floorNumber: ['1234', [Validators.required, Validators.min(0)]],
      totalFloors: ['123', [Validators.required, Validators.min(0)]],
      // Pricing
      annualRent: ['123', [Validators.required, Validators.min(0)]],
      depositAmount: ['123', [Validators.required, Validators.min(0)]],
      // Descriptions
      description: ['test', Validators.required],
      descriptionAr: ['test', Validators.required],
      // Address/Location
      addressLine1: ['test', Validators.required],
      buildingName: ['test', Validators.required],
      country: ['Saudi Arabia', Validators.required],
      region: ['test', Validators.required],
      city: ['test', Validators.required],
      district: ['test', Validators.required],
      postalCode: ['test', Validators.required],
      latitude: [this.defaultLat, Validators.required],
      longitude: [this.defaultLng, Validators.required],
      // Media
      images: [''],
      // Legal
      falLicenseId: ['123', Validators.required],
      advertisingLicenseNo: ['123', Validators.required],
      declaration: [true, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    // Load amenities, property types, and categories
    this.loadAmenities();
    this.loadPropertyTypes();
    this.loadCategories();

    // Listen to form value changes to clear backend errors
    this.setupFormValueChangeListener();
  }

  private loadAmenities(): void {
    this.amenitiesService.getAmenities().subscribe({
      next: (amenities: Amenity[]) => {
        this.amenities = amenities;
        this.setupAmenitiesForm();

        // Also log active amenities
        this.amenitiesService.getActiveAmenities().subscribe({
          next: (activeAmenities) => {},
          error: (error) => {
            console.error('Error loading active amenities:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error loading amenities:', error);
      },
    });
  }

  private setupAmenitiesForm(): void {
    // Add form controls for each amenity
    this.amenities.forEach((amenity) => {
      this.propertyForm.addControl(
        `amenity_${amenity.id}`,
        this.fb.control(false)
      );
      this.propertyForm.addControl(
        `amenity_distance_${amenity.id}`,
        this.fb.control('')
      );
    });
  }

  private loadPropertyTypes(): void {
    this.propertyTypesService.getPropertyTypes().subscribe({
      next: (propertyTypes: PropertyType[]) => {
        this.propertyTypes = propertyTypes;
      },
      error: (error) => {
        console.error('Error loading property types:', error);
      },
    });
  }

  private loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories;
        this.propertyCategories = categories as any; // For backward compatibility
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      },
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    // Configure marker icon
    const iconRetinaUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
    const iconUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    const shadowUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;

    // Initialize map
    this.map = L.map('property-map').setView(
      [this.defaultLat, this.defaultLng],
      12
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Add initial marker
    this.marker = L.marker([this.defaultLat, this.defaultLng]).addTo(this.map);

    // Handle map clicks
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.propertyForm.patchValue({
        latitude: lat,
        longitude: lng,
      });
    });
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.backendErrors = {};

    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.propertyForm);

    if (this.propertyForm.valid) {
      const formValue = this.propertyForm.value;

      // Process amenities data
      const selectedAmenities = this.getSelectedAmenities(formValue);

      // Convert images to base64
      const imagesBase64 = await this.convertFilesToBase64(this.uploadedFiles);

      const propertyData: CreatePropertyRequest = {
        name_en: formValue.propertyName,
        name_ar: formValue.propertyNameAr,
        description_en: formValue.description,
        description_ar: formValue.descriptionAr,
        property_category_id:
          this.getCategoryIdBySlug(formValue.propertyCategory) || 0,
        property_type_id: Number(formValue.propertyType),
        area: Number(formValue.propertySize),
        available_from: formValue.availableFrom,
        furnishing_status: formValue.furnishment,
        bedrooms: Number(formValue.bedrooms),
        bathrooms: Number(formValue.bathrooms),
        floor_number: Number(formValue.floorNumber),
        total_floors: Number(formValue.totalFloors),
        insurance_amount: Number(formValue.depositAmount),
        fal_number: formValue.falLicenseId,
        ad_number: formValue.advertisingLicenseNo,
        annual_rent: Number(formValue.annualRent),
        building_number: formValue.buildingName,
        country: formValue.country,
        region: formValue.region,
        city: formValue.city,
        district: formValue.district,
        postal_code: formValue.postalCode,
        latitude: Number(formValue.latitude),
        longitude: Number(formValue.longitude),
        is_active: true,
        amenities: selectedAmenities,
        images: imagesBase64,
        primary_image_index: 0,
      };

      this.propertyCreationService.createProperty(propertyData).subscribe({
        next: (response) => {
          console.log(response);
          this.toastService.show('Property submitted successfully!');
          this.router.navigate(['/agent/properties']);
        },
        error: (error) => {
          console.log(error);
          this.handleBackendErrors(error);
          // Scroll to first error after handling backend errors
          setTimeout(() => {
            this.scrollToFirstError();
          }, 100);
        },
      });
    } else {
      // Scroll to first error for form validation errors
      setTimeout(() => {
        this.scrollToFirstError();
      }, 100);
    }
  }

  private getSelectedAmenities(formValue: any): PropertyAmenity[] {
    const selectedAmenities: PropertyAmenity[] = [];

    Object.keys(formValue).forEach((key) => {
      if (
        key.startsWith('amenity_') &&
        !key.includes('distance') &&
        formValue[key] === true
      ) {
        const amenityId = parseInt(key.replace('amenity_', ''));
        const distanceKey = `amenity_distance_${amenityId}`;
        const distance = formValue[distanceKey] || '';

        selectedAmenities.push({
          id: amenityId,
          distance: distance,
        });
      }
    });

    return selectedAmenities;
  }

  getAmenityIconClass(icon: string): string {
    // Map icon names to FontAwesome classes
    const iconMap: { [key: string]: string } = {
      'swimming-pool': 'fas fa-swimming-pool',
      dumbbell: 'fas fa-dumbbell',
      parking: 'fas fa-parking',
      'shield-alt': 'fas fa-shield-alt',
      elevator: 'fas fa-elevator',
      tree: 'fas fa-tree',
      home: 'fas fa-home',
      couch: 'fas fa-couch',
      snowflake: 'fas fa-snowflake',
      'temperature-high': 'fas fa-temperature-high',
      wifi: 'fas fa-wifi',
      paw: 'fas fa-paw',
      wheelchair: 'fas fa-wheelchair',
      tshirt: 'fas fa-tshirt',
      tools: 'fas fa-tools',
    };

    return iconMap[icon] || `fas fa-${icon}`;
  }

  getAmenityName(amenity: Amenity): string {
    const currentLang = this.languageService.translate.currentLang;
    return currentLang === 'ar' ? amenity.name_ar : amenity.name_en;
  }

  getPropertyTypeName(propertyType: PropertyType): string {
    const currentLang = this.languageService.translate.currentLang;
    return currentLang === 'ar' ? propertyType.name_ar : propertyType.name_en;
  }

  getPropertyTypesByCategory(categorySlug: string): PropertyType[] {
    if (!categorySlug || categorySlug === '') {
      return [];
    }

    // Try exact match first
    let filteredTypes = this.propertyTypes.filter(
      (type) => type.category.slug === categorySlug
    );

    // If no results, try case-insensitive match
    if (filteredTypes.length === 0) {
      filteredTypes = this.propertyTypes.filter(
        (type) =>
          type.category.slug.toLowerCase() === categorySlug.toLowerCase()
      );
    }

    // If still no results, try matching by category name
    if (filteredTypes.length === 0) {
      filteredTypes = this.propertyTypes.filter(
        (type) =>
          type.category.name_en.toLowerCase() === categorySlug.toLowerCase() ||
          type.category.name_ar === categorySlug
      );
    }

    return filteredTypes;
  }

  getCategoryName(category: PropertyCategory | Category): string {
    const currentLang = this.languageService.translate.currentLang;
    return currentLang === 'ar' ? category.name_ar : category.name_en;
  }

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedCategory = select.value;

    // Reset property type when category changes
    this.propertyForm.patchValue({ propertyType: '' });
  }

  onAmenityChange(amenityId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const distanceControlName = `amenity_distance_${amenityId}`;

    if (!checkbox.checked) {
      // Clear distance when amenity is unchecked
      this.propertyForm.patchValue({ [distanceControlName]: '' });
    }
  }

  hasSelectedAmenities(): boolean {
    const formValue = this.propertyForm.value;
    return Object.keys(formValue).some(
      (key) =>
        key.startsWith('amenity_') &&
        !key.includes('distance') &&
        formValue[key] === true
    );
  }

  getSelectedAmenitiesForDisplay(): Amenity[] {
    const formValue = this.propertyForm.value;
    const selectedAmenities: Amenity[] = [];

    Object.keys(formValue).forEach((key) => {
      if (
        key.startsWith('amenity_') &&
        !key.includes('distance') &&
        formValue[key] === true
      ) {
        const amenityId = parseInt(key.replace('amenity_', ''));
        const amenity = this.amenities.find((a) => a.id === amenityId);
        if (amenity) {
          selectedAmenities.push(amenity);
        }
      }
    });

    return selectedAmenities;
  }

  private getCategoryIdBySlug(slug: string): number | null {
    const category = this.categories.find(
      (c) => c.slug.toLowerCase() === (slug || '').toLowerCase()
    );
    return category ? category.id : null;
  }

  private convertFilesToBase64(files: File[]): Promise<string[]> {
    const promises = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        })
    );
    return Promise.all(promises);
  }

  onCancel(): void {
    this.router.navigate(['/agent/properties']);
  }

  onSaveDraft(): void {
    // Save as draft functionality
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.uploadedFiles = [...this.uploadedFiles, ...newFiles];

      // Update form control value
      const formControl = this.propertyForm.get('images');
      if (formControl) {
        formControl.setValue(this.uploadedFiles);
      }
    }
  }

  removeFile(file: File): void {
    this.uploadedFiles = this.uploadedFiles.filter((f) => f !== file);

    // Update form control value
    const formControl = this.propertyForm.get('images');
    if (formControl) {
      formControl.setValue(this.uploadedFiles);
    }
  }

  // Add file size pipe
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private handleBackendErrors(error: any): void {
    if (error?.error?.errors) {
      // Handle validation errors from backend
      this.backendErrors = this.mapBackendErrorsToFormFields(
        error.error.errors
      );
    } else if (error?.error?.message) {
      // Handle general error message
      this.backendErrors = { general: [error.error.message] };
    } else {
      // Handle unknown errors
      this.backendErrors = {
        general: ['An unexpected error occurred. Please try again.'],
      };
    }
  }

  private mapBackendErrorsToFormFields(backendErrors: any): any {
    const fieldMapping: { [key: string]: string } = {
      name_en: 'propertyName',
      name_ar: 'propertyNameAr',
      description_en: 'description',
      description_ar: 'descriptionAr',
      property_category_id: 'propertyCategory',
      property_type_id: 'propertyType',
      area: 'propertySize',
      available_from: 'availableFrom',
      furnishing_status: 'furnishment',
      bedrooms: 'bedrooms',
      bathrooms: 'bathrooms',
      floor_number: 'floorNumber',
      total_floors: 'totalFloors',
      insurance_amount: 'depositAmount',
      fal_number: 'falLicenseId',
      ad_number: 'advertisingLicenseNo',
      annual_rent: 'annualRent',
      building_number: 'buildingName',
      country: 'country',
      region: 'region',
      city: 'city',
      district: 'district',
      postal_code: 'postalCode',
      latitude: 'latitude',
      longitude: 'longitude',
    };

    const mappedErrors: any = {};

    Object.keys(backendErrors).forEach((backendField) => {
      const formField = fieldMapping[backendField] || backendField;
      mappedErrors[formField] = backendErrors[backendField];
    });

    return mappedErrors;
  }

  getBackendError(fieldName: string): string | null {
    if (
      this.backendErrors[fieldName] &&
      this.backendErrors[fieldName].length > 0
    ) {
      return this.backendErrors[fieldName][0];
    }
    return null;
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.propertyForm.get(fieldName);
    const hasFormError =
      control?.invalid &&
      (control?.dirty || control?.touched || this.submitted);
    const hasBackendError = this.getBackendError(fieldName) !== null;
    return hasFormError || hasBackendError;
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.propertyForm.get(fieldName);

    // Check backend errors first
    const backendError = this.getBackendError(fieldName);
    if (backendError) {
      return backendError;
    }

    // Check form validation errors
    if (
      control?.errors &&
      (control?.dirty || control?.touched || this.submitted)
    ) {
      if (control.errors['required']) {
        return this.getRequiredErrorMessage(fieldName);
      }
      if (control.errors['min']) {
        return `${fieldName} must be greater than or equal to ${control.errors['min'].min}`;
      }
      // Add more validation error types as needed
    }

    return '';
  }

  private getRequiredErrorMessage(fieldName: string): string {
    const errorMessages: { [key: string]: string } = {
      propertyName: 'Property name is required',
      propertyNameAr: 'Property name (Arabic) is required',
      propertyCategory: 'Property category is required',
      propertyType: 'Property type is required',
      propertySize: 'Property size is required',
      availableFrom: 'Available date is required',
      furnishment: 'Furnishment is required',
      bedrooms: 'Number of bedrooms is required',
      bathrooms: 'Number of bathrooms is required',
      floorNumber: 'Floor number is required',
      totalFloors: 'Total floors is required',
      annualRent: 'Annual rent is required',
      depositAmount: 'Deposit amount is required',
      description: 'Property description is required',
      descriptionAr: 'Property description (Arabic) is required',
      addressLine1: 'Address is required',
      buildingName: 'Building name is required',
      region: 'Region is required',
      city: 'City is required',
      district: 'District is required',
      postalCode: 'Postal code is required',
      falLicenseId: 'FAL License ID is required',
      advertisingLicenseNo: 'Advertising License No is required',
      declaration: 'You must accept the declaration',
    };

    return errorMessages[fieldName] || `${fieldName} is required`;
  }

  private scrollToFirstError(): void {
    // Find the first field with an error
    const errorField = this.findFirstErrorField();

    if (errorField) {
      // Scroll to the error field with smooth animation
      errorField.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Add a brief focus to highlight the field
      setTimeout(() => {
        errorField.focus();
      }, 500);
    }
  }

  private findFirstErrorField(): HTMLElement | null {
    // Check form validation errors first
    const formControls = this.propertyForm.controls;
    for (const fieldName in formControls) {
      const control = formControls[fieldName];
      if (
        control.invalid &&
        (control.dirty || control.touched || this.submitted)
      ) {
        const element = this.getFieldElement(fieldName);
        if (element) return element;
      }
    }

    // Check backend errors
    for (const fieldName in this.backendErrors) {
      if (fieldName !== 'general' && this.backendErrors[fieldName]) {
        const element = this.getFieldElement(fieldName);
        if (element) return element;
      }
    }

    return null;
  }

  private getFieldElement(fieldName: string): HTMLElement | null {
    // Try different selectors to find the field element
    const selectors = [
      `[formControlName="${fieldName}"]`,
      `[name="${fieldName}"]`,
      `#${fieldName}`,
      `[id="${fieldName}"]`,
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) return element;
    }

    return null;
  }

  private setupFormValueChangeListener(): void {
    // Listen to value changes on all form controls
    Object.keys(this.propertyForm.controls).forEach((fieldName) => {
      const control = this.propertyForm.get(fieldName);
      if (control) {
        control.valueChanges.subscribe(() => {
          // Clear backend error for this field when user starts typing
          if (this.backendErrors[fieldName]) {
            delete this.backendErrors[fieldName];
          }
        });
      }
    });
  }
}
