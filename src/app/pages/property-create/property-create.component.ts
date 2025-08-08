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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertiesService: PropertiesService,
    private amenitiesService: AmenitiesService,
    private languageService: LanguageService,
    private propertyTypesService: PropertyTypesService,
    private categoriesService: CategoriesService,
    private propertyCreationService: PropertyCreationService
  ) {
    this.propertyForm = this.fb.group({
      // Names
      propertyName: ['', Validators.required],
      propertyNameAr: ['', Validators.required],
      // Category/Type
      propertyCategory: ['', Validators.required],
      propertyType: ['', Validators.required],
      // Area & availability & furnishing
      propertySize: ['', [Validators.required, Validators.min(0)]],
      availableFrom: ['', Validators.required],
      furnishment: ['', Validators.required],
      // Beds/Baths/Floors
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      floorNumber: ['', [Validators.required, Validators.min(0)]],
      totalFloors: ['', [Validators.required, Validators.min(0)]],
      // Pricing
      annualRent: ['', [Validators.required, Validators.min(0)]],
      depositAmount: ['', [Validators.required, Validators.min(0)]],
      // Descriptions
      description: ['', Validators.required],
      descriptionAr: ['', Validators.required],
      // Address/Location
      addressLine1: ['', Validators.required],
      buildingName: ['', Validators.required],
      country: ['Saudi Arabia', Validators.required],
      region: ['', Validators.required],
      city: ['', Validators.required],
      district: ['', Validators.required],
      postalCode: ['', Validators.required],
      latitude: [this.defaultLat, Validators.required],
      longitude: [this.defaultLng, Validators.required],
      // Media
      images: [''],
      // Legal
      falLicenseId: ['', Validators.required],
      advertisingLicenseNo: ['', Validators.required],
      declaration: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    // Load amenities, property types, and categories
    this.loadAmenities();
    this.loadPropertyTypes();
    this.loadCategories();
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
          this.router.navigate(['/agent/properties']);
        },
        error: (error) => {
          console.log(error);
          // Handle error UI if needed
        },
      });
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
}
