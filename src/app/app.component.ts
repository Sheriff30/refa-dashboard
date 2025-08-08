import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { ToastComponent } from './ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslateModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(public languageService: LanguageService) {}

  title = 'refa-dashboard';
}
