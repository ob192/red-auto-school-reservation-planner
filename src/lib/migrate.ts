import fs from 'fs';
import path from 'path';
import pool from './db';

// Works whether cwd is the project root or anywhere else
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export async function runMigrations(): Promise<void> {
    console.log('[migrate] starting — looking in', MIGRATIONS_DIR);
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS public._migrations (
                                                              id         serial primary key,
                                                              name       text unique not null,
                                                              applied_at timestamptz default now()
            )
        `);

        const files = fs
            .readdirSync(MIGRATIONS_DIR)
            .filter((f) => f.endsWith('.sql'))
            .sort();

        console.log('[migrate] found files:', files);

        for (const file of files) {
            const { rows } = await client.query(
                'SELECT id FROM public._migrations WHERE name = $1',
                [file]
            );
            if (rows.length > 0) {
                console.log(`[migrate] skip ${file} (already applied)`);
                continue;
            }

            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
            console.log(`[migrate] applying ${file}…`);

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO public._migrations (name) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`[migrate] ✓ ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                throw new Error(`Migration failed: ${file}\n${err}`);
            }
        }

        console.log('[migrate] done');
    } finally {
        client.release();
    }
}