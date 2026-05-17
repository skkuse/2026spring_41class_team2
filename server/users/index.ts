import "server-only"

import { createUserRepository } from "./user-repository"
import { createUserService } from "./user-service"

export const userRepository = createUserRepository()
export const userService = createUserService({ userRepository })

