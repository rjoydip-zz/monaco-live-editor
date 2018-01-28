import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: '', component: AppComponent },
      { path: 'live', component: EditorComponent },
      { path: 'live/:id', component: EditorComponent }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [AppComponent, EditorComponent]
})
export class AppModule { }
