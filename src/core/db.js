const path = require('node:path');
const knexFactory = require('knex');
const { config } = require('./config');

const isPostgres = /^postgres(?:ql)?:\/\//i.test(config.databaseUrl);

function sqliteFilename(databaseUrl) {
  if (!databaseUrl.startsWith('sqlite://')) return path.resolve(databaseUrl);
  let filename = decodeURIComponent(databaseUrl.slice('sqlite://'.length));
  if (filename.startsWith('/')) filename = filename.slice(1);
  if (process.platform === 'win32' && /^\/[a-z]:\//i.test(filename)) filename = filename.slice(1);
  return path.resolve(filename);
}

const knex = knexFactory({
  client: isPostgres ? 'pg' : 'better-sqlite3',
  connection: isPostgres ? config.databaseUrl : { filename: sqliteFilename(config.databaseUrl) },
  useNullAsDefault: !isPostgres,
  pool: isPostgres ? { min: 0, max: 10 } : undefined,
  acquireConnectionTimeout: 10000,
});

async function initializeDatabase() {
  if (!isPostgres) await knex.raw('PRAGMA foreign_keys = ON');

  if (!(await knex.schema.hasTable('users'))) {
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name', 120).notNullable();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('role', 30).notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.index('email');
    });
  }
  if (!(await knex.schema.hasTable('jobs'))) {
    await knex.schema.createTable('jobs', (table) => {
      table.increments('id').primary();
      table.integer('recruiter_id').unsigned().notNullable().references('id').inTable('users');
      table.string('title', 200).notNullable();
      table.text('description').notNullable();
      table.boolean('feedback_enabled').notNullable().defaultTo(true);
      table.boolean('blind_mode').notNullable().defaultTo(false);
      table.boolean('requirements_locked').notNullable().defaultTo(false);
      table.string('status', 20).notNullable().defaultTo('open');
      table.string('public_token', 64).notNullable().unique();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('closed_at').nullable();
      table.index('recruiter_id');
      table.index('public_token');
    });
  }
  if (!(await knex.schema.hasTable('requirements'))) {
    await knex.schema.createTable('requirements', (table) => {
      table.increments('id').primary();
      table.integer('job_id').unsigned().notNullable().references('id').inTable('jobs').onDelete('CASCADE');
      table.string('text', 500).notNullable();
      table.string('requirement_type', 20).notNullable().defaultTo('required');
      table.integer('position').notNullable().defaultTo(0);
      table.index('job_id');
    });
  }
  if (!(await knex.schema.hasTable('applications'))) {
    await knex.schema.createTable('applications', (table) => {
      table.increments('id').primary();
      table.integer('job_id').unsigned().notNullable().references('id').inTable('jobs');
      table.string('name', 160).notNullable();
      table.string('email', 255).notNullable();
      table.string('phone', 50).notNullable();
      table.string('cv_filename', 255).notNullable();
      table.string('cv_path', 500).notNullable();
      table.boolean('cv_locked').notNullable().defaultTo(true);
      table.boolean('consent_given').notNullable().defaultTo(false);
      table.string('consent_version', 50).notNullable();
      table.timestamp('consent_at').notNullable().defaultTo(knex.fn.now());
      table.string('status', 30).notNullable().defaultTo('undecided');
      table.string('analysis_status', 30).notNullable().defaultTo('pending');
      table.integer('analysis_attempts').notNullable().defaultTo(0);
      table.string('private_result_token', 96).notNullable().unique();
      table.float('analysis_score').nullable();
      table.string('match_level', 30).nullable();
      table.text('reason').nullable();
      table.boolean('needs_review').notNullable().defaultTo(false);
      table.timestamp('applied_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('analysis_updated_at').nullable();
      table.unique(['job_id', 'email']);
      table.index('job_id');
      table.index('email');
      table.index('private_result_token');
    });
  }
  if (!(await knex.schema.hasTable('analysis_results'))) {
    await knex.schema.createTable('analysis_results', (table) => {
      table.increments('id').primary();
      table.integer('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
      table.float('score').notNullable();
      table.string('match_level', 30).notNullable();
      table.text('reason').notNullable();
      table.text('result_json').notNullable();
      table.string('prompt_version', 50).notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.index('application_id');
    });
  }
  if (!(await knex.schema.hasTable('status_audits'))) {
    await knex.schema.createTable('status_audits', (table) => {
      table.increments('id').primary();
      table.integer('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
      table.integer('actor_user_id').unsigned().notNullable().references('id').inTable('users');
      table.string('old_status', 30).notNullable();
      table.string('new_status', 30).notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.index('application_id');
      table.index('actor_user_id');
    });
  }
}

module.exports = { knex, initializeDatabase, sqliteFilename };