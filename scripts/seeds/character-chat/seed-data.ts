import { darkKnightCharacters } from "../../../data/seeds/character-chat/movies/155/characters.config"
import { darkKnightDefaultQuestions } from "../../../data/seeds/character-chat/movies/155/default-questions.config"
import { darkKnightEvents } from "../../../data/seeds/character-chat/movies/155/events.config"
import { oldboyCharacters } from "../../../data/seeds/character-chat/movies/670/characters.config"
import { oldboyDefaultQuestions } from "../../../data/seeds/character-chat/movies/670/default-questions.config"
import { oldboyEvents } from "../../../data/seeds/character-chat/movies/670/events.config"

import type { CharacterChatMovieSeedConfig } from "./seed-types"
import { DARK_KNIGHT_MOVIE_ID } from "./seed-utils"

export const characterChatMovieSeeds: CharacterChatMovieSeedConfig[] = [
  {
    movieId: DARK_KNIGHT_MOVIE_ID,
    characters: darkKnightCharacters,
    events: darkKnightEvents,
    defaultQuestions: darkKnightDefaultQuestions,
  },
  {
    movieId: 670,
    characters: oldboyCharacters,
    events: oldboyEvents,
    defaultQuestions: oldboyDefaultQuestions,
  },
]
