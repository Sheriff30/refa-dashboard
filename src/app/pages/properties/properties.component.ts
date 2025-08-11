import { Component, OnInit, OnDestroy } from '@angular/core';
import { PropertiesService } from '../../../services/properties.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UserRoleService } from '../../../services/user-role.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TranslateModule, CommonModule],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent implements OnInit, OnDestroy {
  properties: any[] = [];
  searchTerm: string = '';
  itemsPerPage: number = 15;
  currentPage: number = 1;
  totalItems: number = 0;
  lastPage: number = 1;
  isLoading: boolean = false;
  Math = Math;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private propertiesService: PropertiesService,
    private router: Router,
    public userRoleService: UserRoleService
  ) {}

  ngOnInit(): void {
    this.loadAgentProperties();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged(), // Only emit if value has changed
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm: string) => {
        this.currentPage = 1; // Reset to first page when searching
        this.loadAgentProperties(1, searchTerm);
      });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  loadAgentProperties(page: number = 1, search?: string): void {
    this.isLoading = true;
    this.propertiesService
      .getAgentProperties(page, this.itemsPerPage, search)
      .subscribe({
        next: (response) => {
          this.properties = response.data;
          this.totalItems = response.meta.total[0] || response.data.length;
          this.lastPage = response.meta.last_page[0] || 1;
          this.currentPage = response.meta.current_page[0] || 1;
          this.isLoading = false;
          console.log(this.properties);
          console.log(response);
        },
        error: (err) => {
          console.error('Error loading agent properties:', err);
          this.isLoading = false;
        },
      });
  }

  viewProperty(id: number): void {
    // First fetch the property data to ensure it exists
    this.propertiesService.getAgentPropertyById(id).subscribe({
      next: (property) => {
        console.log('Property found:', property);
        const basePath = this.userRoleService.isAdmin() ? 'admin' : 'agent';
        this.router.navigate([`/${basePath}/property`, id]);
      },
      error: (err) => {
        console.error('Error fetching property:', err);
        if (err.status === 404) {
          alert('Property not found or has been deleted.');
        } else {
          alert('Error loading property. Please try again.');
        }
      },
    });
  }

  editProperty(id: number): void {
    // First fetch the property data to ensure it exists
    this.propertiesService.getAgentPropertyById(id).subscribe({
      next: (property) => {
        console.log('Property found for editing:', property);
        const basePath = this.userRoleService.isAdmin() ? 'admin' : 'agent';
        this.router.navigate([`/${basePath}/property/edit`, id]);
      },
      error: (err) => {
        console.error('Error fetching property for editing:', err);
        if (err.status === 404) {
          alert('Property not found or has been deleted.');
        } else {
          alert('Error loading property for editing. Please try again.');
        }
      },
    });
  }

  deleteProperty(id: number): void {
    if (confirm('Are you sure you want to delete this property?')) {
      this.propertiesService.deleteAgentProperty(id).subscribe({
        next: (response) => {
          console.log('Property deleted successfully:', response);

          // Remove the deleted property from the current list
          this.properties = this.properties.filter((p) => p.id !== id);

          // If current page is empty and not the first page, go to previous page
          if (this.properties.length === 0 && this.currentPage > 1) {
            this.currentPage--;
          }

          // Reload the current page to get updated data and pagination info
          this.loadAgentProperties(this.currentPage, this.searchTerm);

          // Show success message (you can integrate with your toast service here)
          alert('Property deleted successfully!');
        },
        error: (err) => {
          console.error('Error deleting property:', err);

          // Show error message
          if (err.status === 404) {
            alert('Property not found or already deleted.');
          } else if (err.status === 403) {
            alert('You do not have permission to delete this property.');
          } else {
            alert('Error deleting property. Please try again.');
          }
        },
      });
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadAgentProperties(this.currentPage, this.searchTerm);
  }

  nextPage(): void {
    if (this.currentPage < this.lastPage) {
      this.currentPage++;
      this.loadAgentProperties(this.currentPage, this.searchTerm);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAgentProperties(this.currentPage, this.searchTerm);
    }
  }

  goToPage(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadAgentProperties(this.currentPage, this.searchTerm);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.lastPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  createProperty(): void {
    this.router.navigate(['/agent/create-property']);
  }
}
