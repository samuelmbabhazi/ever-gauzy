import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, RelationId, ManyToOne, Index, AfterLoad } from 'typeorm';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { IIntegrationSetting } from '@gauzy/contracts';
import {
	IntegrationTenant,
	TenantOrganizationBaseEntity
} from './../core/entities/internal';
import { IsSecret } from './../core/decorators';
import { KeysToWrapSecrets, sensitiveSecretKeys } from './integration-setting.utils';

@Entity('integration_setting')
export class IntegrationSetting extends TenantOrganizationBaseEntity implements IIntegrationSetting {

	@Exclude({ toPlainOnly: true })
	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	@Column()
	settingsName: string;

	@Exclude({ toPlainOnly: true })
	@ApiProperty({ type: () => String })
	@IsNotEmpty()
	@Column()
	settingsValue: string;

	/*
	|--------------------------------------------------------------------------
	| @ManyToOne
	|--------------------------------------------------------------------------
	*/

	/**
	 * IntegrationTenant
	 */
	@ManyToOne(() => IntegrationTenant, (it) => it.settings, {
		/** Database cascade action on delete. */
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	integration?: IntegrationTenant;

	@ApiProperty({ type: () => String })
	@IsUUID()
	@RelationId((it: IntegrationSetting) => it.integration)
	@Index()
	@Column()
	integrationId?: IntegrationTenant['id'];

	/**
	 * Additional fields to expose secret fields
	 */
	@Expose({ toPlainOnly: true, name: 'settingsName' })
	@IsSecret()
	wrapSecretKey?: string;

	@Expose({ toPlainOnly: true, name: 'settingsValue' })
	@IsSecret()
	wrapSecretvalue?: string;

	/*
	|--------------------------------------------------------------------------
	| @EventSubscriber
	|--------------------------------------------------------------------------
	*/
	/**
	 * Called after entity is loaded.
	 */
	@AfterLoad()
	afterLoadEntity?() {
		const { settingsName, settingsValue } = this;

		// Apply the wrapping function only to the sensitive keys
		const wrapped = KeysToWrapSecrets(sensitiveSecretKeys, {
			[settingsName]: settingsValue,
		});

		this.wrapSecretKey = settingsName;
		this.wrapSecretvalue = wrapped[settingsName];
	}
}
