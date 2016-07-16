**Mimicks the functionality of UIPageViewController in pure HTML for mobile web apps, using
DOM recycling and CSS3 transitions for near-native performance. Built with Angular 2, and
designed to work seamlessly in normal NG2 templates.**


# Example Usage

### Installation
```
npm install --save ng2-page-slider
```

### Typescript NG2 Component

```typescript
import { Component } from '@angular/core';
import { KBPagesRendererDirective, KBPageSliderComponent } from 'ng2-page-slider';

@Component({
	selector: 'example-component',
	directives: [KBPagesRendererDirective, KBPageSliderComponent],
	template: `
		<kb-page-slider>
			<div *kbPages="let page of pages" class="page" [style.background]="page.color">
				<h1>{{page.title}}</h1>
			</div>
		</kb-page-slider>
	`
})
export class ExampleComponent {}
```

*It should also be possible to use this component from JS-based NG2 apps from index.js,
although I have not gotten the chance to test that.*


# API

## KBPageSliderComponent (kb-page-slider)
Container component for pages. Optionally includes a KBDotIndicatorComponent at the bottom.
Handles touch events, resizing and animation.

### Input Properties
* **page:** Current page number, zero-based index.
	* Allows two-way data binding
	* Must be a number 0 <= page < pageCount
	* Defaults to 0
* **transitionDuration:** In the absence of scrolling momentum, how long should a transition take?
	* Expressed as an integer number of milliseconds >= 0
	* Defaults to 250ms
* **showIndicator:** When true, includes a dot indicator at the bottom.
	* Boolean, defaults to true
* **overlayIndicator:** When true, renders indicator above the page content.
	* Boolean, defaults to true
* **enableOverscroll:** When true, user can scroll slightly past the first and last page.
	* Boolean, defaults to true
* **enableSideClicks:** When true, clicking near the edge of a page will cause page navigation.
	* Boolean, defaults to true

### Instance Properties
* **pageCount:** Total number of pages, determined by KBPagesRendererDirective.
	* *Read-only* instance property
	* Observe with pageCountChange
	* Number >= 0
* **pageWidth / pageHeight:** Pixel size of an individual page
	* *Read-only* instance properties
	* Observe with pageSizeChange


## KBPagesRendererDirective (kbPages)
Renders pages using DOM recycling, so only at most 3 exist on the DOM at any given time
(previous, current, next). Modeled on ngFor, uses the exact same looping syntax.

*It's probably kind of annoying to make this work if you want a fixed set of premade pages,
instead of a loop over a set of data. It'd work but, in the future it might be good to add
an alternative directive for that use case.*

### Provided Loop Variables
These variables are available inside of kbPages, similar to ngFor loop items.

* **index:** *number* Zero-based index of the current page.
* **isFirst:** *boolean* True when the page is the first page.
* **isLast:** *boolean* True when the page is the last page.
* **isActive:** *boolean* True when the page is currently being viewed by the user.


## KBDotIndicatorComponent (kb-dot-indicator)
Indicates the current page and the total number of pages using dots, in a style popularized
by iOS. Scrolls smoothly when the number of pages exceeds the number of dots that can fit on
the screen. Can be used independantly of KBPageSliderComponent.

### Properties
* **page:** Current page number, zero-based index.
	* Input property
	* Must be a number 0 <= page < pageCount
* **pageCount:** Total number of pages, determined by KBPagesRendererDirective.
	* Input property
	* Number >= 0