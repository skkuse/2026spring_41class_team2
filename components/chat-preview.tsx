"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle, ArrowRight, Sparkles } from "lucide-react"

const popularQuestions = [
  "크리스토퍼 놀란 영화 중 입문용 추천해줘",
  "가족이랑 보기 좋은 감동 영화 알려줘",
  "기생충 좋아한 사람이 볼 만한 한국 영화는?",
  "넷플릭스에서 볼 수 있는 스릴러 영화 추천해줘",
]

export function ChatPreview() {
  return (
    <section className="py-12">
      <div className="rounded-2xl bg-card p-6 md:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">AI 영화 추천</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              무엇이든 물어보세요
            </h2>
            <p className="mt-3 text-muted-foreground">
              자연어로 질문하면 AI가 당신의 취향에 맞는 영화를 추천해드립니다.
              연속 대화로 원하는 영화를 점진적으로 찾아보세요.
            </p>
            <Link href="/chat">
              <Button className="mt-6" size="lg">
                <MessageCircle className="mr-2 h-5 w-5" />
                대화 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex-1 lg:max-w-md">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              자주 묻는 질문
            </h3>
            <div className="flex flex-col gap-3">
              {popularQuestions.map((question, index) => (
                <Link key={index} href={`/chat?q=${encodeURIComponent(question)}`}>
                  <div className="group flex items-center justify-between rounded-xl bg-secondary/50 p-4 transition-colors hover:bg-secondary">
                    <span className="text-sm">{question}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
