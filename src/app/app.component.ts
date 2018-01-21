import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';

declare const monaco: any;
declare const require: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private editor: any;
  private value: string;
  private editorDiv: HTMLDivElement;

  @ViewChild('editor') editorContent: ElementRef;

  constructor(
    private zone: NgZone
  ) {
    this.value = 'console.log("Hello world");';
  }

  ngAfterViewInit() {
    let onGotAmdLoader = () => {
      // Load monaco
      (<any>window).require.config({ paths: { 'vs': '/assets/monaco/vs' } });
      (<any>window).require(['vs/editor/editor.main'], () => {
        this.initMonaco();
      });
    };

    // Load AMD loader if necessary
    if (!(<any>window).require) {
      const loaderScript = document.createElement('script');
      loaderScript.type = 'text/javascript';
      loaderScript.src = '/assets/monaco/vs/loader.js';
      loaderScript.addEventListener('load', onGotAmdLoader);
      document.body.appendChild(loaderScript);
    } else {
      onGotAmdLoader();
    }
  }

  // Will be called once monaco library is available
  initMonaco() {
    this.editorDiv = this.editorContent.nativeElement;
    this.editor = monaco.editor.create(this.editorDiv, {
      value: this.value,
      language: 'javascript',
      theme: 'vs-dark', // 'vs' | 'vs-dark' | 'hc-black'
      minimap: {
        enabled: false // boolean
      },
      automaticLayout: true, // boolean
      wordWrap: 'bounded', // 'off' | 'on' | 'wordWrapColumn' | 'bounded';
      lineNumbers: 'on', //  'on' | 'off' | 'relative' | ((lineNumber: number) => string);
      lineDecorationsWidth: 30, // number | string;
      fontSize: 16, // number 
      fontWeight: '500' // 'normal' | 'bold' | 'bolder' | 'lighter' | 'initial' | 'inherit' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    });
  }

}
