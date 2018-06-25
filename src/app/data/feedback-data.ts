export class FeedbackDataFile {
  blob: Blob;
  name: string;

  constructor(blob: Blob, name: string) {
    this.blob = blob;
    this.name = name;
  }
}

export class FeedbackData {
  email: string;
  text: string;
  logFile?: FeedbackDataFile;
  attachments: File[] = [];  // maximum 2 attachments
}
