"use client"
import Link from "next/link"
import { LayoutList, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutList className="size-4 text-orange-500" />
            Problems
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground mb-2">
            Manage all problems — create, edit, delete.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href="/admin/problems">View All</Link>
            </Button>
            <Button asChild size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              <Link href="/admin/problems/new">
                <Plus className="size-4" /> New
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
