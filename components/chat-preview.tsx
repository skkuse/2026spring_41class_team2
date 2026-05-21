"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle, ArrowRight, Sparkles } from "lucide-react"

const popularQuestions = [
  "잔잔하고 여운 남는 일본 로맨스 영화 추천해줘",
  "좀비가 등장하는 숨 막히는 공포 영화 추천해줘",
  "어두운 범죄 스릴러 중에 분위기 묵직한 거 추천해줘",
  "우주 배경의 SF 모험 영화 찾아줘",
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
              조건에 맞는 영화를 찾아보세요
            </h2>
            <p className="mt-3 text-muted-foreground">
              장르, 제작 국가, 언어, 러닝타임, 분위기나 소재를 입력하면 AI가 조건에 맞는 영화를 추천해드립니다.
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
