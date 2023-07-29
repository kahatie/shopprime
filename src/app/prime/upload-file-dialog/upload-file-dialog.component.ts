import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ImageCropperModule,
  ImageCroppedEvent,
  ImageCropperComponent,
} from 'ngx-image-cropper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-upload-file-dialog',
  standalone: true,
  imports: [CommonModule, ImageCropperModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './upload-file-dialog.component.html',
  styleUrls: ['./upload-file-dialog.component.scss']
})
export class UploadFileDialogComponent implements AfterViewInit {

  @ViewChild(ImageCropperComponent) ImageCropper!: ImageCropperComponent;

  constructor(
    public dialogRef: MatDialogRef<UploadFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {file: File}) {}

  ngAfterViewInit(){
    this.ImageCropper.imageFile = this.data.file;
  }

  loadImageFailed(): void {
    throw new Error('Image fail to load.');
  }
  cropperReady(): void {}
  imageLoaded(): void {}
  imageCropped($event: ImageCroppedEvent) {
    this.dialogRef.close($event.objectUrl);
  }

  crop() {
    this.ImageCropper.crop();
  }
}
