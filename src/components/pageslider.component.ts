export { KBPagesRendererDirective, KBPage } from "./render.component";

import {
	Component, Input, Output, EventEmitter, ContentChild, ElementRef
} from '@angular/core';

import { KBPagesRendererDirective, KBPage } from "./render.component";
import { KBDotIndicatorComponent } from './dotindicator.component';
import { PageSliderControlAPI } from "../types";
import { SlideAnimation } from "../functionality/animation";

import { SideClickHandler } from "../functionality/sideclick";
import { TouchEventHandler } from "../functionality/touchevents";


// PAGE CONTAINER DIRECTIVE =================================================================
// Handles fancy things like page animation and controls KBPagesRendererDirective

@Component({
	selector: 'kb-page-slider',
	directives: [KBDotIndicatorComponent],
	template: `
		<div class="inner" 
				[style.width]="containerWidth"
				[style.height]="containerHeight">
			<ng-content></ng-content>
		</div>
		<kb-dot-indicator *ngIf="showIndicator"
				[page]="page"
				[pageCount]="pageCount">
		</kb-dot-indicator>
	`,
	styles: [
		`:host {
			overflow: hidden;
			display: block;
		}`,
		`.inner {
			position: absolute;
			top: 0;
			will-change: left;
		}`,
		`kb-dot-indicator {
			position: absolute;
			bottom: 16px;
			width: 100%;
		}`
	]
})
export class KBPageSliderComponent implements PageSliderControlAPI {

	private innerContainer : HTMLElement;
	private touchEventHandler : TouchEventHandler;
	private sideClickHandler : SideClickHandler;
	constructor(
		private element: ElementRef
	) {
		var htmlElement = this.element.nativeElement;

		this.touchEventHandler = new TouchEventHandler(this, htmlElement);
		this.sideClickHandler = new SideClickHandler(this, htmlElement);
	}


	// PUBLIC INTERFACE =====================================================================

	@Input() public set page(pn: number) {
		if (this.renderer) this.renderer.page = pn;
		this.pageChange.emit(pn);
	}
	public get page(){return (this.renderer) ? this.renderer.page : 0;}
	@Output() pageChange = new EventEmitter<number>();
	@Output() pageSizeChange = new EventEmitter<[number, number]>();

	public get pageCount(){return (this.renderer) ? this.renderer.pageCount : 0;}
	@Output() pageCountChange = new EventEmitter<number>();

	// Dot Indicator
	@Input() public showIndicator : boolean = true;
	@Input() public overlayIndicator : boolean = true;

	// Interactivity
	@Input() public transitionDuration : number;
	@Input() public enableOverscroll : boolean = true;
	@Input() public set enableSideClicks(enabled: boolean) {
		(this.sideClickHandler) ? this.sideClickHandler.enabled = enabled : null;
	}


	// INTERNAL STATE =======================================================================

	private _pageOffset : number = 1;
	protected get pageOffset() {return this._pageOffset;}
	protected set pageOffset(v: number) {
		this._pageOffset = v;
		if (!this.blockInteraction) {
			this.innerContainer.style.left = this.pxOffset;
		}
	}
	private get pxOffset() { return -this.pageOffset * this.pageWidth + "px"; }


	// SIZING

	public get pageWidth() {return this.element.nativeElement.offsetWidth;}
	public get pageHeight() {return this.element.nativeElement.offsetHeight;}

	protected get containerWidth() {return this.pageWidth * 3 + "px";}
	protected get containerHeight() {
		var chin = (this.showIndicator && !this.overlayIndicator) ? 40 : 0;
		return (this.pageHeight - chin) + "px";
	}

	// Get the page renderer loop and keep its size up to date
	@ContentChild(KBPagesRendererDirective) renderer : KBPagesRendererDirective;
	ngOnInit(){
		this.Resize();
		this.renderer.Resize(this.pageWidth, this.pageHeight);
		window.addEventListener("resize", ()=>{
			this.Resize();
			this.renderer.Resize(this.pageWidth, this.pageHeight);
			this.pageSizeChange.emit([this.pageWidth, this.pageHeight]);
		});
	}

	protected Resize() {
		this.innerContainer = this.element.nativeElement.querySelector(".inner");
		this.innerContainer.style.left = -this.pageWidth + "px";
	}


	// INTERACTIVE NAVIGATION ===============================================================

	private blockInteraction : boolean = false;

	public ScrollTo(x: number) {
		if (this.blockInteraction) return;
		this.pageOffset = this.ClampX(x);
	}

	public AnimateToNextPage(momentum?: number) {
		if (this.blockInteraction) return;
		if (this.page == this.renderer.pageCount - 1) {
			return this.AnimateToX(1, 0).then(()=>{this.pageOffset = 1;})
		}
		if (momentum === undefined) momentum = 0;

		this.AnimateToX(2, momentum).then(()=>{
			this.page++;
			this.pageOffset = 1;
		});
	}

	public AnimateToPreviousPage(momentum?: number) {
		if (this.blockInteraction) return;
		if (this.page == 0) {
			return this.AnimateToX(1, 0).then(()=>{this.pageOffset = 1;})
		}
		if (momentum === undefined) momentum = 0;

		this.AnimateToX(0, momentum).then(()=>{
			this.page--;
			this.pageOffset = 1;
		});
	}

	public AnimateToX(x: number, momentum: number) {
		if (this.blockInteraction) return;
		this.blockInteraction = true;

		var w = this.pageWidth;
		return new SlideAnimation(
			this.innerContainer,	 	// Element to animate
			-this.pageOffset * w,		// Current position (px)
			-x * w,	 					// Destination position (px)
			momentum * w,			 	// User scroll momentum (px/s)
			this.transitionDuration		// Default duration, when momentum = 0
		).then(()=>{
			this.blockInteraction = false;
		});
	}


	// OVERSCROLL (iOS STYLE) ===============================================================

	// Get X to a reasonable range, taking into account page boundaries
	protected ClampX(x: number) {
		if (x < 0) x = 0;
		if (x > 2) x = 2;

		// Allow some overscrolling on the first and last page
		if (this.page == 0 && x < 1) {
			if (this.enableOverscroll) x = 1 - this.OverscrollRamp(1 - x);
			else x = 1;
		}
		if (this.page == this.renderer.pageCount - 1 && x > 1) {
			if (this.enableOverscroll) x = 1 + this.OverscrollRamp(x - 1);
			else x = 1;
		}
		return x;
	}

	// Exponential ramp to simulate elastic pressure on overscrolling
	protected OverscrollRamp(input: number) : number {
		return Math.pow(input, 0.5) / 5;
	}
}