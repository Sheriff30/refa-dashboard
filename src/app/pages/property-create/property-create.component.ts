import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import { PropertiesService } from '../../../services/properties.service';
import {
  AgentPropertiesService,
  CreatePropertyRequest,
} from '../../../services/agent-properties.service';

@Component({
  selector: 'app-property-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
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
  selectedAmenities: any[] = []; // Will store selected amenities
  availableAmenities: any[] = []; // Available amenities from API
  availablePropertyTypes: any[] = []; // Available property types from API
  availablePropertyCategories: any[] = []; // Available property categories from API
  filteredPropertyTypes: any[] = []; // Property types filtered by selected category

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertiesService: PropertiesService,
    private agentPropertiesService: AgentPropertiesService,
    private translateService: TranslateService
  ) {
    this.propertyForm = this.fb.group({
      // Basic Information
      name_en: ['', Validators.required],
      name_ar: ['', Validators.required],
      description_en: ['', Validators.required],
      description_ar: ['', Validators.required],
      property_category_id: ['', Validators.required],
      property_type_id: ['', Validators.required],
      area: ['', [Validators.required, Validators.min(0)]],
      available_from: ['', Validators.required],
      furnishing_status: ['', Validators.required],

      // Property Details
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      floor_number: ['', [Validators.required, Validators.min(0)]],
      total_floors: ['', [Validators.required, Validators.min(0)]],
      insurance_amount: ['', [Validators.required, Validators.min(0)]],
      fal_number: ['', Validators.required],
      ad_number: ['', Validators.required],
      annual_rent: ['', [Validators.required, Validators.min(0)]],

      // Location Details
      building_number: ['', Validators.required],
      country: ['Saudi Arabia', Validators.required],
      region: ['', Validators.required],
      city: ['', Validators.required],
      district: ['', Validators.required],
      postal_code: ['', Validators.required],
      latitude: [this.defaultLat, Validators.required],
      longitude: [this.defaultLng, Validators.required],

      // Images and Amenities
      images: [''],
      primary_image_index: [0],
      amenities: [[]],

      // Status
      is_active: [true],

      // Additional fields for form handling
      declaration: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    // Load property types from API, static categories, and amenities from API
    this.loadPropertyTypes();
    this.loadPropertyCategories();
    this.loadPropertyAmenities();
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

  onSubmit(): void {
    if (this.propertyForm.valid) {
      console.log('Form submitted:', this.propertyForm.value);

      // Prepare the request data
      const formData = this.propertyForm.value;

      // Convert amenities to the required format
      const amenities = this.selectedAmenities.map((amenity) => ({
        id: amenity.id,
        distance: amenity.distance || '5 min walk',
      }));

      // Convert images to base64 strings (for demo purposes)
      const images = this.uploadedFiles.map((file) => {
        // In a real app, you'd upload files to a server and get URLs
        // For now, we'll use placeholder strings
        return 'https://example.com/placeholder-image.jpg';
      });

      const propertyRequest: CreatePropertyRequest = {
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        description_en: formData.description_en,
        description_ar: formData.description_ar,
        property_category_id: parseInt(formData.property_category_id),
        property_type_id: parseInt(formData.property_type_id),
        area: parseFloat(formData.area),
        available_from: formData.available_from,
        furnishing_status: formData.furnishing_status,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        floor_number: parseInt(formData.floor_number),
        total_floors: parseInt(formData.total_floors),
        insurance_amount: parseFloat(formData.insurance_amount),
        fal_number: formData.fal_number,
        ad_number: formData.ad_number,
        annual_rent: parseFloat(formData.annual_rent),
        building_number: formData.building_number,
        country: formData.country,
        region: formData.region,
        city: formData.city,
        district: formData.district,
        postal_code: formData.postal_code,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        is_active: formData.is_active,
        amenities: amenities,
        images: this.uploadedFiles,
        primary_image_index: formData.primary_image_index,
      };

      console.log('Property request to send:', propertyRequest);

      // Send the request
      this.agentPropertiesService.createProperty(propertyRequest).subscribe({
        next: (response) => {
          console.log('Property created successfully:', response);
          // Navigate to properties list or show success message
          this.router.navigate(['/agent/properties']);
        },
        error: (error) => {
          console.error('Error creating property:', error);
          // Handle error (show toast, etc.)
        },
      });
    } else {
      console.log('Form is invalid:', this.propertyForm.errors);
      // Mark all fields as touched to show validation errors
      Object.keys(this.propertyForm.controls).forEach((key) => {
        const control = this.propertyForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/agent/properties']);
  }

  onSaveDraft(): void {
    console.log('Saving as draft:', this.propertyForm.value);
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

  // Load property types
  loadPropertyTypes(): void {
    this.agentPropertiesService.getPropertyTypes().subscribe({
      next: (response) => {
        console.log('Property Types Response:', response);
        console.log('Property Types Data:', response.data);
        // Store property types for dropdown
        this.availablePropertyTypes = response.data;
        this.filteredPropertyTypes = response.data; // Initially show all types
        console.log('Available Property Types:', this.availablePropertyTypes);
      },
      error: (error) => {
        console.error('Error loading property types:', error);
      },
    });
  }

  // Handle category change to filter property types
  onCategoryChange(): void {
    const selectedCategoryId = this.propertyForm.get(
      'property_category_id'
    )?.value;

    console.log(
      'Selected Category ID:',
      selectedCategoryId,
      typeof selectedCategoryId
    );

    if (selectedCategoryId) {
      // Convert string to number for comparison
      const categoryIdNum = parseInt(selectedCategoryId);
      console.log('Category ID as number:', categoryIdNum);

      // Filter property types by selected category
      this.filteredPropertyTypes = this.availablePropertyTypes.filter(
        (type) => type.property_category_id === categoryIdNum
      );

      console.log('Filtered Property Types:', this.filteredPropertyTypes);
    } else {
      // Show all types if no category selected
      this.filteredPropertyTypes = this.availablePropertyTypes;
    }
    // Reset property type selection when category changes
    this.propertyForm.get('property_type_id')?.setValue('');
  }

  // Load property categories
  loadPropertyCategories(): void {
    // Use static categories data instead of API call
    const staticCategories = [
      {
        id: 2,
        name: 'Residential',
        name_ar: 'سكني',
        description:
          'Residential properties including apartments, villas, and houses',
      },
      {
        id: 3,
        name: 'Commercial',
        name_ar: 'تجاري',
        description:
          'Commercial properties including offices, shops, and malls',
      },
      {
        id: 4,
        name: 'Industrial',
        name_ar: 'صناعي',
        description: 'Industrial properties including warehouses and factories',
      },
      {
        id: 5,
        name: 'Land',
        name_ar: 'أرض',
        description: 'Vacant land for development or investment',
      },
    ];

    console.log('Static Property Categories:', staticCategories);
    this.availablePropertyCategories = staticCategories;
  }

  // Load property amenities
  loadPropertyAmenities(): void {
    this.agentPropertiesService.getPropertyAmenities().subscribe({
      next: (response) => {
        console.log('Property Amenities Response:', response);
        console.log('Property Amenities Data:', response.data);
        // Store amenities for selection
        this.availableAmenities = response.data;
        console.log('Available Amenities:', this.availableAmenities);
      },
      error: (error) => {
        console.error('Error loading property amenities:', error);
      },
    });
  }

  // Check if amenity is selected
  isAmenitySelected(amenityId: number): boolean {
    return this.selectedAmenities.some((amenity) => amenity.id === amenityId);
  }

  // Toggle amenity selection
  toggleAmenity(amenity: any): void {
    const index = this.selectedAmenities.findIndex((a) => a.id === amenity.id);
    if (index > -1) {
      // Remove if already selected
      this.selectedAmenities.splice(index, 1);
    } else {
      // Add if not selected
      this.selectedAmenities.push({
        ...amenity,
        distance: '5 min walk', // Default distance
      });
    }
  }

  // Remove amenity from selection
  removeAmenity(amenityId: number): void {
    this.selectedAmenities = this.selectedAmenities.filter(
      (a) => a.id !== amenityId
    );
  }

  // Get category name based on current language
  getCategoryName(category: any): string {
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'ar'
      ? category.name_ar || category.name
      : category.name;
  }

  // Get property type name based on current language
  getPropertyTypeName(type: any): string {
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'ar' ? type.name_ar || type.name_en : type.name_en;
  }

  // Get amenity name based on current language
  getAmenityName(amenity: any): string {
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'ar'
      ? amenity.name_ar || amenity.name_en
      : amenity.name_en;
  }

  // Generate dummy data for testing
  generateDummyData(): void {
    const dummyData = {
      name_en: 'Modern 2-Bedroom Apartment in Riyadh',
      name_ar: 'شقة حديثة بغرفتين نوم في الرياض',
      description_en:
        'Beautiful modern apartment with stunning city views. Fully furnished with high-quality amenities. Located in a prime area with easy access to shopping centers, restaurants, and public transportation.',
      description_ar:
        'شقة حديثة جميلة بإطلالة رائعة على المدينة. مجهزة بالكامل مع مرافق عالية الجودة. تقع في منطقة مميزة مع سهولة الوصول إلى مراكز التسوق والمطاعم والمواصلات العامة.',
      property_category_id: '2', // Residential
      property_type_id: '5', // Assuming apartment is ID 1
      area: '120',
      available_from: '2024-02-01',
      furnishing_status: 'furnished',
      bedrooms: '2',
      bathrooms: '2',
      floor_number: '5',
      total_floors: '12',
      insurance_amount: '5000',
      fal_number: 'FAL-2024-001234',
      ad_number: 'AD-2024-567890',
      annual_rent: '120000',
      building_number: '1234',
      country: 'Saudi Arabia',
      region: 'Riyadh Region',
      city: 'Riyadh',
      district: 'Al Olaya',
      postal_code: '12211',
      latitude: '24.7136',
      longitude: '46.6753',
      is_active: true,
      declaration: true,
    };

    // Set form values
    this.propertyForm.patchValue(dummyData);

    // Set dummy amenities (assuming these IDs exist)
    if (this.availableAmenities.length > 0) {
      this.selectedAmenities = [
        {
          id: this.availableAmenities[0]?.id || 1,
          name_en: 'Parking',
          name_ar: 'موقف سيارات',
          distance: '5 min walk',
        },
        {
          id: this.availableAmenities[1]?.id || 2,
          name_en: 'Lift',
          name_ar: 'مصعد',
          distance: 'In building',
        },
        {
          id: this.availableAmenities[2]?.id || 3,
          name_en: 'CCTV',
          name_ar: 'كاميرات مراقبة',
          distance: '24/7',
        },
      ];
    }

    // Create dummy files
    this.createDummyFiles();

    console.log('Dummy data loaded successfully!');
  }

  // Create dummy files for testing
  private createDummyFiles(): void {
    // Create dummy file objects
    const dummyFiles = [
      {
        name: 'apartment-exterior.jpg',
        size: 2048576, // 2MB
        type: 'image/jpeg',
      },
      {
        name: 'living-room.jpg',
        size: 1536000, // 1.5MB
        type: 'image/jpeg',
      },
      {
        name: 'bedroom.jpg',
        size: 1024000, // 1MB
        type: 'image/jpeg',
      },
      {
        name: 'kitchen.jpg',
        size: 1792000, // 1.75MB
        type: 'image/jpeg',
      },
    ];

    // Convert to File objects
    this.uploadedFiles = dummyFiles.map((file) => {
      const blob = new Blob(['dummy content'], { type: file.type });
      return new File([blob], file.name, { type: file.type });
    });

    // Update form control
    const formControl = this.propertyForm.get('images');
    if (formControl) {
      formControl.setValue(this.uploadedFiles);
    }
  }

  // Load dummy data button handler
  onLoadDummyData(): void {
    this.generateDummyData();
  }
}
