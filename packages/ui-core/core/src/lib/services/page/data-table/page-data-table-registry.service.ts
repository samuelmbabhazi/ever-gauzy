import { Injectable } from '@angular/core';
import { Cell, IColumn, IColumns } from 'angular2-smart-table';
import { I18nService } from '@gauzy/ui-core/i18n';
import { PageLocationRegistryId } from '../../../common/component-registry.types';
import { IPageDataTableRegistry, PageDataTableRegistryConfig } from './page-data-table-registry.types';

@Injectable({
	providedIn: 'root'
})
export class PageDataTableRegistryService implements IPageDataTableRegistry {
	/**
	 * Registry for storing page data table column configurations.
	 *
	 * This Map stores arrays of PageDataTableRegistryConfig objects, keyed by PageLocationRegistryId.
	 */
	private readonly registry = new Map<PageLocationRegistryId, PageDataTableRegistryConfig[]>();

	constructor(readonly _i18nService: I18nService) {}

	/**
	 * Register a column configurations.
	 *
	 * This method registers a new column configuration in the service's internal registry.
	 * It ensures that each configuration has a valid location property and checks if a column with the same
	 * location and id already exists to prevent duplicate entries. If the configurations are valid and unique,
	 * it adds them to the registry.
	 *
	 * @param config The configuration for the column.
	 * @throws Will throw an error if a column with the same location and id has already been registered.
	 */
	public registerPageDataTableColumn(config: PageDataTableRegistryConfig): void {
		if (!config.location) {
			throw new Error('Page data table column configuration must have a location property');
		}

		// Set the isTranslatable flag to false by default
		config.isTranslatable = config.isTranslatable ?? true;

		// Get all registered columns for the specified location
		const columns = this.registry.get(config.location) || [];

		// Find the index of the column with the same location and columnId
		const existing = columns.findIndex(
			(route: PageDataTableRegistryConfig) =>
				route.location === config.location && route.columnId === config.columnId
		);

		if (existing !== -1) {
			// Replace the existing column with the new one
			columns[existing] = config;
		} else {
			// Add the new column configuration to the list
			columns.push(config);
		}

		// Update the registry with the new list of columns for the specified location
		this.registry.set(config.location, columns);
	}

	/**
	 * Register multiple column configurations.
	 *
	 * This method registers multiple new column configurations in the service's internal registry.
	 * It ensures that each configuration has a valid location property and checks if a column with the same
	 * location and id already exists to prevent duplicate entries. If the configurations are valid and unique,
	 * it adds them to the registry.
	 *
	 * @param configs The array of configurations for the columns.
	 * @throws Will throw an error if a column with the same location and id has already been registered.
	 */
	public registerPageDataTableColumns(configs: PageDataTableRegistryConfig[]): void {
		configs.forEach((config) => this.registerPageDataTableColumn(config));
	}

	/**
	 * Retrieves the data table column configurations associated with a specific registry ID.
	 *
	 * This method fetches an array of `PageDataTableRegistryConfig` objects that are associated with the provided
	 * `PageLocationRegistryId`. If any configurations are found, they are sorted based on their `order` property in
	 * ascending order. If no configurations are found, an empty array is returned.
	 *
	 * @param location - The identifier used to look up the data table column configurations.
	 * @returns An array of `PageDataTableRegistryConfig` objects sorted by the `order` property, or an empty array if none are found.
	 */
	private getDataTableColumnsByOrder(location: PageLocationRegistryId): PageDataTableRegistryConfig[] {
		return this.registry.get(location)?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || [];
	}

	/**
	 * Retrieves a list of unique columns for a specific page location, based on the provided location.
	 *
	 * This method fetches all registered data table columns for the specified `PageLocationRegistryId`,
	 * removes any duplicate columns based on their location and ID, and maps the remaining configurations
	 * to an array of `IColumn` objects.
	 *
	 * The uniqueness of each column is determined by the combination of its location and ID. If a duplicate
	 * column is found (i.e., one with the same location and ID as another), it is filtered out. The resulting
	 * list of columns is returned.
	 *
	 * @param registryId - The identifier used to look up the data table column configurations for a specific page location.
	 * @returns An array of `IColumn` objects representing the unique columns for the specified page location.
	 */
	public getPageDataTableColumns(location: PageLocationRegistryId): IColumns {
		// Get all registered columns for the specified location
		let columns = this.getDataTableColumnsByOrder(location);

		// Use a Set to track unique location-id combinations
		const locationIds = new Set<string>();

		// Filter the configurations to remove duplicates based on the unique identifier
		columns = columns.filter((config: PageDataTableRegistryConfig) => {
			// Create a unique identifier for the combination of location and id
			const identifier = `${config.location}-${config.columnId}`;

			// Check if the unique identifier is already in the Set
			if (locationIds.has(identifier)) {
				return false; // Duplicate found, filter it out
			}

			// Add the unique identifier to the Set
			locationIds.add(identifier);
			return true; // Not a duplicate, keep it
		});

		// Map each unique configuration to an IColumn object
		return columns.reduce((acc: IColumns, config: PageDataTableRegistryConfig) => {
			// Create and return a new IColumn object
			const column: IColumn = {
				title: config.isTranslatable ? this._i18nService.getTranslation(config.title) : config.title,
				type: config.type,
				width: config.width,
				isSortable: config.isSortable ?? false,
				isEditable: config.isEditable ?? false,
				...(config.editor && { editor: config.editor }),
				...(config.renderComponent && { renderComponent: config.renderComponent }),
				...(config.valuePrepareFunction && {
					valuePrepareFunction: (rawValue: any, cell: Cell) => config.valuePrepareFunction(rawValue, cell)
				}),
				...(config.componentInitFunction && {
					componentInitFunction: (component: any, cell: Cell) => config.componentInitFunction(component, cell)
				})
			};

			// Check if the column configuration has additional column options
			if (config.column) {
				Object.assign(column, config.column);
			}

			// Add the column configuration to the accumulator object with the columnId as the key
			acc[config.columnId] = column;

			return acc;
		}, {});
	}
}
