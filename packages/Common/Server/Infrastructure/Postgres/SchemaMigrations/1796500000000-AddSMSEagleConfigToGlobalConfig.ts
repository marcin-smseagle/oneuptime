import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSMSEagleConfigToGlobalConfig1796500000000
  implements MigrationInterface
{
  public name = "AddSMSEagleConfigToGlobalConfig1796500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" ADD "smsEagleApiUrl" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" ADD CONSTRAINT "UQ_37d69c1972f4cd61d4b5b7a7126" UNIQUE ("smsEagleApiUrl")`,
    );
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" ADD "smsEagleAccessToken" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" ADD CONSTRAINT "UQ_7a36144d6a05f5d1ccfc7c70af9" UNIQUE ("smsEagleAccessToken")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" DROP CONSTRAINT "UQ_7a36144d6a05f5d1ccfc7c70af9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" DROP COLUMN "smsEagleAccessToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" DROP CONSTRAINT "UQ_37d69c1972f4cd61d4b5b7a7126"`,
    );
    await queryRunner.query(
      `ALTER TABLE "GlobalConfig" DROP COLUMN "smsEagleApiUrl"`,
    );
  }
}
