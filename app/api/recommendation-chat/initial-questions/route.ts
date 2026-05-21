import { NextResponse } from "next/server"
import { recommendationChatService } from "@/server/recommendation-chat"
import { recommendationChatInitialQuestionsResponseSchema } from "@/server/recommendation-chat/recommendation-chat-schema"

export async function GET() {
  return NextResponse.json(recommendationChatInitialQuestionsResponseSchema.parse(recommendationChatService.listInitialQuestions()))
}
