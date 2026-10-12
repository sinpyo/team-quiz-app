/* 데이터베이스의 표 모양.
   문제집 알맹이는 data 칸에 통째로 담습니다 — 예전 pack.js 와 같은 모양이라
   그때 내보낸 .json 파일을 그대로 불러올 수 있습니다. */

import { index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import type { Pack } from './types';

export type PackKind = 'pack' | 'template';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** 어디로 들어왔는지까지 붙인 회원번호 — 'google:1234…' 또는 개발용 'dev:이름' */
  loginId: text('login_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const packs = pgTable(
  'packs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** 'pack' 은 진행용 문제집, 'template' 은 새 문제집을 찍어내는 틀입니다 */
    kind: text('kind').$type<PackKind>().notNull().default('pack'),
    data: jsonb('data').$type<Pack>().notNull(),
    /** 보기 링크에 들어가는 값. 짐작으로 맞힐 수 없는 22자입니다 */
    viewToken: text('view_token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('packs_owner_idx').on(t.ownerId, t.kind)],
);

/** 이 문제집을 고칠 수 있는 사람들 (주인은 여기 없어도 고칠 수 있습니다) */
export const packEditors = pgTable(
  'pack_editors',
  {
    packId: uuid('pack_id')
      .notNull()
      .references(() => packs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.packId, t.userId] }), index('pack_editors_user_idx').on(t.userId)],
);

/** 편집 초대 링크 */
export const editInvites = pgTable(
  'edit_invites',
  {
    token: text('token').primaryKey(),
    packId: uuid('pack_id')
      .notNull()
      .references(() => packs.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** 비워 두면 기한 없음 */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    /** 비워 두면 횟수 제한 없음 */
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('edit_invites_pack_idx').on(t.packId)],
);

export type UserRow = typeof users.$inferSelect;
export type PackRow = typeof packs.$inferSelect;
export type InviteRow = typeof editInvites.$inferSelect;
