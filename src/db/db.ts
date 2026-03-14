import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Generated, ColumnType } from "kysely";
import { env } from "@/common/utils/envConfig";

export interface MetricTable {
  id: Generated<number>;
  user_id: string;
  type: string;
  value: number;
  original_value: number;
  original_unit: string;
  date: ColumnType<Date, Date | string, Date | string>;
  created_at: Generated<Date>;
}

export interface Database {
  metrics: MetricTable;
}

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
  }),
});

export const db = new Kysely<Database>({ dialect });
