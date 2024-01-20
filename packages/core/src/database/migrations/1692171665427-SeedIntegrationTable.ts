import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '@gauzy/config';
import * as chalk from 'chalk';
import { copyAssets } from './../../core/seeds/utils';
import { DEFAULT_AI_INTEGRATIONS } from './../../integration/default-integration';
import { IntegrationsUtils } from './../../integration/utils';
import * as path from 'path';

export class SeedIntegrationTable1692171665427 implements MigrationInterface {
	name = 'SeedIntegrationTable1692171665427';

	/**
	 * Up Migration
	 *
	 * @param queryRunner
	 */
	public async up(queryRunner: QueryRunner): Promise<any> {
		console.log(chalk.yellow(this.name + ' start running!'));

		await this.upsertIntegrationsAndIntegrationTypes(queryRunner);
	}

	/**
	 * Down Migration
	 *
	 * @param queryRunner
	 */
	public async down(queryRunner: QueryRunner): Promise<any> {}

	/**
	 *
	 * @param queryRunner
	 */
	public async upsertIntegrationsAndIntegrationTypes(queryRunner: QueryRunner): Promise<any> {
		const destDir = 'integrations';

		for await (const { name, imgSrc, isComingSoon, order, integrationTypesMap } of DEFAULT_AI_INTEGRATIONS) {
			try {
				const filePath = copyAssets(path.join(destDir, imgSrc), getConfig(), '');

				let upsertQuery = ``;

				if (['sqlite', 'better-sqlite3'].includes(queryRunner.connection.options.type)) {
					const payload = [name, filePath, isComingSoon ? 1 : 0, order];

					// For SQLite, manually generate a UUID using uuidv4()
					const generatedId = uuidv4();
					payload.push(generatedId);

					upsertQuery = `
                        INSERT INTO "integration" ("name", "imgSrc", "isComingSoon", "order", "id")
						VALUES (?, ?, ?, ?, ?)
						ON CONFLICT ("name")
						DO UPDATE SET "imgSrc" = EXCLUDED."imgSrc",
									  "isComingSoon" = EXCLUDED."isComingSoon",
									  "order" = EXCLUDED."order"
						RETURNING "id";
                    `;

					const [integration] = await queryRunner.query(upsertQuery, payload);

					// Step 3: Insert entry in join table to associate Integration with IntegrationType
					await IntegrationsUtils.syncIntegrationType(
						queryRunner,
						integration,
						await IntegrationsUtils.getIntegrationTypeByName(queryRunner, integrationTypesMap)
					);
				} else {
					const payload = [name, filePath, isComingSoon, order];

					upsertQuery = `
                        INSERT INTO "integration" (
                            "name", "imgSrc", "isComingSoon", "order"
                        )
                        VALUES (
                            $1, $2, $3, $4
                        )
                        ON CONFLICT(name) DO UPDATE
                        SET
                            "imgSrc" = $2,
                            "isComingSoon" = $3,
                            "order" = $4
                        RETURNING id;
                    `;

					const [integration] = await queryRunner.query(upsertQuery, payload);

					// Step 3: Insert entry in join table to associate Integration with IntegrationType
					await IntegrationsUtils.syncIntegrationType(
						queryRunner,
						integration,
						await IntegrationsUtils.getIntegrationTypeByName(queryRunner, integrationTypesMap)
					);
				}
			} catch (error) {
				// since we have errors let's rollback changes we made
				console.log(`Error while updating integration: (${name}) in production server`, error);
			}
		}
	}
}
