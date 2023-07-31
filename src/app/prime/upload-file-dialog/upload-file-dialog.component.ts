import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ImageCropperModule,
  ImageCroppedEvent,
  ImageCropperComponent,
} from 'ngx-image-cropper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TesseractService } from 'src/app/service/tesseract.service';

export interface UploadFileDialogResult {
  url: string;
  text: string
};

@Component({
  selector: 'app-upload-file-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ImageCropperModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './upload-file-dialog.component.html',
  styleUrls: ['./upload-file-dialog.component.scss'],
})
export class UploadFileDialogComponent implements AfterViewInit {
  @ViewChild(ImageCropperComponent) ImageCropper!: ImageCropperComponent;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    public dialogRef: MatDialogRef<UploadFileDialogComponent>,
    private ocr: TesseractService,
    @Inject(MAT_DIALOG_DATA) public data: { file: File }
  ) {}

  ngAfterViewInit() {
    this.ImageCropper.imageFile = this.data.file;
  }

  loadImageFailed(): void {
    throw new Error('Image fail to load.');
  }

  imageCropped($event: ImageCroppedEvent) {
    this.closeDialog($event.objectUrl).then();
  }

  async closeDialog(url?: string | null) {
    if(url) {
      const blobUrl =  URL.createObjectURL(await this.generateFiltredBlob(url));
      const { data: { text } } = await this.ocr.recognize(blobUrl);
      const result: UploadFileDialogResult = {url: url, text: text};
      return this.dialogRef.close(result);
    }
    return this.dialogRef.close();
  }

  async generateFiltredBlob(url: string) {
    const image = new Image();
    const canvas = this.canvas.nativeElement;
    image.src = url;
    await new Promise<void>((resolve) => image.onload = () => resolve());
    canvas.height = image.height;
    canvas.width = image.width;
    const ctx = canvas.getContext('2d');
    if (!ctx)
      throw new Error('canvas fail to load.');

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.canvasFiliter(imageData.data);
    ctx.putImageData(imageData, 0, 0);
    return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject())));
  }
  /**
   *
   * @param pixels
   */
  canvasFiliter(pixels: Uint8ClampedArray) {
    for (let index = 0; index < pixels.length; index += 4) {
      // white
      if (
        pixels[index] > 230 &&
        pixels[index + 1] > 230 &&
        pixels[index + 2] > 230
      )
        pixels[index] = pixels[index + 1] = pixels[index + 2] = 255;
      // green
      else if (
        pixels[index] > 30 &&
        pixels[index] < 70 &&
        pixels[index + 1] > 200 &&
        pixels[index + 2] > 95 &&
        pixels[index + 2] < 150
      )
        pixels[index] = pixels[index + 1] = pixels[index + 2] = 255;
      else {
        pixels[index] = pixels[index + 1] = pixels[index + 2] = 0;
      }
    }
  }

  cropImage() {
    this.ImageCropper.crop();
  }
}
