import { describe, expect, it, vi } from "vitest"
import { runSequentially } from "./page"

describe("recommendation chat debug page", () => {
  it("runs items one by one and publishes each result before the next item starts", async () => {
    const events: string[] = []

    const results = await runSequentially(
      ["first", "second", "third"],
      async (item) => {
        events.push(`start:${item}`)
        return `done:${item}`
      },
      (result) => {
        events.push(`result:${result}`)
      },
    )

    expect(results).toEqual(["done:first", "done:second", "done:third"])
    expect(events).toEqual([
      "start:first",
      "result:done:first",
      "start:second",
      "result:done:second",
      "start:third",
      "result:done:third",
    ])
  })

  it("does not start the next item until the current worker resolves", async () => {
    let activeWorkers = 0
    let maxActiveWorkers = 0
    const worker = vi.fn(async (item: string) => {
      activeWorkers += 1
      maxActiveWorkers = Math.max(maxActiveWorkers, activeWorkers)
      await Promise.resolve()
      activeWorkers -= 1
      return item
    })

    await runSequentially(["a", "b", "c"], worker, vi.fn())

    expect(worker).toHaveBeenNthCalledWith(1, "a", 0)
    expect(worker).toHaveBeenNthCalledWith(2, "b", 1)
    expect(worker).toHaveBeenNthCalledWith(3, "c", 2)
    expect(maxActiveWorkers).toBe(1)
  })
})
