import { Component, ViewChild, ElementRef, NgZone, TemplateRef } from '@angular/core';

import swarm from 'webrtc-swarm';
import signalhub from 'signalhub';

declare const monaco: any;
declare const require: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private ipfs: any;
  private sw: any;
  private peer: any;
  private room: any;
  private editor: any;
  private value: string;
  private myChannel: String;
  private editorDiv: HTMLDivElement;

  @ViewChild('editor') editorContent: ElementRef;

  constructor(
    private zone: NgZone
  ) {
    this.myChannel = 'ng-monaco-editor-channel';
    this.value = `"use strict";\nfunction Person(age) {\n\tif (age) {\n\t\tthis.age = age;\n\t}\n}\n\nPerson.prototype.getAge = function () {\n\treturn this.age;\n};`;
    this.sw = swarm(signalhub('ng-monaco-editor-app', [
      'https://signalhub-hzbibrznqa.now.sh'
    ]), {
        // wrtc: require('wrtc') // don't need this if used in the browser
      })
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
      fontWeight: '500',
      formatOnType: true,
      formatOnPaste: true,
      dragAndDrop: true,
      autoIndent: true,
      mouseWheelZoom: true,
      roundedSelection: true,
      insertSpaces: true,
      glyphMargin: true
    });

    this.editor.focus();

    console.log(this.editor.getModel())

    // Add an overlay widget
    var overlayWidget = {
      domNode: null,
      getId: () => {
        return 'my.overlay.widget';
      },
      getDomNode: () => {
        const editorLayoutInfo = this.editor.getLayoutInfo();
        const editorCursorPosition = this.editor.getPosition();
        let domNode = document.createElement('div');
        domNode.innerHTML = `<a id="status-line" title="Current Line">Ln ${editorCursorPosition['lineNumber']}, Col ${editorCursorPosition['column']}</a>`;

        domNode.style.background = 'grey';
        domNode.style.color = 'rgb(255, 255, 255)';
        domNode.style.backgroundColor = 'rgb(0, 122, 204)';
        domNode.style.top = `${editorLayoutInfo['height'] - 21}px`;
        domNode.style.width = '100%';
        domNode.style.boxSizing = 'border-box';
        domNode.style.height = '22px';
        domNode.style.fontSize = '12px';
        domNode.style.padding = '1px 10px';
        domNode.style.overflow = 'hidden';
        domNode.style.textAlign = 'right';
        domNode.style.cursor = 'pointer';

        return domNode;
      },
      getPosition: () => {
        return null;
      }
    };
    this.editor.addOverlayWidget(overlayWidget);

    this.zone.run(() => {

      // Update line numbers of cursor's current position in the status bar
      this.editor.onMouseDown(() => {
        let statusLineContent = this.editorDiv.querySelector('#status-line');
        const editorCursorPosition = this.editor.getPosition();
        statusLineContent.innerHTML = `Ln ${editorCursorPosition['lineNumber']}, Col ${editorCursorPosition['column']}`;
      });

      this.sw.on('connect', (peer, id) => {
        console.log('connected to a new peer:', id)

        this.editor.onKeyDown(e => {
          this.value = this.editor.getValue();
          console.log(this.value);
          peer.send(this.value);
          console.log("onKeyDown")
        });

        this.editor.onDidFocusEditor(() => {
          this.value = this.editor.getValue();
          console.log(this.value);
          peer.send(this.value);
          console.log("onDidFocusEditor")
        })

        peer.on('data', (data) => {
          // got a data channel message
          // console.log(data.toString())
          this.editor.setValue(data.toString());
        });

      })

      this.sw.on('disconnect', (peer, id) => {
        console.log('disconnected from a peer:', id)
      })


    });

  }

}
