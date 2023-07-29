import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperModule } from 'ngx-image-cropper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { UploadFileDialogComponent } from './upload-file-dialog/upload-file-dialog.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { createWorker } from 'tesseract.js';
import {MatTableModule} from '@angular/material/table';
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
  constructor(public dialog: MatDialog,     private sanitizer: DomSanitizer,) {}

  previewUrl: SafeUrl | null = null;
  ocrResult: {name : string, prime: number}[] = [];
  displayedColumns: string[] = ['name', 'prime'];

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
    dialogRef.afterClosed().subscribe((url) => this.onUploadDialClose(url));
  }

  onUploadDialClose(url: string | null) {
    if(!url)
      return;
    this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(url);
    this.scanImage(url);
  }

  async scanImage(url: string): Promise<void> {
    const worker = await createWorker({
      logger: m => console.log(m),
    });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(url);
    this.ocrResult = text.split('\n').filter(Boolean).map(row => {
      const prime = row.split(' ');
      return {name: prime[0], prime:  parseInt(prime[1], 10)};
    });
    await worker.terminate();
  }
}
