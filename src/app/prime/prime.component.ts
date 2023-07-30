import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperModule } from 'ngx-image-cropper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { UploadFileDialogComponent } from './upload-file-dialog/upload-file-dialog.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { createWorker, createScheduler, Scheduler } from 'tesseract.js';
import { MatTableModule } from '@angular/material/table';

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

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  previewUrl: SafeUrl | null = null;

  ocrResult = signal<PrimeResult[]>([]);
  canvasResult = signal<PrimeResult[]>([]);

  displayedColumns: string[] = ['name', 'prime'];

  scheduler?: Scheduler;

  ocrLoad: Promise<void>;

  constructor(public dialog: MatDialog, private sanitizer: DomSanitizer,) {
    this.ocrLoad = this.initOcr();
  }

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
    this.scanImages(url);
  }

  async scanImages(url: string) {
    // generate filtred image
    const urls = [url, URL.createObjectURL(await this.generateCanvas(url))];
    // wait tesseract finish load
    await this.ocrLoad;
    // wait tesseract recognize
    const ocrs = await this.Ocr(urls);
    this.ocrResult.set(ocrs[0]);
    this.canvasResult.set(ocrs[1]);
  }

  generateCanvas(url: string) {
    return new Promise<Blob>((resolve, reject) => {
      const  image = new Image();
      const canvas = this.canvas.nativeElement;
      image.src = url;
      image.onload = () => {
        canvas.height = image.height;
        canvas.width = image.width;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('canvas fail to load.');

        ctx.drawImage(image,0,0);

        const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
        const pixels = imageData.data;
        //filter pixel on color on white or green stay alive
        for (let index = 0; index < pixels.length; index += 4) {
        // white
          if(pixels[index] > 230 && pixels[index + 1] > 230 && pixels[index + 2] > 230)
            pixels[index] = pixels[index + 1] = pixels[index + 2] = 255;
          // green
          else if(
            pixels[index] > 30 && pixels[index] < 70 &&
            pixels[index + 1] > 200 &&
            pixels[index + 2] > 95 && pixels[index + 2] < 150
            )
            pixels[index] = pixels[index + 1] = pixels[index + 2] = 255;
          else {
            pixels[index] = pixels[index + 1] = pixels[index + 2] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob(blob => (blob) ? resolve(blob) : reject)
      }
    });
  }

  async initOcr() {
    const scheduler = createScheduler();
    const workerGen = async () => {
      const worker = await createWorker({
        // logger: function(m){console.log(m);}
      });
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      scheduler.addWorker(worker);
    }
    this.scheduler = scheduler;
    const workerN = 2;
    (async () => {
      const resArr = Array(workerN);
      for (let i=0; i<workerN; i++) {
        resArr[i] = await workerGen();
      }
    })();
  }

  async Ocr(urls: string[]): Promise<PrimeResult[][]> {
    const ocrResults = [];

    if (this.scheduler) {
      for (let index = 0; index < urls.length; index++) {
        const data = await this.scheduler.addJob('recognize', urls[index]);
        ocrResults[index] = this.formatResult(data.data.text);
      }
      return ocrResults;
    }
    return [];
  }

  formatResult(text: string) : PrimeResult[] {
    return text.split('\n').filter(Boolean).map(row => {
      const prime = row.split(' ');
      return {name: prime[0], prime: prime[1]};
    });
  }
}
