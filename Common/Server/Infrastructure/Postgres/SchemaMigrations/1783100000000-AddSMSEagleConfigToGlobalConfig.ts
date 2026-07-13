import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSMSEagleConfigToGlobalConfig1783100000000
  implements MigrationInterface
{
  public name = "AddSMSEagleConfigToGlobalConfig1783100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" ADD "smsEagleApiUrl" character varying(100) CONSTRAINT "UQ_GlobalConfig_smsEagleApiUrl" UNIQUE`,
    );
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" ADD "smsEagleAccessToken" character varying(100) CONSTRAINT "UQ_GlobalConfig_smsEagleAccessToken" UNIQUE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" DROP COLUMN "smsEagleAccessToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" DROP COLUMN "smsEagleApiUrl"`,
    );
  }
}
