import { Routes } from '@angular/router';
import { PrimeComponent } from './prime/prime.component';

export const routes: Routes = [
    { path: '', redirectTo: 'prime', pathMatch: 'full' },
    { path: 'prime', component: PrimeComponent },
];
