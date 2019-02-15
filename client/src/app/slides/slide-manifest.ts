import { InjectionToken } from '@angular/core';
import { IdentifiableProjectorElement, ProjectorElement } from 'app/shared/models/core/projector';

type BooleanOrFunction = boolean | ((element: ProjectorElement) => boolean);

export interface Slide {
    slide: string;
}

/**
 * Slides can have these options.
 */
export interface SlideDynamicConfiguration {
    /**
     * Should this slide be scrollable?
     */
    scrollable: BooleanOrFunction;

    /**
     * Should this slide be scaleable?
     */
    scaleable: BooleanOrFunction;
}

/**
 * Is similar to router entries, so we can trick the router. Keep slideName and
 * path in sync.
 */
export interface SlideManifest extends Slide {
    path: string;
    loadChildren: string;
    verboseName: string;
    elementIdentifiers: (keyof IdentifiableProjectorElement)[];
    canBeMappedToModel: boolean;
}

export const SLIDE_MANIFESTS = new InjectionToken<SlideManifest[]>('SLIDE_MANIFEST');
