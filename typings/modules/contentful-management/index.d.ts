declare module 'contentful-management' {

    export interface AssetData {
        fields: {
            title: {
                [locale: string]: string
            },
            description?: {
                [locale: string]: string
            }
            file: {
                [locale: string]: {
                    url: string,
                    details: {
                        size: number,
                        image: {
                            width: number,
                            height: number
                        }
                    },
                    fileName: string,
                    contentType: string
                }
            }
        }

        sys: {
            createdAt: string
            createdBy: Link<'User'>
            firstPublishedAt: string
            id: string
            publishedAt: string
            publishedBy: Link<'User'>
            publishedCounter: number
            publishedVersion: number
            space: Link<'Space'>
            type: 'Asset'
            updatedAt: string
            updatedBy: Link<'User'>
            version: number
        }
    }

    export interface Asset extends AssetData {
        delete(): Promise<Asset>
        isPublished(): boolean
        isUpdated(): boolean
        publish(): Promise<Asset>
        unpublish(): Promise<Asset>
        update(): Promise<Asset>
    }

    export interface ContentTypeField {
        disabled: boolean
        id: string
        localized: boolean
        name: string
        omitted: boolean
        required: boolean
        type: string
        validations: any[]
    }

    export interface ContentTypeData {
        displayField: string
        fields: ContentTypeField[]
        name: string
        sys: {
            createdAt: string
            createdBy: Link<'User'>
            firstPublishedAt: string
            id: string
            publishedCounter: number
            publishedAt: string
            publishedBy: Link<'User'>
            publishedVersion: number
            space: Link<'Space'>
            type: 'ContentType'
            updatedAt: string
            updatedBy: Link<'User'>
            version: number
        }
    }

    export interface ContentType extends ContentTypeData {

    }

    export interface EntryData {
        fields: {
            [name: string]: LocalizedField
        }

        sys: {
            contentType: Link<'ContentType'>
            createdAt: string
            createdBy: Link<'User'>
            firstPublishedAt: string
            id: string
            publishedCounter: number
            publishedAt: string
            publishedBy: Link<'User'>
            publishedVersion: number
            space: Link<'Space'>
            type: 'Entry'
            updatedAt: string
            updatedBy: Link<'User'>
            version: number
        }
    }

    export interface Entry extends EntryData {
        delete(): Promise<Entry>
        isPublished(): boolean
        isUpdated(): boolean
        publish(): Promise<Entry>
        unpublish(): Promise<Entry>
        update(): Promise<Entry>
    }

    export interface LocalizedField {
        [locale: string]: Field
    }

    type AtomicField = Link<any> | string | boolean | number;

    export type Field = AtomicField | AtomicField[];

    export interface Link<T> {
        sys: {
            id: string,
            linkType: T,
            type: 'Link',
        }
    }

    export interface LocaleData {
        code: string
        default: boolean
        fallbackCode: string
        name: string
        optional: boolean
        sys: {
            createdAt: string
            createdBy: Link<'User'>
            id: string
            space: Link<'Space'>
            type: 'Locale'
            updatedAt: string
            updatedBy: Link<'User'>
            version: number
        }
    }

    export interface Locale extends LocaleData {
        delete(): Promise<Entry>
        update(): Promise<Entry>
    }

    export interface HttpQuery {
        skip?: number
        limit?: number
        content_type?: string
    }

    export interface CustomWebhookHeader {
        key: string
        value: string
    }

    export interface WebhookDefinitionData {
        headers: CustomWebhookHeader[]
        httpBasicUsername: string
        name: string
        sys: {
            createdAt: string
            createdBy: Link<'User'>
            id: string
            space: Link<'Space'>
            type: 'WebhookDefinition'
            updatedAt: string
            updatedBy: Link<'User'>
            version: number
        }
        topics: string[]
        url: string
    }

    export interface WebhookDefinition extends WebhookDefinitionData {
        delete(): Promise<Entry>
        update(): Promise<Entry>
    }

    export type Entity = Asset | Entry | Locale | WebhookDefinition;

    interface EntityResponse<T> {
        total: number
        items: T[]
    }

    export interface Space {
        getAssets(query: HttpQuery): Promise<EntityResponse<Asset>>
        getEntries(query: HttpQuery): Promise<EntityResponse<Entry>>
        getLocales(): Promise<EntityResponse<Locale>>
        getContentType(contentTypeId: string): Promise<ContentType>
        getWebhooks(): Promise<EntityResponse<WebhookDefinition>>
    }

    export interface Client {
        getSpace(spaceId: string): Space
    }

    export function createClient(options: {accessToken: string}): Client;
}
