import { IColumn } from 'angular2-smart-table';
import { PageLocationRegistryId } from '../../../common/component-registry.types';

/**
 * Page route configuration with additional table columns options.
 */
export interface PageDataTableRegistryConfig extends IColumn {
	/**
	 * @description
	 * The location identifier for the page route.
	 */
	location: PageLocationRegistryId;

	/**
	 * @description
	 * The translatable key for the column title.
	 */
	isTranslatable?: boolean;

	/**
	 * @description
	 * The column identifier for the column. This is used to identify the column in the table for specific page location.
	 */
	columnId: string;

	/**
	 * @description
	 * The order of the column in the table.
	 * If not provided, the column will be added to the end of the table.
	 */
	order?: number;

	/**
	 * @description
	 * The column configuration for the column. This is used to override the default column configuration.
	 */
	column?: IColumn;
}

/**
 * Registry for page data table columns.
 */
export interface IPageDataTableRegistry {
	registerPageDataTableColumn(config: PageDataTableRegistryConfig): void; // Register a column configuration.
	registerPageDataTableColumns(configs: PageDataTableRegistryConfig[]): void; // Register multiple column configurations.
}
