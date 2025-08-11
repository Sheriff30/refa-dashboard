import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertiesService } from '../../../services/properties.service';
import { TranslateModule } from '@ngx-translate/core';
import { MapComponent } from '../../ui/map/map.component';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, TranslateModule, MapComponent],
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.scss',
})
export class PropertyDetailsComponent implements OnInit {
  property?: any = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private propertiesService: PropertiesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertiesService.getAgentPropertyById(+id).subscribe({
        next: (response) => {
          console.log('Full API Response:', response);

          // Extract property data from response.data
          const property = response.data;

          console.log('Property Details:', property);
          console.log('Property ID:', property.id);
          console.log('Property Name (EN):', property.name_en);
          console.log('Property Name (AR):', property.name_ar);
          console.log('Description (EN):', property.description_en);
          console.log('Description (AR):', property.description_ar);
          console.log('Area:', property.area);
          console.log('Bedrooms:', property.bedrooms);
          console.log('Bathrooms:', property.bathrooms);
          console.log('Annual Rent:', property.annual_rent);
          console.log('City:', property.city);
          console.log('District:', property.district);
          console.log('Category:', property.category);
          console.log('Type:', property.type);
          console.log('Amenities:', property.amenities);
          console.log('Images:', property.images);
          console.log('Primary Image:', property.primary_image_url);
          console.log('Available From:', property.available_from);
          console.log('Furnishing Status:', property.furnishing_status);
          console.log('Created At:', property.created_at);

          this.property = property;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading property details:', err);
          this.error = 'Error loading property details';
          this.isLoading = false;
        },
      });
    } else {
      this.error = 'Invalid property ID';
      this.isLoading = false;
    }
  }
}
