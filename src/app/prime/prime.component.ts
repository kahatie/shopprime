import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperModule } from 'ngx-image-cropper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { UploadFileDialogComponent, UploadFileDialogResult } from './upload-file-dialog/upload-file-dialog.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatTableModule } from '@angular/material/table';
import { TesseractService } from '../service/tesseract.service';

export interface PrimeResult {name : string, prime: string};

@Component({
  selector: 'app-prime',
  standalone: true,
  imports: [
    CommonModule,
    ImageCropperModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDividerModule,
    MatGridListModule,
    MatTableModule
  ],
  templateUrl: './prime.component.html',
  styleUrls: ['./prime.component.scss'],
})
export class PrimeComponent {
  previewUrl = signal<SafeUrl>('');

  ocrResult = signal<PrimeResult[]>([]);
  canvasResult = signal<PrimeResult[]>([]);

  displayedColumns: string[] = ['name', 'prime'];

  constructor(public dialog: MatDialog, private sanitizer: DomSanitizer, private ocr: TesseractService) {}

  fileChangeEvent($event: Event): void {
    const input = $event.target as HTMLInputElement;
    const selectedFile = input.files ? input.files[0] : null;

    if (selectedFile) this.openUploadDial(selectedFile);
  }

  openUploadDial(file: File): void {
    const dialogRef = this.dialog.open(UploadFileDialogComponent, {
      data: {
        file: file,
      },
    });
    dialogRef.afterClosed().subscribe(result => this.onUploadDialClose(result));
  }

  onUploadDialClose(result: UploadFileDialogResult | null) {
    if(!result)
      return;
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustUrl(result.url));
    this.ocrResult.set(this.formatResult(result.text));
  }

  formatResult(text: string) : PrimeResult[] {
    return text.split('\n').filter(Boolean).map(row => {
      const prime = row.split(' ');
      return {name: prime[0], prime: prime[1]};
    });
  }
}
