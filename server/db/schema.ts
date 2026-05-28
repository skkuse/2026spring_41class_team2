import { sql } from "drizzle-orm"
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core"

export const movies = pgTable(
  "movies",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    movielensId: bigint("movielens_id", { mode: "number" }).notNull(),
    title: text("title").notNull(),
    originalTitle: text("original_title"),
    overview: text("overview"),
    releaseDate: date("release_date"),
    releaseYear: integer("release_year"),
    runtime: integer("runtime"),
    originalLanguage: text("original_language"),
    productionCountries: jsonb("production_countries").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    trailerUrl: text("trailer_url"),
    adult: boolean("adult").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("movies_movielens_id_key").on(table.movielensId),
    index("movies_release_year_idx").on(table.releaseYear),
  ],
)

export const genres = pgTable("genres", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  nameKo: text("name_ko"),
})

export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: bigint("genre_id", { mode: "number" })
      .notNull()
      .references(() => genres.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
    index("movie_genres_genre_id_idx").on(table.genreId),
  ],
)

export const people = pgTable("people", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  profilePath: text("profile_path"),
  knownForDepartment: text("known_for_department"),
  popularity: numeric("popularity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const movieCasts = pgTable(
  "movie_casts",
  {
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => people.id, { onDelete: "restrict" }),
    characterName: text("character_name").notNull(),
    castOrder: integer("cast_order"),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.personId, table.characterName] }),
    index("movie_casts_person_id_idx").on(table.personId),
    index("movie_casts_movie_id_cast_order_idx").on(table.movieId, table.castOrder),
  ],
)

export const movieCrew = pgTable(
  "movie_crew",
  {
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    personId: bigint("person_id", { mode: "number" })
      .notNull()
      .references(() => people.id, { onDelete: "restrict" }),
    department: text("department").notNull(),
    job: text("job").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.personId, table.department, table.job] }),
    index("movie_crew_person_id_idx").on(table.personId),
    index("movie_crew_movie_id_job_idx").on(table.movieId, table.job),
  ],
)

export const movieStats = pgTable(
  "movie_stats",
  {
    movieId: bigint("movie_id", { mode: "number" })
      .primaryKey()
      .references(() => movies.id, { onDelete: "cascade" }),
    movielensAvgRating: numeric("movielens_avg_rating", { precision: 3, scale: 2 }).notNull(),
    movielensRatingCount: integer("movielens_rating_count").notNull().default(0),
    cinemateRatingSum: numeric("cinemate_rating_sum", { precision: 10, scale: 2 }).notNull().default("0"),
    cinemateReviewCount: integer("cinemate_review_count").notNull().default(0),
    userTagCount: integer("user_tag_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "movie_stats_movielens_avg_rating_range_check",
      sql`${table.movielensAvgRating} >= 0 and ${table.movielensAvgRating} <= 5`,
    ),
    check("movie_stats_movielens_rating_count_check", sql`${table.movielensRatingCount} >= 0`),
    check("movie_stats_cinemate_rating_sum_check", sql`${table.cinemateRatingSum} >= 0`),
    check("movie_stats_cinemate_review_count_check", sql`${table.cinemateReviewCount} >= 0`),
    check("movie_stats_user_tag_count_check", sql`${table.userTagCount} >= 0`),
    index("movie_stats_fallback_idx").on(table.movielensRatingCount.desc(), table.movielensAvgRating.desc()),
  ],
)

export const movieSimilarities = pgTable(
  "movie_similarities",
  {
    sourceMovieId: bigint("source_movie_id", { mode: "number" })
      .notNull()
      .references(() => movieStats.movieId, { onDelete: "cascade" }),
    targetMovieId: bigint("target_movie_id", { mode: "number" })
      .notNull()
      .references(() => movieStats.movieId, { onDelete: "cascade" }),
    score: real("score").notNull(),
    coRatingCount: integer("co_rating_count").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.sourceMovieId, table.targetMovieId] }),
    check("movie_similarities_no_self_reference_check", sql`${table.sourceMovieId} <> ${table.targetMovieId}`),
    check("movie_similarities_score_positive_check", sql`${table.score} > 0`),
    check("movie_similarities_co_rating_count_check", sql`${table.coRatingCount} >= 0`),
    index("movie_similarities_source_score_idx").on(table.sourceMovieId, table.score.desc()),
  ],
)

export const movieTags = pgTable(
  "movie_tags",
  {
    tagId: integer("tag_id").primaryKey(),
    tag: text("tag").notNull(),
  },
  (table) => [uniqueIndex("movie_tags_tag_key").on(table.tag)],
)

export const movieTagRelevances = pgTable(
  "movie_tag_relevances",
  {
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => movieTags.tagId, { onDelete: "restrict" }),
    relevance: real("relevance").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.tagId] }),
    check("movie_tag_relevances_relevance_range_check", sql`${table.relevance} >= 0 and ${table.relevance} <= 1`),
    index("movie_tag_relevances_tag_relevance_movie_idx").on(table.tagId, table.relevance.desc(), table.movieId),
    index("movie_tag_relevances_movie_relevance_idx").on(table.movieId, table.relevance.desc()),
  ],
)

export const movieTagMappingEmbeddings = pgTable(
  "movie_tag_mapping_embeddings",
  {
    tagId: integer("tag_id")
      .notNull()
      .references(() => movieTags.tagId, { onDelete: "restrict" }),
    embeddingModel: text("embedding_model").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.tagId, table.embeddingModel] }),
    index("movie_tag_mapping_embeddings_embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
)

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  profileImageUrl: text("profile_image_url"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type ProfileRow = typeof profiles.$inferSelect

export const movieBookmarks = pgTable(
  "movie_bookmarks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.movieId] }),
    index("movie_bookmarks_movie_id_idx").on(table.movieId),
  ],
)

export const userOnboardingMovies = pgTable(
  "user_onboarding_movies",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.movieId] }),
    uniqueIndex("user_onboarding_movies_user_position_key").on(table.userId, table.position),
    index("user_onboarding_movies_movie_id_idx").on(table.movieId),
    check("user_onboarding_movies_position_range_check", sql`${table.position} >= 1 and ${table.position} <= 5`),
  ],
)

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reviews_user_movie_key").on(table.userId, table.movieId),
    index("reviews_movie_id_created_at_idx").on(table.movieId, table.createdAt.desc()),
    check("reviews_rating_range_check", sql`${table.rating} >= 0.5 and ${table.rating} <= 5.0`),
  ],
)

export const reviewLikes = pgTable(
  "review_likes",
  {
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.reviewId, table.userId] }),
    index("review_likes_user_id_idx").on(table.userId),
  ],
)

export const recommendationChatConversations = pgTable(
  "recommendation_chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("recommendation_chat_conversations_user_id_key").on(table.userId),
    index("recommendation_chat_conversations_user_updated_at_idx").on(table.userId, table.updatedAt.desc()),
  ],
)

export const recommendationChatConversationMessages = pgTable(
  "recommendation_chat_conversation_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => recommendationChatConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    analysisResult: jsonb("analysis_result"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("recommendation_chat_messages_conversation_created_at_idx").on(table.conversationId, table.createdAt),
    check("recommendation_chat_messages_role_check", sql`${table.role} in ('request', 'response')`),
  ],
)

export const recommendationChatConversationMessageMovies = pgTable(
  "recommendation_chat_conversation_message_movies",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => recommendationChatConversationMessages.id, { onDelete: "cascade" }),
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    reason: text("reason").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.movieId] }),
    index("recommendation_chat_message_movies_movie_id_idx").on(table.movieId),
    check("recommendation_chat_message_movies_rank_check", sql`${table.rank} > 0`),
  ],
)

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    actorPersonId: bigint("actor_person_id", { mode: "number" }).references(() => people.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    greeting: text("greeting").notNull(),
    personaPrompt: text("persona_prompt").notNull(),
    avatarStoragePath: text("avatar_storage_path").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("characters_movie_name_key").on(table.movieId, table.name),
    index("characters_movie_id_idx").on(table.movieId),
    index("characters_actor_person_id_idx").on(table.actorPersonId),
  ],
)

export const characterChatEvents = pgTable(
  "character_chat_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    movieId: bigint("movie_id", { mode: "number" })
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    eventOrder: integer("event_order").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("character_chat_events_movie_event_order_key").on(table.movieId, table.eventOrder),
    index("character_chat_events_movie_event_order_idx").on(table.movieId, table.eventOrder),
  ],
)

export const characterChatEventParticipants = pgTable(
  "character_chat_event_participants",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => characterChatEvents.id, { onDelete: "cascade" }),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    perspectiveSummary: text("perspective_summary").notNull(),
    emotionalImpact: text("emotional_impact").notNull(),
    knowledgeState: text("knowledge_state").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.characterId] }),
    index("character_chat_event_participants_character_id_idx").on(table.characterId),
  ],
)

export const characterChatDefaultQuestions = pgTable(
  "character_chat_default_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("character_chat_default_questions_character_display_order_key").on(
      table.characterId,
      table.displayOrder,
    ),
    check("character_chat_default_questions_display_order_check", sql`${table.displayOrder} > 0`),
  ],
)

export const characterChatConversations = pgTable(
  "character_chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("character_chat_conversations_user_updated_at_idx").on(table.userId, table.updatedAt.desc()),
    index("character_chat_conversations_character_id_idx").on(table.characterId),
  ],
)

export const characterChatConversationMessages = pgTable(
  "character_chat_conversation_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => characterChatConversations.id, { onDelete: "cascade" }),
    senderType: text("sender_type").notNull().$type<"user" | "character">(),
    content: text("content").notNull(),
    suggestedQuestions: jsonb("suggested_questions").$type<string[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("character_chat_messages_conversation_created_at_idx").on(table.conversationId, table.createdAt),
    check("character_chat_conversation_messages_sender_type_check", sql`${table.senderType} in ('user', 'character')`),
  ],
)
