import { Injectable } from '@angular/core';
import { ImageLike, RecognizeResult, Scheduler, createScheduler, createWorker } from 'tesseract.js';

@Injectable({
  providedIn: 'root'
})
export class TesseractService {

  scheduler: Promise<Scheduler>;

  constructor() {
    this.scheduler = this.createScheduler();
  }

  async createScheduler(): Promise<Scheduler> {
    const scheduler = createScheduler();
    const workerGen = async () => {
      const worker = await createWorker({
        logger: function(m){console.log(m);}
      });
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      scheduler.addWorker(worker);
    }
    const workerN = 2;
    (async () => {
      const resArr = Array(workerN);
      for (let i=0; i<workerN; i++) {
        resArr[i] = await workerGen();
      }
    })();
    return scheduler;
  }

  async recognize(image: ImageLike): Promise<RecognizeResult> {
    return (await this.scheduler).addJob('recognize', image);
  }
}
