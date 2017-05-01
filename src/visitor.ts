import {Entry, Field, Link} from 'contentful-management';

export interface Visitor {
    visitArray?(field: Field[], identifier: string): void
    visitBoolean?(field: boolean, identifier: string): void
    visitEntry?(entry: Entry): void
    visitLink?<T>(link: Link<T>, identifier: string): void
    visitLocale?(field: Field, locale: string): void
    visitNumber?(field: number, identifier: string): void
    visitString?(field: string, identifier: string): void
}
